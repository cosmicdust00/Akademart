import axios from "axios";

// Target VITE_API_URL or default to standard localhost backend
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor to inject the JWT token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("akademart_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// STATEFUL LOCAL DATABASE FOR MOCK ENGINE
// ==========================================
const MOCK_USERS_KEY = "akademart_mock_users";
const MOCK_PRODUCTS_KEY = "akademart_mock_products";
const MOCK_INTERACTIONS_KEY = "akademart_mock_interactions";

const defaultUsers = [
  {
    user_id: "user-1",
    username: "budi.informatika",
    full_name: "Budi Setiawan",
    email: "budi@kampus.ac.id",
    password_hash: "$2b$10$hashedstuff",
    angkatan: 2023,
    fakultas: "Fakultas Ilmu Komputer",
    jurusan: "Teknik Informatika",
    matakuliah: ["Pemrograman Web", "Sistem Basis Data", "Kecerdasan Buatan"],
    interests: ["Coding", "Gaming", "Gadgets"],
    hobbies: ["Musik", "E-sports"],
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    user_id: "user-2",
    username: "siti.elektro",
    full_name: "Siti Rahmawati",
    email: "siti@kampus.ac.id",
    password_hash: "$2b$10$hashedstuff",
    angkatan: 2022,
    fakultas: "Fakultas Teknik",
    jurusan: "Teknik Elektro",
    matakuliah: ["Sistem Tertanam", "Rangkaian Listrik", "Mikrokontroler"],
    interests: ["Robotics", "IoT", "Photography"],
    hobbies: ["Fotografi", "Basket"],
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const defaultProducts = [
  {
    product_id: "prod-1",
    name: "Buku Kalkulus Purcell Edisi 9",
    price: 95000,
    description: "Buku Kalkulus Purcell edisi ke-9 dalam kondisi 90% mulus. Ada sedikit coretan pensil di bab awal. Sangat berguna untuk mahasiswa tingkat pertama teknik/sains.",
    image_url: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60",
    status: "available",
    category: "Buku",
    seller_id: "user-2",
    seller_name: "Siti Rahmawati",
    seller_jurusan: "Teknik Elektro",
    seller_angkatan: 2022,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    product_id: "prod-2",
    name: "Keyboard Mechanical Keychron K2",
    price: 850000,
    description: "Keychron K2 V2 Gateron Brown Switch, White Backlight. Lengkap dengan box dan kabel USB-C bawaan. Keycaps masih sangat bersih, jarang dipakai karena sering pakai laptop.",
    image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60",
    status: "available",
    category: "Elektronik",
    seller_id: "user-1",
    seller_name: "Budi Setiawan",
    seller_jurusan: "Teknik Informatika",
    seller_angkatan: 2023,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    product_id: "prod-3",
    name: "Kipas Angin Meja Sanex untuk Kos",
    price: 75000,
    description: "Kipas angin kecil tapi hembusan kencang, cocok ditaruh di meja belajar kamar kos. Kondisi lancar jaya, 3 tingkat kecepatan berfungsi semua, tidak berisik.",
    image_url: "https://images.unsplash.com/photo-1618945037920-5c62d04a6fc2?w=500&auto=format&fit=crop&q=60",
    status: "available",
    category: "Peralatan Kos",
    seller_id: "user-2",
    seller_name: "Siti Rahmawati",
    seller_jurusan: "Teknik Elektro",
    seller_angkatan: 2022,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    product_id: "prod-4",
    name: "Modul & Alat Praktikum Arduino Uno Starter Kit",
    price: 180000,
    description: "Kit praktikum Mikrokontroler lengkap dengan Arduino Uno R3, breadboard, kabel jumper, puluhan LED, sensor jarak HC-SR04, sensor suhu DHT11, servo SG90, dan LCD 16x2.",
    image_url: "https://images.unsplash.com/photo-1561070791-26c113006238?w=500&auto=format&fit=crop&q=60",
    status: "available",
    category: "Elektronik",
    seller_id: "user-2",
    seller_name: "Siti Rahmawati",
    seller_jurusan: "Teknik Elektro",
    seller_angkatan: 2022,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    product_id: "prod-5",
    name: "Jaket Angkatan Teknik Universitas (Navy)",
    price: 150000,
    description: "Jaket angkatan navy blue, bahan tebal Taslan dengan furing dalam. Ukuran L. Jarang dipakai karena ada jaket himpunan sendiri. Emblem rapi.",
    image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60",
    status: "available",
    category: "Fashion",
    seller_id: "user-1",
    seller_name: "Budi Setiawan",
    seller_jurusan: "Teknik Informatika",
    seller_angkatan: 2023,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    product_id: "prod-6",
    name: "Buku Sakti Pemrograman Web React + Node.js",
    price: 60000,
    description: "Pembelajaran React, Express, dan Mongo/MySQL. Buku sangat tebal dan penuh dengan contoh case study project e-commerce. Cocok buat yang ambil matkul Pemrograman Web.",
    image_url: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=500&auto=format&fit=crop&q=60",
    status: "available",
    category: "Buku",
    seller_id: "user-1",
    seller_name: "Budi Setiawan",
    seller_jurusan: "Teknik Informatika",
    seller_angkatan: 2023,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    product_id: "prod-7",
    name: "Jersey Sepeda Shimano Original S",
    price: 250000,
    description: "Jersey sepeda Shimano warna hitam-hijau neon. Ukuran S. Kondisi masih sangat mulus, stretchable, quick dry, saku belakang ada 3 aman untuk botol air.",
    image_url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop&q=60",
    status: "sold_out",
    category: "Fashion",
    seller_id: "user-2",
    seller_name: "Siti Rahmawati",
    seller_jurusan: "Teknik Elektro",
    seller_angkatan: 2022,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    product_id: "prod-8",
    name: "Headphone Sony WH-CH510 Wireless",
    price: 320000,
    description: "Headphone bluetooth Sony, baterai super awet bisa sampai 35 jam pemakaian. Suara bass mantap khas Sony. Earpads masih empuk, tidak ada sobek.",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
    status: "available",
    category: "Elektronik",
    seller_id: "user-1",
    seller_name: "Budi Setiawan",
    seller_jurusan: "Teknik Informatika",
    seller_angkatan: 2023,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const defaultInteractions = [
  { interaction_id: "int-1", user_id: "user-1", product_id: "prod-1", type: "view", timestamp: new Date().toISOString() },
  { interaction_id: "int-2", user_id: "user-1", product_id: "prod-3", type: "view", timestamp: new Date().toISOString() },
  { interaction_id: "int-3", user_id: "user-2", product_id: "prod-2", type: "view", timestamp: new Date().toISOString() },
  { interaction_id: "int-4", user_id: "user-2", product_id: "prod-6", type: "view", timestamp: new Date().toISOString() },
  { interaction_id: "int-5", user_id: "user-2", product_id: "prod-6", type: "cart", timestamp: new Date().toISOString() }
];

// Helper functions for mock db access
const getMockData = (key, defaults) => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(stored);
};

const saveMockData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Simulated graph relations querying helper
const runGraphRecommendations = (activeUser, allProducts, allInteractions, allUsers) => {
  if (!activeUser) return allProducts.slice(0, 4);

  // Group recommendations
  const result = {
    department: [],
    courses: [],
    interests: []
  };

  // 1. Department-based Collaborative Filtering
  // "Mahasiswa di Jurusanmu juga tertarik dengan..."
  // Find products listed by other sellers in same Jurusan OR products that students in the same Jurusan viewed/carted/bought.
  const deptInteractions = allInteractions.filter(inter => {
    const user = allUsers.find(u => u.user_id === inter.user_id);
    return user && user.jurusan === activeUser.jurusan && user.user_id !== activeUser.user_id;
  });
  const deptInteractedProductIds = Array.from(new Set(deptInteractions.map(i => i.product_id)));
  
  result.department = allProducts.filter(p => {
    // Exclude own products
    if (p.seller_id === activeUser.user_id) return false;
    // Check if listed by someone in same jurusan OR interacted with by someone in same jurusan
    const isSameDeptSeller = p.seller_jurusan === activeUser.jurusan;
    const isInteractedInDept = deptInteractedProductIds.includes(p.product_id);
    return (isSameDeptSeller || isInteractedInDept) && p.status === "available";
  });

  // 2. Course-Based Recommendations
  // "Populer untuk mata kuliah yang kamu ambil..."
  // Check if product description or category matches courses or topics in user's current course list
  result.courses = allProducts.filter(p => {
    if (p.seller_id === activeUser.user_id) return false;
    if (p.status !== "available") return false;
    
    return activeUser.matakuliah.some(course => {
      const regex = new RegExp(course.split(" ")[0], "i"); // match first word (e.g. 'Pemrograman', 'Sistem')
      return regex.test(p.name) || regex.test(p.description);
    }) || (p.category === "Buku" && activeUser.matakuliah.length > 0);
  });

  // 3. Interest & Hobby Similarity
  // "Berdasarkan minat & hobi sejenis..."
  // Count matching tags between activeUser's interests/hobbies and seller's interests/hobbies OR category mapping
  const calculateSimilarity = (prod) => {
    const seller = allUsers.find(u => u.user_id === prod.seller_id);
    if (!seller) return 0;
    
    let score = 0;
    // Overlapping interests
    activeUser.interests.forEach(interest => {
      if (seller.interests.some(i => i.toLowerCase() === interest.toLowerCase())) score += 2;
    });
    // Overlapping hobbies
    activeUser.hobbies.forEach(hobby => {
      if (seller.hobbies.some(h => h.toLowerCase() === hobby.toLowerCase())) score += 2;
    });
    
    // Category association with interest
    const cat = prod.category.toLowerCase();
    activeUser.interests.forEach(i => {
      const interest = i.toLowerCase();
      if (cat.includes("elektronik") && (interest.includes("gadget") || interest.includes("coding") || interest.includes("robotics"))) score += 3;
      if (cat.includes("buku") && (interest.includes("coding") || interest.includes("study"))) score += 2;
    });
    
    return score;
  };

  const productsWithScore = allProducts
    .filter(p => p.seller_id !== activeUser.user_id && p.status === "available")
    .map(p => ({ ...p, score: calculateSimilarity(p) }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score);

  result.interests = productsWithScore.map(({ score, ...p }) => p);

  // Pad categories if empty to keep dashboard lively
  if (result.department.length === 0) {
    result.department = allProducts.filter(p => p.seller_id !== activeUser.user_id && p.status === "available").slice(0, 3);
  }
  if (result.courses.length === 0) {
    result.courses = allProducts.filter(p => p.category === "Buku" && p.status === "available");
  }
  if (result.interests.length === 0) {
    result.interests = allProducts.filter(p => p.seller_id !== activeUser.user_id && p.status === "available").slice(2, 5);
  }

  return result;
};

// State representation of active mock session
let activeMockUser = null;
const activeToken = localStorage.getItem("akademart_token");
const mockUsers = getMockData(MOCK_USERS_KEY, defaultUsers);

if (activeToken && activeToken.startsWith("mock-jwt-")) {
  const username = activeToken.replace("mock-jwt-", "");
  activeMockUser = mockUsers.find(u => u.username === username || u.email === username);
}

// ==========================================
// CENTRAL WRAPPER FOR BACKEND INTEGRATION
// ==========================================
export const api = {
  // 1. Authentication Endpoints
  auth: {
    login: async (credentials) => {
      try {
        const response = await apiClient.post("/auth/login", credentials);
        return response.data;
      } catch (err) {
        console.warn("API Offline, running simulation...", err.message);
        
        // Mock Login Handler
        const { email, password } = credentials; // email field holds email or username
        const users = getMockData(MOCK_USERS_KEY, defaultUsers);
        const match = users.find(u => u.email === email || u.username === email);
        
        if (!match) {
          throw new Error("Pengguna tidak ditemukan. Silakan periksa kembali email/username Anda.");
        }
        
        const token = `mock-jwt-${match.username}`;
        localStorage.setItem("akademart_token", token);
        activeMockUser = match;
        
        return {
          success: true,
          message: "Login berhasil (Simulasi Offline)",
          token,
          user: match
        };
      }
    },
    
    register: async (userData) => {
      try {
        const response = await apiClient.post("/auth/register", userData);
        return response.data;
      } catch (err) {
        console.warn("API Offline, running simulation...", err.message);
        
        // Mock Register Handler
        const users = getMockData(MOCK_USERS_KEY, defaultUsers);
        const exists = users.some(u => u.email === userData.email || u.username === userData.username);
        
        if (exists) {
          throw new Error("Username atau Email sudah terdaftar di platform.");
        }
        
        const newUser = {
          user_id: `user-${Date.now()}`,
          username: userData.username,
          full_name: userData.full_name,
          email: userData.email,
          password_hash: "$2b$10$simulatedbcrypt",
          angkatan: parseInt(userData.angkatan || 2024, 10),
          fakultas: userData.fakultas || "Fakultas Ilmu Komputer",
          jurusan: userData.jurusan || "Teknik Informatika",
          matakuliah: userData.matakuliah || [],
          interests: userData.interests || [],
          hobbies: userData.hobbies || [],
          created_at: new Date().toISOString(),
        };
        
        users.push(newUser);
        saveMockData(MOCK_USERS_KEY, users);
        
        const token = `mock-jwt-${newUser.username}`;
        localStorage.setItem("akademart_token", token);
        activeMockUser = newUser;
        
        return {
          success: true,
          message: "Registrasi berhasil (Simulasi Offline)",
          token,
          user: newUser
        };
      }
    },

    getProfile: async () => {
      try {
        const response = await apiClient.get("/auth/profile");
        return response.data;
      } catch (err) {
        if (activeMockUser) {
          return { success: true, user: activeMockUser };
        }
        throw err;
      }
    },

    updateProfile: async (profileData) => {
      try {
        const response = await apiClient.put("/auth/profile", profileData);
        return response.data;
      } catch (err) {
        console.warn("API Offline, updating mock profile...", err.message);
        
        const users = getMockData(MOCK_USERS_KEY, defaultUsers);
        const index = users.findIndex(u => u.user_id === activeMockUser.user_id);
        
        if (index !== -1) {
          users[index] = {
            ...users[index],
            ...profileData
          };
          saveMockData(MOCK_USERS_KEY, users);
          activeMockUser = users[index];
        }
        
        return {
          success: true,
          message: "Profil diperbarui (Simulasi Offline)",
          user: activeMockUser
        };
      }
    },

    logout: async () => {
      localStorage.removeItem("akademart_token");
      activeMockUser = null;
      return { success: true, message: "Logged out successfully" };
    }
  },

  // 2. Product Catalog Endpoints
  products: {
    getAll: async () => {
      try {
        const response = await apiClient.get("/products");
        return response.data;
      } catch (err) {
        console.warn("API Offline, loading mock products...", err.message);
        const products = getMockData(MOCK_PRODUCTS_KEY, defaultProducts);
        return {
          success: true,
          products
        };
      }
    },

    getById: async (id) => {
      try {
        const response = await apiClient.get(`/products/${id}`);
        return response.data;
      } catch (err) {
        console.warn(`API Offline, loading mock product: ${id}`, err.message);
        const products = getMockData(MOCK_PRODUCTS_KEY, defaultProducts);
        const match = products.find(p => p.product_id === id);
        
        if (!match) {
          throw new Error("Barang tidak ditemukan.");
        }
        
        return {
          success: true,
          product: match
        };
      }
    },

    create: async (formData) => {
      try {
        // formData is a Multipart/form-data container holding title, price, description, etc.
        const response = await apiClient.post("/products", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      } catch (err) {
        console.warn("API Offline, simulating product creation...", err.message);
        
        const products = getMockData(MOCK_PRODUCTS_KEY, defaultProducts);
        
        // Extract fields from formData wrapper (or direct object if mock is supplied directly)
        let name = "";
        let price = 0;
        let description = "";
        let category = "Buku";
        let imageFile = null;
        let previewUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60"; // fallback default
        
        if (formData instanceof FormData) {
          name = formData.get("name") || "";
          price = parseInt(formData.get("price") || 0, 10);
          description = formData.get("description") || "";
          category = formData.get("category") || "Buku";
          imageFile = formData.get("image");
          
          if (imageFile && imageFile instanceof File) {
            // Generate a local Blob object URL for displaying uploaded file
            previewUrl = URL.createObjectURL(imageFile);
          }
        } else {
          name = formData.name || "";
          price = parseInt(formData.price || 0, 10);
          description = formData.description || "";
          category = formData.category || "Buku";
          previewUrl = formData.image_url || previewUrl;
        }
        
        if (!activeMockUser) {
          throw new Error("Akses ditolak. Silakan login terlebih dahulu.");
        }
        
        const newProduct = {
          product_id: `prod-${Date.now()}`,
          name,
          price,
          description,
          image_url: previewUrl,
          status: "available",
          category,
          seller_id: activeMockUser.user_id,
          seller_name: activeMockUser.full_name,
          seller_jurusan: activeMockUser.jurusan,
          seller_angkatan: activeMockUser.angkatan,
          created_at: new Date().toISOString(),
        };
        
        products.unshift(newProduct);
        saveMockData(MOCK_PRODUCTS_KEY, products);
        
        return {
          success: true,
          message: "Produk berhasil dipasang di Akademart! (Simulasi)",
          product: newProduct
        };
      }
    },

    updateStatus: async (id, status) => {
      try {
        const response = await apiClient.put(`/products/${id}/status`, { status });
        return response.data;
      } catch (err) {
        console.warn(`API Offline, toggling mock product status: ${id}`, err.message);
        
        const products = getMockData(MOCK_PRODUCTS_KEY, defaultProducts);
        const index = products.findIndex(p => p.product_id === id);
        
        if (index !== -1) {
          products[index].status = status;
          saveMockData(MOCK_PRODUCTS_KEY, products);
        }
        
        return {
          success: true,
          message: "Status barang berhasil diperbarui (Simulasi)",
          product: products[index]
        };
      }
    },

    delete: async (id) => {
      try {
        const response = await apiClient.delete(`/products/${id}`);
        return response.data;
      } catch (err) {
        console.warn(`API Offline, deleting mock product: ${id}`, err.message);
        
        const products = getMockData(MOCK_PRODUCTS_KEY, defaultProducts);
        const filtered = products.filter(p => p.product_id !== id);
        saveMockData(MOCK_PRODUCTS_KEY, filtered);
        
        return {
          success: true,
          message: "Barang berhasil dihapus (Simulasi)"
        };
      }
    }
  },

  // 3. Graph Recommendations & Event Tracking Endpoints
  graph: {
    trackInteraction: async (productId, type) => {
      try {
        const response = await apiClient.post("/interactions", { productId, type });
        return response.data;
      } catch (err) {
        console.log(`Tracking Event: User:${activeMockUser?.username} -> ${type} -> Product:${productId} (Simulated Graph Edge)`);
        
        const interactions = getMockData(MOCK_INTERACTIONS_KEY, defaultInteractions);
        const newInteraction = {
          interaction_id: `int-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          user_id: activeMockUser?.user_id || "guest",
          product_id: productId,
          type, // 'view' | 'cart' | 'buy'
          timestamp: new Date().toISOString()
        };
        
        interactions.push(newInteraction);
        saveMockData(MOCK_INTERACTIONS_KEY, interactions);
        
        return { success: true, interaction: newInteraction };
      }
    },

    getRecommendations: async () => {
      try {
        const response = await apiClient.get(`/recommendations/${activeMockUser?.user_id}`);
        return response.data;
      } catch (err) {
        console.warn("API Offline, computing real-time graph collaborative filtering...", err.message);
        
        const products = getMockData(MOCK_PRODUCTS_KEY, defaultProducts);
        const interactions = getMockData(MOCK_INTERACTIONS_KEY, defaultInteractions);
        const users = getMockData(MOCK_USERS_KEY, defaultUsers);
        
        const recommendations = runGraphRecommendations(activeMockUser, products, interactions, users);
        
        return {
          success: true,
          recommendations
        };
      }
    }
  }
};
