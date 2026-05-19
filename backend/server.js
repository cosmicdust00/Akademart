const express = require('express');
const cors = require('cors');
require('dotenv').config();

const driver = require('./src/config/neo4j');

const app = express();

app.use(cors());
app.use(express.json());

async function startServer() {
    try {
        const serverInfo = await driver.getServerInfo();
        console.log('Berhasil terhubung ke database Neo4j');
        console.log(`Instance: ${serverInfo.address}`);

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server berjalan di port ${PORT}`);
        });

    } catch (error) {
        console.error('Gagal terhubung ke Neo4j Database:', error.message);
        process.exit(1);
    }
}

app.get('/', (req, res) => {
    res.send('API Akademart is running');
});

startServer();

process.on('SIGINT', async () => {
    await driver.close();
    console.log('Neo4j driver closed.');
    process.exit(0);
});