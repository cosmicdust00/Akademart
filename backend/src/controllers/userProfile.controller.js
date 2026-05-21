const { v4: uuidv4 } = require('uuid');
const driver = require('../config/neo4j');

// POST /api/users/profile/update-persona
const updateUserPersona = async (req, res) => {
    const { userId } = req.params;
    const session = driver.session();

    try {
        const query = `
            MATCH (u:User {user_id: $userId})-[:BOUGHT]->(p:Product)
            WITH u, avg(p.price) AS avgSpent
            REMOVE u:BudgetShopper, u:PremiumShopper
            
            // Set propertinya
            SET u.persona = CASE 
                WHEN avgSpent < 500000 THEN 'BudgetShopper' 
                ELSE 'PremiumShopper' 
            END
            
            // Set labelnya menggunakan FOREACH
            FOREACH (ignore IN CASE WHEN avgSpent < 500000 THEN [1] ELSE [] END | SET u:BudgetShopper)
            FOREACH (ignore IN CASE WHEN avgSpent >= 500000 THEN [1] ELSE [] END | SET u:PremiumShopper)
            
            RETURN u.persona AS persona
        `;

        const result = await session.executeWrite(tx => tx.run(query, { userId }));
        const persona = result.records[0].get('persona');

        res.status(200).json({ message: "Profil user diperbarui.", persona });
    } catch (error) {
        res.status(500).json({ error: "Gagal memperbarui profil." });
    } finally {
        await session.close();
    }
};

const setExplicitInterests = async (req, res) => {
    const userId = req.user.user_id;
    const { interests } = req.body;
    // { "interests": ["Web Development", "Sistem Tertanam", "Networking"] }

    if (!interests || !Array.isArray(interests) || interests.length === 0) {
        return res.status(400).json({ error: "Minimal satu minat wajib dipilih." });
    }

    const session = driver.session();

    // Sistem menentukan bobot awal untuk pilihan eksplisit
    // Nilai 10 cukup besar untuk menandakan ini adalah "Minat Utama" user saat mendaftar
    const INITIAL_WEIGHT = 10;

    try {
        const query = `
            MATCH (u:User {user_id: $userId})
            
            // Loop melalui array string yang dikirim
            UNWIND $interests AS intName
            
            // Buat node Interest jika belum ada di database
            MERGE (i:Interest {name: intName})
            
            // Buat relasi INTERESTED_IN
            MERGE (u)-[r:INTERESTED_IN]->(i)
            
            // Jika relasi ini baru saja dibuat, berikan bobot dasar (10).
            // Jika sudah ada (user update profil), biarkan bobotnya agar poin dari aktivitas tidak hilang.
            ON CREATE SET 
                r.weight = toInteger($initialWeight),
                r.created_at = datetime(),
                r.source = 'explicit'
            
            // Tandai bahwa ini pernah dipilih manual oleh user, meskipun sebelumnya terbuat otomatis
            ON MATCH SET 
                r.source = 'explicit',
                r.updated_at = datetime()
                
            RETURN i.name AS interest, r.weight AS weight
            ORDER BY weight DESC
        `;

        const result = await session.executeWrite(tx => tx.run(query, {
            userId,
            interests,
            initialWeight: INITIAL_WEIGHT
        }));

        const savedInterests = result.records.map(record => ({
            interest: record.get('interest'),
            weight: record.get('weight').toInt()
        }));

        res.status(200).json({
            message: "Minat user berhasil disimpan oleh sistem.",
            interests: savedInterests
        });
    } catch (error) {
        console.error("Error setting explicit interests:", error);
        res.status(500).json({ error: "Gagal menyimpan minat user." });
    } finally {
        await session.close();
    }
};

const syncImplicitInterests = async (req, res) => {
    const userId = req.user.user_id;
    const session = driver.session();

    try {
        // Query ini akan:
        // Mencari semua interaksi user terhadap barang.
        // Melihat kategori dari barang tersebut.
        // Menghitung skor: BOUGHT (Beli) = +5, LIKED = +3, VIEWED = +1 poin.
        // Menyimpan total skor tersebut sebagai relasi INTERESTED_IN ke node Interest.
        const query = `
            MATCH (u:User {user_id: $userId})-[rel:VIEWED|LIKED|BOUGHT]->(p:Product)-[:BELONGS_TO]->(c:Category)
            
            WITH u, c, type(rel) AS relType, count(rel) AS freq
            
            // Hitung bobot berdasarkan jenis interaksi
            WITH u, c, SUM(
                CASE relType 
                    WHEN 'BOUGHT' THEN 5 * freq 
                    WHEN 'LIKED' THEN 3 * freq 
                    WHEN 'VIEWED' THEN 1 * freq 
                    ELSE 0 
                END
            ) AS score
            
            // Ubah kategori menjadi Interest dan hubungkan dengan user
            MERGE (i:Interest {name: c.name})
            MERGE (u)-[r:INTERESTED_IN]->(i)
            
            // Tambahkan skor baru ke bobot yang sudah ada (atau set jika baru)
            SET r.weight = coalesce(r.weight, 0) + score,
                r.last_calculated = datetime()
                
            RETURN i.name AS interest, r.weight AS currentWeight
            ORDER BY currentWeight DESC
        `;

        const result = await session.executeWrite(tx => tx.run(query, { userId }));
        const updatedProfile = result.records.map(record => ({
            interest: record.get('interest'),
            weight: record.get('currentWeight').toInt() // Neo4j integer perlu diubah ke JS integer
        }));

        res.status(200).json({
            message: "Profil minat otomatis berhasil disinkronisasi berdasarkan aktivitas.",
            profile: updatedProfile
        });
    } catch (error) {
        console.error("Error syncing implicit interests:", error);
        res.status(500).json({ error: "Gagal menyinkronkan profil otomatis." });
    } finally {
        await session.close();
    }
};

