const driver = require('../config/neo4j');

// POST /api/seller/orders/confirm
const confirmSale = async (req, res) => {
    const { productId, buyerId } = req.body; // Butuh buyerId untuk mencari relasi yang benar
    const session = driver.session();

    try {
        const query = `
            MATCH (u:User {user_id: $buyerId})-[r:BOUGHT_PENDING]->(p:Product {product_id: $productId})
            DELETE r
            CREATE (u)-[:BOUGHT {date: datetime()}]->(p)
            RETURN p
        `;
        await session.executeWrite(tx => tx.run(query, { buyerId, productId }));
        res.status(200).json({ message: "Penjualan dikonfirmasi, barang terjual." });
    } catch (error) {
        res.status(500).json({ error: "Gagal mengonfirmasi pesanan." });
    } finally {
        await session.close();
    }
};

// PATCH /api/seller/products/:productId/stock
const updateStock = async (req, res) => {
    const { productId, amount, operation } = req.body; 
    // operation bisa: 'add', 'subtract', atau 'set'
    const session = driver.session();

    try {
        const query = `
            MATCH (p:Product {product_id: $productId})
            SET p.stock = CASE 
                WHEN $operation = 'add' THEN p.stock + toInteger($amount)
                WHEN $operation = 'subtract' THEN p.stock - toInteger($amount)
                WHEN $operation = 'set' THEN toInteger($amount)
                ELSE p.stock 
            END
            // Pastikan stok tidak negatif
            SET p.stock = CASE WHEN p.stock < 0 THEN 0 ELSE p.stock END
            SET p.status = CASE WHEN p.stock > 0 THEN 'available' ELSE 'out_of_stock' END
            RETURN p.stock AS currentStock
        `;

        const result = await session.executeWrite(tx => tx.run(query, { productId, amount, operation }));
        const currentStock = result.records[0].get('currentStock');

        res.status(200).json({ message: "Stok berhasil diperbarui.", currentStock });
    } catch (error) {
        res.status(500).json({ error: "Gagal memperbarui stok." });
    } finally {
        await session.close();
    }
};

// POST /api/seller/orders/cancel
const cancelSale = async (req, res) => {
    const { productId, buyerId } = req.body;
    const session = driver.session();

    try {
        const query = `
            // Cari relasi pending antara pembeli dan produk
            MATCH (u:User {user_id: $buyerId})-[r:BOUGHT_PENDING]->(p:Product {product_id: $productId})
            
            // Hapus relasi pending tersebut
            DELETE r
            
            // Kembalikan stok produk
            SET p.stock = p.stock + 1
            
            // Update status produk jika stok kembali tersedia
            SET p.status = CASE WHEN p.stock > 0 THEN 'available' ELSE 'out_of_stock' END
            
            RETURN p.stock AS currentStock
        `;

        const result = await session.executeWrite(tx => tx.run(query, { buyerId, productId }));

        if (result.records.length === 0) {
            return res.status(404).json({ error: "Pesanan tidak ditemukan atau sudah diproses." });
        }

        const currentStock = result.records[0].get('currentStock');

        res.status(200).json({ 
            message: "Pesanan berhasil dibatalkan dan stok dikembalikan.", 
            currentStock 
        });
    } catch (error) {
        console.error("Error canceling sale:", error);
        res.status(500).json({ error: "Gagal membatalkan pesanan." });
    } finally {
        await session.close();
    }
};

module.exports = { confirmSale, updateStock, cancelSale };