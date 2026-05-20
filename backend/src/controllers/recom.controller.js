const driver = require('../config/neo4j');

const getRecommendations = async (req, res) => {
    const userId = req.user.user_id;
    const session = driver.session();

    try {
        // Collaborative Query
        const collabQuery = `
            MATCH (me:User {user_id: $userId})-[:VIEWED|BOUGHT|LIKED]->(p:Product)
            MATCH (other:User)-[:BOUGHT|LIKED]->(p)
            MATCH (other)-[:BOUGHT|LIKED]->(recom:Product)
            WHERE NOT (me)-[:BOUGHT]->(recom) 
              AND NOT (me)-[:DISLIKED]->(recom) 
              AND recom <> p
              AND recom.status = 'available'
            
            // CARI PENJUALNYA
            MATCH (seller:User)-[:SELLING]->(recom)
            OPTIONAL MATCH (seller)-[:STUDIES_IN_PRODI]->(pr:Prodi)
            
            // PERBAIKAN RETURN DI SINI
            RETURN recom {
                .*,  // <-- Mengambil semua properti bawaan product termasuk description
                seller_id: seller.user_id,
                seller_name: seller.full_name,
                seller_jurusan: pr.name,
                seller_angkatan: seller.angkatan
            } AS product, count(recom) AS weight
            ORDER BY weight DESC LIMIT 5
        `;

        const collabResult = await session.executeRead(tx => tx.run(collabQuery, { userId }));
        let recommendations = collabResult.records.map(record => record.get('product'));

        // Trending Query (Fallback)
        if (recommendations.length === 0) {
            const trendingQuery = `
                MATCH (seller:User)-[:SELLING]->(p:Product {status: 'available'})
                OPTIONAL MATCH (seller)-[:STUDIES_IN_PRODI]->(pr:Prodi)
                OPTIONAL MATCH (p)<-[r:VIEWED|LIKED|BOUGHT]-()
                WHERE NOT (:User {user_id: $userId})-[:DISLIKED]->(p)
                
                // PERBAIKAN RETURN DI SINI JUGA
                RETURN p {
                    .*,  // <-- Mengambil semua properti bawaan product termasuk description
                    seller_id: seller.user_id,
                    seller_name: seller.full_name,
                    seller_jurusan: pr.name,
                    seller_angkatan: seller.angkatan
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