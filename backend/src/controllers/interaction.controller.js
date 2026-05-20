const { v4: uuidv4 } = require('uuid');
const driver = require('../config/neo4j');

// POST /api/interactions/view
const viewProduct = async (req, res) => {
    const userId = req.user.user_id;
    const { productId } = req.body;
    const session = driver.session();

    try {
        const query = `
            MATCH (u:User {user_id: $userId})
            MATCH (p:Product {product_id: $productId})
            MERGE (u)-[r:VIEWED]->(p)
            ON CREATE SET r.first_viewed = datetime(), r.timestamp = datetime()
            ON MATCH SET r.timestamp = datetime()
            RETURN r
        `;

        await session.executeWrite(tx => tx.run(query, { userId, productId }));

        res.status(200).json({
            message: "Interaksi view dicatat/diperbarui."
        });
    } catch (error) {
        console.error("Error logging view:", error);
        res.status(500).json({ error: "Gagal mencatat interaksi." });
    } finally {
        await session.close();
    }
};

// POST /api/interactions/buy
const buyProduct = async (req, res) => {
    const userId = req.user.user_id;
    const { productId } = req.body;
    const session = driver.session();

    try {
        const query = `
            MATCH (u:User {user_id: $userId})
            MATCH (p:Product {product_id: $productId})
            WHERE p.stock > 0
            
            CREATE (u)-[r:BOUGHT_PENDING {
                date: datetime(),
                transaction_id: $transactionId
            }]->(p)
            
            SET p.stock = p.stock - 1,
                p.status = CASE WHEN p.stock = 0 THEN 'out_of_stock' ELSE p.status END
            
            RETURN p
        `;
        
        const result = await session.executeWrite(tx => tx.run(query, { 
            userId, 
            productId,
            transactionId: uuidv4() 
        }));

        if (result.records.length === 0) {
            return res.status(400).json({ error: "Barang sudah habis atau tidak ditemukan." });
        }

        res.status(200).json({ message: "Pesanan dibuat, menunggu konfirmasi penjual." });
    } catch (error) {
        console.error("Error buying product:", error);
        res.status(500).json({ error: "Gagal memproses pesanan." });
    } finally {
        await session.close();
    }
};

// POST /api/interactions/like
const likeProduct = async (req, res) => {
    const userId = req.user.user_id;
    const { productId } = req.body;
    const session = driver.session();

    try {
        const query = `
            MATCH (u:User {user_id: $userId}), (p:Product {product_id: $productId})
            // Hapus relasi DISLIKED jika ada
            OPTIONAL MATCH (u)-[r_dislike:DISLIKED]->(p)
            DELETE r_dislike
            // Buat relasi LIKED
            MERGE (u)-[r:LIKED]->(p)
            SET r.timestamp = datetime()
            RETURN r
        `;
        await session.executeWrite(tx => tx.run(query, { userId, productId }));
        res.status(200).json({ message: "Produk berhasil disukai!" });
    } catch (error) {
        res.status(500).json({ error: "Gagal menyukai produk." });
    } finally {
        await session.close();
    }
};

// POST /api/interactions/dislike
const dislikeProduct = async (req, res) => {
    const userId = req.user.user_id;
    const { productId } = req.body;
    const session = driver.session();

    try {
        // Hapus LIKED jika ada, lalu buat DISLIKED
        const query = `
            MATCH (u:User {user_id: $userId}), (p:Product {product_id: $productId})
            OPTIONAL MATCH (u)-[r_like:LIKED]->(p)
            DELETE r_like
            WITH u, p
            MERGE (u)-[r_dislike:DISLIKED]->(p)
            SET r_dislike.timestamp = datetime()
        `;
        await session.executeWrite(tx => tx.run(query, { userId, productId }));
        res.status(200).json({ message: "Produk diberikan dislike." });
    } catch (error) {
        res.status(500).json({ error: "Gagal memberikan dislike." });
    } finally {
        await session.close();
    }
};

// POST /api/interactions/remove
const removeInteraction = async (req, res) => {
    const userId = req.user.user_id;
    const { productId } = req.body;
    const session = driver.session();

    try {
        // Query ini menghapus relasi LIKED atau DISLIKED antara user dan produk
        const query = `
            MATCH (u:User {user_id: $userId})-[r]->(p:Product {product_id: $productId})
            WHERE type(r) IN ['LIKED', 'DISLIKED']
            DELETE r
        `;

        await session.executeWrite(tx => tx.run(query, { userId, productId }));

        res.status(200).json({ 
            message: "Interaksi (Like/Dislike) berhasil dibatalkan." 
        });
    } catch (error) {
        console.error("Error removing interaction:", error);
        res.status(500).json({ error: "Gagal membatalkan interaksi." });
    } finally {
        await session.close();
    }
};

module.exports = {
    viewProduct,
    buyProduct,
    likeProduct,
    dislikeProduct,
    removeInteraction
};