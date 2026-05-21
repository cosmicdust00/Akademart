const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./src/routes/auth.route');
const productRoutes = require('./src/routes/product.route');
const interactionRoutes = require('./src/routes/interaction.route');
const sellerRoutes = require('./src/routes/seller.route');
const userProfileRoutes = require('./src/routes/userProfile.route');
const recomRoutes = require('./src/routes/recom.route');

const driver = require('./src/config/neo4j');

const app = express();

app.use(cors());
app.use(express.json());

// Auth
app.use('/api/auth', authRoutes);

// Products
app.use('/api/products', productRoutes);

// Interaction
app.use('/api/interactions', interactionRoutes);

// Seller
app.use('/api/seller', sellerRoutes);

// User Profile
app.use('/api/users/profile', userProfileRoutes);

// Recommendation
app.use('/api/recom', recomRoutes);

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