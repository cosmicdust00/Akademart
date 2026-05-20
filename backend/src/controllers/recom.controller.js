const driver = require('../config/neo4j');

const getRecommendations = async (req, res) => {
    const userId = req.user.user_id;
    const session = driver.session();

    try {
        // Collaborative Filtering
        // Mencari rekomendasi berdasarkan kemiripan pola BOUGHT, LIKED, atau VIEWED dengan user lain.
        // Kita memastikan status barang 'available' dan user belum men-DISLIKE atau mem-BOUGHT barang tersebut.
        const collabQuery = `
            MATCH (me:User {user_id: $userId})-[:VIEWED|BOUGHT|LIKED]->(p:Product)
            MATCH (other:User)-[:BOUGHT|LIKED]->(p)
            MATCH (other)-[:BOUGHT|LIKED]->(recom:Product)
            WHERE NOT (me)-[:BOUGHT]->(recom) 
              AND NOT (me)-[:DISLIKED]->(recom) 
              AND recom <> p
              AND recom.status = 'available'
            RETURN recom {
                .product_id,
                .name,
                .price,
                .image_url,
                .status
            } AS product, count(recom) AS weight
            ORDER BY weight DESC LIMIT 5
        `;

        const collabResult = await session.executeRead(tx => tx.run(collabQuery, { userId }));
        let recommendations = collabResult.records.map(record => record.get('product'));

        // Jika user masih baru (belum ada interaksi) atau tidak ada kecocokan, berikan rekomendasi "Trending/Populer" (Fallback).
        if (recommendations.length === 0) {
            const trendingQuery = `
                MATCH (p:Product {status: 'available'})
                OPTIONAL MATCH (p)<-[r:VIEWED|LIKED|BOUGHT]-()
                WHERE NOT (:User {user_id: $userId})-[:DISLIKED]->(p)
                RETURN p {
                    .product_id,
                    .name,
                    .price,
                    .image_url,
                    .status
                } AS product, count(r) AS popularity
                ORDER BY popularity DESC LIMIT 5
            `;
            
            const trendingResult = await session.executeRead(tx => tx.run(trendingQuery, { userId }));
            recommendations = trendingResult.records.map(record => record.get('product'));
        }

        res.status(200).json(recommendations);

    } catch (error) {
        console.error("Error fetching recommendations:", error);
        res.status(500).json({ error: "Gagal mengambil data rekomendasi." });
    } finally {
        await session.close();
    }
};

module.exports = {
    getRecommendations
};