const updateProfile = async (req, res) => {
    const userId = req.user.user_id;
    // Semua data ini bersifat opsional, user boleh mengirim hanya satu atau semuanya
    const { full_name, fakultas, prodi, organisasi, matakuliah, interests } = req.body;

    const session = driver.session();

    // Kita gunakan Transaction manual (beginTransaction) agar bisa menjalankan beberapa query Cypher secara terpisah namun dalam satu kesatuan proses.
    const tx = session.beginTransaction();

    try {
        // Update Properti Teks Biasa (Contoh: full_name)
        if (full_name) {
            await tx.run(
                `MATCH (u:User {user_id: $userId}) SET u.full_name = $full_name`,
                { userId, full_name }
            );
        }

        // Update Fakultas
        if (fakultas) {
            await tx.run(`
                MATCH (u:User {user_id: $userId})
                // Hapus relasi fakultas yang lama jika sebelumnya sudah ada
                OPTIONAL MATCH (u)-[r:STUDIES_IN_FAKULTAS]->(:Fakultas)
                DELETE r
                
                // Buat node Fakultas baru (jika belum ada) dan hubungkan
                WITH u
                MERGE (f:Fakultas {name: $fakultas})
                MERGE (u)-[:STUDIES_IN_FAKULTAS]->(f)
            `, { userId, fakultas });
        }

        // Update Prodi
        if (prodi) {
            await tx.run(`
                MATCH (u:User {user_id: $userId})
                OPTIONAL MATCH (u)-[r:STUDIES_IN_PRODI]->(:Prodi)
                DELETE r
                
                WITH u
                MERGE (p:Prodi {name: $prodi})
                MERGE (u)-[:STUDIES_IN_PRODI]->(p)
            `, { userId, prodi });
        }

        // Update Matakuliah
        if (matakuliah && Array.isArray(matakuliah)) {
            await tx.run(`
                MATCH (u:User {user_id: $userId})
                // Hapus mata kuliah semester lalu (reset)
                OPTIONAL MATCH (u)-[r:TAKES_COURSE]->(:MataKuliah)
                DELETE r
                
                // Loop array matakuliah, buat node-nya, dan hubungkan
                WITH u
                UNWIND $matakuliah AS mkName
                MERGE (m:MataKuliah {name: mkName})
                MERGE (u)-[:TAKES_COURSE]->(m)
            `, { userId, matakuliah });
        }

        if (interests && Array.isArray(interests)) {
            await tx.run(`
                MATCH (u:User {user_id: $userId})
                UNWIND $interests AS intName
                MERGE (i:Interest {name: intName})
                MERGE (u)-[r:INTERESTED_IN]->(i)
                ON CREATE SET r.weight = 10, r.source = 'explicit'
                ON MATCH SET r.source = 'explicit'
            `, { userId, interests });
        }

        // Update Organisasi
        // { "organisasi": ["BEM", "HIMA", "UKM Musik"] }
        if (organisasi && Array.isArray(organisasi)) {
            await tx.run(`
                MATCH (u:User {user_id: $userId})
                // Hapus semua keanggotaan organisasi lama (reset)
                OPTIONAL MATCH (u)-[r:MEMBER_OF]->(:Organisasi)
                DELETE r
                
                // Loop array organisasi, buat node-nya, dan hubungkan
                WITH u
                UNWIND $organisasi AS orgName
                MERGE (o:Organisasi {name: orgName})
                MERGE (u)-[:MEMBER_OF]->(o)
            `, { userId, organisasi });
        }

        // Jika semua query di atas berhasil tanpa error, simpan permanen ke database
        await tx.commit();

        res.status(200).json({ message: "Profil berhasil diperbarui!" });
    } catch (error) {
        // Jika ada error di tengah jalan, batalkan SEMUA perubahan (rollback)
        await tx.rollback();
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Gagal memperbarui profil." });
    } finally {
        await session.close();
    }
};

module.exports = {
    updateUserPersona,
    setExplicitInterests,
    syncImplicitInterests,
    updateProfile
};