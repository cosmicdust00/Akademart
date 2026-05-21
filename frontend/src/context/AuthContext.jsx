import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api"; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memuat User saat halaman direfresh
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("akademart_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/profile');
        
        if (res.data && res.data.user) {
          setUser(res.data.user);
        } else {
          localStorage.removeItem("akademart_token");
        }
      } catch (err) {
        console.warn("Auth check failed:", err.response?.status);
        
        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem("akademart_token");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      
      // Ambil token dan user dari respon backend
      const { token, user: userData } = res.data;
      
      // Simpan token ke LocalStorage
      localStorage.setItem("akademart_token", token);
      
      // Update state user
      setUser(userData);
      return userData;

    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Gagal masuk.";
      setError(msg);
      throw new Error(msg);
    }
  };

  // Fungsi Register
  const register = async (userData) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', userData);
      
      // Backend kita saat register TIDAK mengirimkan token/user data otomatis login
      // Jadi kita biarkan user state tetap null, user harus login manual setelah sukses register
      return res.data;

    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Gagal mendaftar.";
      setError(msg);
      throw new Error(msg);
    }
  };

  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const res = await api.patch('/users/profile/update', profileData);
      
      // Update state user di frontend agar langsung sinkron dengan data baru
      if (user) {
         setUser({ ...user, ...profileData });
      }
      
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Gagal memperbarui profil.";
      setError(msg);
      throw new Error(msg);
    }
  };

  // Fungsi Logout
  const logout = () => {
    // Kita tidak punya endpoint logout di backend karena kita pakai JWT (Stateless)
    // Jadi cukup hapus token dari frontend
    localStorage.removeItem("akademart_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        updateProfile,
        logout,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di bawah AuthProvider");
  }
  return context;
};