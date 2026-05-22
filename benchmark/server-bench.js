const express = require('express');
const neo4j = require('neo4j-driver');
const { Client } = require('pg');

const app = express();
// Sesuaikan password dan port (5433) sesuai yang kita setup sebelumnya
const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'password'));
const pgClient = new Client({ connectionString: 'postgresql://postgres:password@localhost:5433/postgres' });

let targetUserId;

// Jalankan koneksi dan ambil 1 User ID acak saat server menyala
pgClient.connect().then(async () => {
    const res = await pgClient.query('SELECT id FROM users LIMIT 1');
    targetUserId = res.rows[0].id;
    console.log(`Database terkoneksi. Target User ID: ${targetUserId}`);
});

// Endpoint 1: Rute PostgreSQL (SQL)
app.get('/api/sql', async (req, res) => {
    const sqlQuery = `
        SELECT DISTINCT p.id, p.name 
        FROM products p
        JOIN interactions i3 ON p.id = i3.product_id
        JOIN users other_user ON i3.user_id = other_user.id
        JOIN interactions i2 ON other_user.id = i2.user_id
        JOIN interactions i1 ON i2.product_id = i1.product_id
        WHERE i1.user_id = $1 AND i3.product_id NOT IN (
            SELECT product_id FROM interactions WHERE user_id = $1
        ) LIMIT 10;
    `;
    try {
        const result = await pgClient.query(sqlQuery, [targetUserId]);
        res.json(result.rows);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// Endpoint 2: Rute Neo4j (Graph)
app.get('/api/neo4j', async (req, res) => {
    const neoQuery = `
        MATCH (me:User {id: $userId})-[:BOUGHT]->(commonProd:Product)<-[:BOUGHT]-(other:User)-[:BOUGHT]->(recom:Product)
        WHERE NOT (me)-[:BOUGHT]->(recom)
        RETURN DISTINCT recom.id, recom.name LIMIT 10
    `;
    const session = driver.session();
    try {
        const result = await session.run(neoQuery, { userId: targetUserId });
        res.json(result.records);
    } catch (e) {
        res.status(500).send(e.message);
    } finally {
        await session.close();
    }
});

app.listen(4000, () => {
    console.log('Server Benchmark berjalan di http://localhost:4000');
});