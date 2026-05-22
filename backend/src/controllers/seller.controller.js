const driver = require('../config/neo4j');

// POST /api/seller/orders/confirm
const confirmSale = async (req, res) => {
    const sellerId = req.user.user_id;
    const { productId } = req.body;
    const session = driver.session();

    try {
        const query = `
            MATCH (seller:User {user_id: $sellerId})-[:SELLING]->(p:Product {product_id: $productId})
            MATCH (buyer:User)-[pendingRel:BOUGHT_PENDING]->(p)
            
            // Buat relasi BOUGHT yang permanen
            MERGE (buyer)-[b:BOUGHT]->(p)
            ON CREATE SET 
                b.transaction_id = pendingRel.transaction_id,
                b.date = datetime()
            ON MATCH SET 
                b.date = datetime()
            
            // Hapus relasi pending setelah dikonfirmasi
            DELETE pendingRel
            
            // Update status produk berdasarkan sisa stok
            SET p.status = CASE 
                WHEN p.stock > 0 THEN 'available' 
                ELSE 'sold' 
            END
            
            RETURN buyer.username AS buyer
        `;
        
        const result = await session.executeWrite(tx => tx.run(query, { sellerId, productId }));
        
        if (result.records.length === 0) {
            return res.status(400).json({ error: "Tidak ada pesanan pending yang bisa dikonfirmasi untuk produk ini." });
        }

        res.status(200).json({ message: "Transaksi COD berhasil dikonfirmasi dan status produk diperbarui." });
    } catch (error) {
        console.error("Error confirming sale:", error);
        res.status(500).json({ error: "Gagal memproses konfirmasi." });
    } finally {
        await session.close();
    }
};

// PATCH /api/seller/products/:productId/stock
const updateStock = async (req, res) => {
    const { productId } = req.params;
    const { amount, operation } = req.body;
    const session = driver.session();

    try {
        const query = `
            MATCH (p:Product {product_id: $productId})
            
            WITH p, coalesce(toInteger(p.stock), 0) AS currentStock
            
            SET p.stock = CASE 
                WHEN $operation = 'add' THEN currentStock + toInteger($amount)
                WHEN $operation = 'subtract' THEN currentStock - toInteger($amount)
                WHEN $operation = 'set' THEN toInteger($amount)
                ELSE currentStock 
            END
            
            // Pastikan stok tidak negatif
            SET p.stock = CASE WHEN p.stock < 0 THEN 0 ELSE p.stock END
            
            // Konsistensi status ke huruf kecil
            SET p.status = CASE WHEN p.stock > 0 THEN 'available' ELSE 'out_of_stock' END
            
            RETURN p.stock AS updatedStock
        `;

        const result = await session.executeWrite(tx => tx.run(query, { productId, amount, operation }));
        
        // Pengecekan jika produk ternyata tidak ditemukan di database
        if (result.records.length === 0) {
             return res.status(404).json({ error: "Produk tidak ditemukan di database." });
        }

        const updatedStock = result.records[0].get('updatedStock');
        res.status(200).json({ message: "Stok berhasil diperbarui.", currentStock: updatedStock });
        
    } catch (error) {
        console.error("Error updating sale:", error);
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
            MATCH (u:User {user_id: $buyerId})-[r:BOUGHT_PENDING]->(p:Product {product_id: $productId})
            DELETE r
            SET p.stock = p.stock + 1
            
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

// GET /api/seller/products
const getMyProducts = async (req, res) => {
    const userId = req.user.user_id;
    const session = driver.session();
    try {
        const query = `
            MATCH (u:User {user_id: $userId})-[:SELLING]->(p:Product)
            OPTIONAL MATCH (p)-[:BELONGS_TO]->(c:Category)
            OPTIONAL MATCH (buyer:User)-[pending:BOUGHT_PENDING]->(p)
            OPTIONAL MATCH ()-[v:VIEWED]->(p)
            OPTIONAL MATCH ()-[b:BOUGHT]->(p)
            WITH p, collect(DISTINCT c.name) AS categories, count(DISTINCT v) AS views, 
                 count(DISTINCT b) AS sold, count(DISTINCT pending) > 0 AS hasPending
            RETURN p {
                .*,
                status: CASE WHEN hasPending THEN 'bought_pending' ELSE p.status END,
                category: CASE WHEN size(categories) > 0 THEN categories[0] ELSE 'Lainnya' END,
                views: views,
                sold: sold
            } AS product
            ORDER BY product.created_at DESC
        `;
        
        const result = await session.executeRead(tx => tx.run(query, { userId }));
        const products = result.records.map(record => record.get('product'));
        
        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching seller products:", error);
        res.status(500).json({ error: "Gagal mengambil data toko Anda." });
    } finally {
        await session.close();
    }
};

// DELETE /api/seller/products/:productId
const deleteProduct = async (req, res) => {
    const userId = req.user.user_id;
    const { productId } = req.params;
    const session = driver.session();

    try {
        // DETACH DELETE akan menghapus node Product beserta semua relasinya (SELLING, LIKED, dll)
        const query = `
            MATCH (u:User {user_id: $userId})-[:SELLING]->(p:Product {product_id: $productId})
            DETACH DELETE p
        `;
        await session.executeWrite(tx => tx.run(query, { userId, productId }));
        res.status(200).json({ message: "Produk berhasil dihapus." });
    } catch (error) {
        res.status(500).json({ error: "Gagal menghapus produk." });
    } finally {
        await session.close();
    }
};

module.exports = { confirmSale, updateStock, cancelSale, getMyProducts, deleteProduct };