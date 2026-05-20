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

module.exports = { 
    updateUserPersona };