import React, { createContext, useState, useEffect, useContext } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authenticate user on page refresh/mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("akademart_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.auth.getProfile();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          // Token expired or invalid
          localStorage.removeItem("akademart_token");
        }
      } catch (err) {
        console.error("Gagal memuat profil pengguna otomatis:", err.message);
        // Do not delete token on network errors so it survives offline mock restarts!
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.auth.login({ email, password });
      if (res.success) {
        setUser(res.user);
        return res.user;
      } else {
        throw new Error(res.message || "Gagal masuk. Coba lagi.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Gagal masuk.";
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const res = await api.auth.register(userData);
      if (res.success) {
        setUser(res.user);
        return res.user;
      } else {
        throw new Error(res.message || "Gagal mendaftar.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Gagal mendaftar.";
      setError(msg);
      throw new Error(msg);
    }
  };

  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const res = await api.auth.updateProfile(profileData);
      if (res.success) {
        setUser(res.user);
        return res.user;
      } else {
        throw new Error(res.message || "Gagal memperbarui profil.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Gagal memperbarui profil.";
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
    }
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
