const { v4: uuidv4 } = require('uuid');
const driver = require('../config/neo4j');
const supabase = require('../config/supabase');

// POST /api/products
const createProduct = async (req, res) => {
    const userId = req.user.user_id; 
    let { name, price, description, categoryNames, stock } = req.body;
    const file = req.file;

    if (typeof categoryNames === 'string') {
        categoryNames = JSON.parse(categoryNames);
    }

    if (!file) {
        return res.status(400).json({ error: "Gambar produk wajib diunggah" });
    }
    
    if (!categoryNames || !Array.isArray(categoryNames) || categoryNames.length === 0) {
        return res.status(400).json({ error: "Minimal satu kategori wajib dipilih." });
    }

    const session = driver.session();

    try {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file.buffer, { contentType: file.mimetype });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);
            
        const imageUrl = publicUrlData.publicUrl;
        const productId = uuidv4();
        
        const query = `
            MATCH (u:User {user_id: $userId})
            CREATE (p:Product {
                product_id: $productId,
                name: $name,
                price: toInteger($price),
                stock: toInteger($stock),
                description: $description,
                image_url: $imageUrl,
                status: 'available',
                created_at: datetime()
            })
            CREATE (u)-[:SELLING]->(p)
            WITH p
            UNWIND $categoryNames AS catName
            MERGE (c:Category {name: catName})
            MERGE (p)-[:BELONGS_TO]->(c)
            RETURN p
        `;

        const result = await session.executeWrite(tx => tx.run(query, {
            userId,
            productId,
            name,
            price: parseInt(price),
            stock: parseInt(stock || 1),
            description,
            imageUrl,
            categoryNames
        }));

        const newProduct = result.records[0].get('p').properties;

        res.status(201).json({
            message: "Produk berhasil ditambahkan dengan kategori!",
            product: newProduct
        });

    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Gagal menambahkan produk." });
    } finally {
        await session.close();
    }
};

// GET /api/products
const getAllProducts = async (req, res) => {
    const session = driver.session();
    try {
        // Query ini akan menarik Produk, mencari siapa yang me-SELLING produk itu, dan mencari dia kuliah di PRODI apa.
        const query = `
            MATCH (u:User)-[:SELLING]->(p:Product {status: 'available'})
            OPTIONAL MATCH (u)-[:STUDIES_IN_PRODI]->(pr:Prodi)
            OPTIONAL MATCH (p)-[:BELONGS_TO]->(c:Category) // <--- TARIK KATEGORI
            WITH p, u, pr, collect(c.name) AS categories
            RETURN p {
                .*, 
                seller_id: u.user_id,
                seller_name: u.full_name,
                seller_jurusan: pr.name,
                seller_angkatan: u.angkatan,
                category: CASE WHEN size(categories) > 0 THEN categories[0] ELSE 'Lainnya' END
            } AS product
            ORDER BY product.created_at DESC
        `;

        const result = await session.executeRead(tx => tx.run(query));

        const products = result.records.map(record => record.get('product'));
        res.status(200).json(products);

    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Gagal mengambil data produk." });
    } finally {
        await session.close();
    }
};

// GET /api/products/:productId/stats
const getProductStats = async (req, res) => {
    const { productId } = req.params;
    const session = driver.session();

    try {
        const query = `
            MATCH (p:Product {product_id: $productId})
            OPTIONAL MATCH (p)<-[:LIKED]-(u_like:User)
            OPTIONAL MATCH (p)<-[:DISLIKED]-(u_dislike:User)
            OPTIONAL MATCH (p)<-[:VIEWED]-(u_view:User)
            RETURN 
                count(DISTINCT u_like) AS likeCount, 
                count(DISTINCT u_dislike) AS dislikeCount,
                count(u_view) AS viewCount
        `;

        const result = await session.executeRead(tx => tx.run(query, { productId }));
        const stats = result.records[0].toObject();

        res.status(200).json({
            productId: productId,
            likes: stats.likeCount.toInt(),
            dislikes: stats.dislikeCount.toInt(),
            views: stats.viewCount.toInt() // Tambahan statistik view
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Gagal mengambil statistik produk." });
    } finally {
        await session.close();
    }
};

const getProductById = async (req, res) => {
    const { id } = req.params;
    const session = driver.session();
    try {
        const query = `
            MATCH (p:Product {product_id: $id})
            MATCH (u:User)-[:SELLING]->(p)
            OPTIONAL MATCH (u)-[:STUDIES_IN_PRODI]->(pr:Prodi)
            RETURN p {
                .*,
                seller_id: u.user_id,
                seller_name: u.full_name,
                seller_jurusan: pr.name,
                seller_angkatan: u.angkatan
            } AS product
        `;
        const result = await session.executeRead(tx => tx.run(query, { id }));
        if (result.records.length === 0) return res.status(404).json({ error: "Produk tidak ada" });
        
        res.status(200).json(result.records[0].get('product'));
    } catch (error) {
        console.error("Error fetching the product:", error);
        res.status(500).json({ error: "Gagal mengambil data produk." });
    } finally {
        await session.close();
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductStats,
    getProductById
};