import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Interceptor untuk menyuntikkan token JWT secara otomatis ke setiap request
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
// CENTRAL WRAPPER FOR BACKEND INTEGRATION
// ==========================================

export const api = {
  // Authentication & Profile Endpoints
  auth: {
    login: async (credentials) => {
      // POST /api/auth/login
      const response = await apiClient.post("/auth/login", credentials);
      return response.data;
    },

    register: async (userData) => {
      // POST /api/auth/register
      const response = await apiClient.post("/auth/register", userData);
      return response.data;
    },

    getProfile: async () => {
      // GET /api/auth/profile
      const response = await apiClient.get("/auth/profile");
      return response.data;
    },

    updateProfile: async (profileData) => {
      // PATCH /api/users/profile/update
      const response = await apiClient.patch("/users/profile/update", profileData);
      return response.data;
    },
  },

  // Product Catalog Endpoints
  products: {
    getAll: async () => {
      // GET /api/products
      const response = await apiClient.get("/products");
      return response.data; // Mengembalikan array of products
    },

    getStats: async (productId) => {
      // GET /api/products/:productId/stats
      const response = await apiClient.get(`/products/${productId}/stats`);
      return response.data;
    },
      // GET /api/products/:productId
    getById: async (id) => {
      const response = await apiClient.get(`/products/${id}`);
      return response.data;
    },

    create: async (formData) => {
      // POST /api/products
      // Wajib menggunakan multipart/form-data karena ada file gambar (Supabase)
      const response = await apiClient.post("/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    }
  },

  // Graph Interactions (Profiling Engine)
  interactions: {
    view: async (productId) => {
      // POST /api/interactions/view
      const response = await apiClient.post("/interactions/view", { productId });
      return response.data;
    },

    buy: async (productId) => {
      // POST /api/interactions/buy
      const response = await apiClient.post("/interactions/buy", { productId });
      return response.data;
    },

    like: async (productId) => {
      // POST /api/interactions/like
      const response = await apiClient.post("/interactions/like", { productId });
      return response.data;
    },

    dislike: async (productId) => {
      // POST /api/interactions/dislike
      const response = await apiClient.post("/interactions/dislike", { productId });
      return response.data;
    }
  },

  // Recommendation Engine
  recom: {
    get: async () => {
      // GET /api/recom
      const response = await apiClient.get("/recom");
      return response.data; // Mengembalikan array of recommended products
    }
  },

  // Seller Management
  seller: {
    getProducts: async () => {
      // 
      const response = await apiClient.get("/seller/products");
      return response.data;
    },

    updateStock: async (productId, amount, operation) => {
      // PATCH /api/seller/products/:productId/stock
      const response = await apiClient.patch(`/seller/products/${productId}/stock`, {
        amount,
        operation
      });
      return response.data;
    },

    confirmSale: async (productId) => {
      const response = await apiClient.post("/seller/orders/confirm", { productId });
      return response.data;
    },

    deleteProduct: async (productId) => {
      const response = await apiClient.delete(`/seller/products/${productId}`);
      return response.data;
    }
  }
};

export default apiClient;