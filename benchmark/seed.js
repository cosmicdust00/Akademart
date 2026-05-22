const neo4j = require('neo4j-driver');
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Koneksi (password disesuaikan dengan Docker)
const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'password'));
const pgClient = new Client({ connectionString: 'postgresql://postgres:password@localhost:5433/postgres' });

const NUM_USERS = 1000;
const NUM_PRODUCTS = 5000;
const NUM_INTERACTIONS = 50000;

async function runSeed() {
    await pgClient.connect();
    const session = driver.session();

    console.log("Memulai proses seeding data... (Ini butuh waktu beberapa detik)");

    // Setup Skema PostgreSQL
    console.log("Setup Skema PostgreSQL...");
    await pgClient.query(`
        DROP TABLE IF EXISTS interactions, products, users CASCADE;
        CREATE TABLE users (id UUID PRIMARY KEY, name VARCHAR(100));
        CREATE TABLE products (id UUID PRIMARY KEY, name VARCHAR(100), price INT);
        CREATE TABLE interactions (user_id UUID REFERENCES users(id), product_id UUID REFERENCES products(id));
        CREATE INDEX idx_int_user ON interactions(user_id);
        CREATE INDEX idx_int_prod ON interactions(product_id);
    `);

    // Setup Index Neo4j
    console.log("Setup Index Neo4j...");
    await session.run(`CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE`);
    await session.run(`CREATE CONSTRAINT IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE`);

    // Generate Data Dummy
    console.log("Membuat data dummy di memory...");
    const users = Array.from({ length: NUM_USERS }, () => ({ id: uuidv4(), name: `User_${Math.floor(Math.random() * 1000)}` }));
    const products = Array.from({ length: NUM_PRODUCTS }, () => ({ id: uuidv4(), name: `Prod_${Math.floor(Math.random() * 1000)}`, price: 50000 }));
    
    const interactions = [];
    for (let i = 0; i < NUM_INTERACTIONS; i++) {
        interactions.push({
            user_id: users[Math.floor(Math.random() * NUM_USERS)].id,
            product_id: products[Math.floor(Math.random() * NUM_PRODUCTS)].id
        });
    }

    // Insert ke PostgreSQL
    console.log("Memasukkan data ke PostgreSQL...");
    for (const u of users) await pgClient.query('INSERT INTO users VALUES ($1, $2)', [u.id, u.name]);
    for (const p of products) await pgClient.query('INSERT INTO products VALUES ($1, $2, $3)', [p.id, p.name, p.price]);
    for (const int of interactions) await pgClient.query('INSERT INTO interactions VALUES ($1, $2)', [int.user_id, int.product_id]);

    // Insert ke Neo4j
    console.log("Memasukkan data ke Neo4j...");
    await session.run(`UNWIND $users AS u MERGE (:User {id: u.id, name: u.name})`, { users });
    await session.run(`UNWIND $products AS p MERGE (:Product {id: p.id, name: p.name, price: p.price})`, { products });
    await session.run(`
        UNWIND $interactions AS int
        MATCH (u:User {id: int.user_id}), (p:Product {id: int.product_id})
        MERGE (u)-[:BOUGHT]->(p)
    `, { interactions });

    console.log("Seeding Selesai! Kedua database sudah memiliki data yang sama.");
    
    await session.close();
    await driver.close();
    await pgClient.end();
}

runSeed().catch(console.error);