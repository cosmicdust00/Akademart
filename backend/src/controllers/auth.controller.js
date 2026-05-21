const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid'); 
const driver = require('../config/neo4j.js');

const JWT_SECRET = process.env.JWT_SECRET;

// /api/auth/register
const register = async (req, res) => {
    const { full_name, username, email, password, angkatan } = req.body;

    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const userId = uuidv4();

        const session = driver.session();
        
        await session.executeWrite(tx =>
            tx.run(
                `CREATE (u:User {
                    user_id: $user_id,
                    full_name: $full_name,
                    username: $username,
                    email: $email,
                    password_hash: $password_hash,
                    angkatan: $angkatan,
                    created_at: datetime()
                })`,
                { user_id: userId, full_name, username, email, password_hash: passwordHash, angkatan }
            )
        );

        await session.close();
        res.status(201).json({ message: "User registered successfully!" });

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Failed to register user." });
    }
};

// /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;
    const session = driver.session();
    try {
        // Query untuk mengambil user DAN relasinya sekaligus saat login
        const query = `
            MATCH (u:User {email: $email})
            OPTIONAL MATCH (u)-[:STUDIES_IN_FAKULTAS]->(f:Fakultas)
            OPTIONAL MATCH (u)-[:STUDIES_IN_PRODI]->(p:Prodi)
            RETURN u {.*, fakultas: f.name, prodi: p.name} AS userData
        `;
        
        const result = await session.executeRead(tx => tx.run(query, { email }));
        if (result.records.length === 0) return res.status(401).json({ error: "User not found." });

        const user = result.records[0].get('userData');
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: "Invalid password." });

        const token = jwt.sign({ user_id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({ 
            message: "Login successful!", 
            token, 
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                username: user.username,
                fakultas: user.fakultas,
                prodi: user.prodi
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Login failed." });
    } finally {
        await session.close();
    }
};

const getProfile = async (req, res) => {
    const session = driver.session();
    try {
        const query = `
            MATCH (u:User {user_id: $userId})
            OPTIONAL MATCH (u)-[:STUDIES_IN_FAKULTAS]->(f:Fakultas)
            OPTIONAL MATCH (u)-[:STUDIES_IN_PRODI]->(p:Prodi)
            OPTIONAL MATCH (u)-[:TAKES_COURSE]->(mk:MataKuliah)
            RETURN u, f.name AS fakultas, p.name AS prodi, collect(mk.name) AS matakuliah
        `;
        
        const result = await session.executeRead(tx => tx.run(query, { userId: req.user.user_id }));
        
        if (result.records.length === 0) {
            return res.status(404).json({ error: "User tidak ditemukan di database" });
        }

        const record = result.records[0];
        const userNode = record.get('u').properties;
        
        // Kirim kembali data lengkap ke frontend
        res.status(200).json({
            user: {
                user_id: userNode.user_id,
                email: userNode.email,
                username: userNode.username,
                full_name: userNode.full_name,
                fakultas: record.get('fakultas') || "",
                prodi: record.get('prodi') || "",
                matakuliah: record.get('matakuliah') || []
            }
        });
    } catch (error) {
        console.error("Profile fetch error:", error);
        res.status(500).json({ error: "Gagal mengambil profil lengkap" });
    } finally {
        await session.close();
    }
};

module.exports = { register, login, getProfile };