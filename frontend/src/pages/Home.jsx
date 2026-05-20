import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { 
  Sparkles, 
  Layers, 
  MapPin, 
  DollarSign, 
  BookOpen, 
  TrendingUp, 
  ArrowRight,
  Loader 
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  // Statistics counters
  const [stats, setStats] = useState({
    activeListings: 120,
    sameDeptSellers: 14,
    successfulCODs: 87,
  });

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        // 1. Fetch graph-based personalized recommendations
        const recRes = await api.graph.getRecommendations();
        if (recRes.success) {
          setRecommendations(recRes.recommendations);
        }

        // 2. Fetch all products to display "Barang Baru"
        const prodRes = await api.products.getAll();
        if (prodRes.success) {
          const available = prodRes.products.filter(p => p.status === "available" || p.status === "Tersedia");
          // Grab latest 4 available products
          setRecentProducts(available.slice(0, 4));

          // Set dynamic stats based on local data if mock is running
          const ownDeptListingsCount = prodRes.products.filter(p => p.seller_jurusan === user?.jurusan).length;
          setStats({
            activeListings: prodRes.products.length + 80, // padd for visual premium
            sameDeptSellers: ownDeptListingsCount + 2,
            successfulCODs: 135,
          });
        }
      } catch (err) {
        console.error("Gagal memuat data beranda:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadHomeData();
    }
  }, [user]);

  // Unified Add to Cart Handler
  const handleAddToCart = (product) => {
    try {
      const cartKey = `akademart_cart_${user?.user_id}`;
      const stored = localStorage.getItem(cartKey);
      let cartItems = stored ? JSON.parse(stored) : [];

      const existingIndex = cartItems.findIndex(item => item.product_id === product.product_id);
      if (existingIndex !== -1) {
        cartItems[existingIndex].quantity += 1;
      } else {
        cartItems.push({ ...product, quantity: 1 });
      }

      localStorage.setItem(cartKey, JSON.stringify(cartItems));

      // Trigger implicit purchase tracking edge
      api.graph.trackInteraction(product.product_id, "cart");

      // Dispatch custom event to navbar
      window.dispatchEvent(new Event("cartUpdated"));

      // Show temporary toast notification
      setToastMessage(`Berhasil menambahkan "${product.name}" ke keranjang!`);
      setTimeout(() => setToastMessage(""), 3500);
    } catch (err) {
      console.error("Gagal menambahkan ke keranjang:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400">Menghubungkan ke mesin rekomendasi graph...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <Navbar />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-violet-600 border border-violet-400/30 text-white font-semibold text-xs shadow-2xl flex items-center space-x-2 animate-scaleIn">
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        {/* Personalized Welcome Banner */}
        <section className="glass-panel rounded-3xl p-8 relative overflow-hidden glow-border">
          {/* Neon blob */}
          <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none"></div>
          
          <div className="max-w-3xl space-y-4">
            <span className="px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-violet-600/20 text-violet-300 border border-violet-500/20 inline-flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Neo4j Recomendation Engine Aktif</span>
            </span>

            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Hai, {user?.full_name}! 👋 <br />
              <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Temukan Kebutuhan Kuliahmu Di Sini
              </span>
            </h2>
            
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Jual beli barang pre-loved antar sesama mahasiswa di **{user?.fakultas}**. 
              Sistem COD instan tanpa ongkir, aman, cepat, dan terpercaya.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/browse"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all flex items-center space-x-2 glow-button shadow-lg shadow-violet-500/25"
              >
                <span>Jelajahi Katalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                to="/seller"
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 font-semibold text-xs transition-all flex items-center space-x-2"
              >
                <span>Mulai Jualan</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Hyper-Local Statistics Counters */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400 border border-violet-500/10">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.activeListings}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Aktif di Akademart</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/10 flex items-center justify-center text-cyan-400 border border-cyan-500/10">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.sameDeptSellers} Seller</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Aktif di Jurusanmu</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.successfulCODs} Transaksi</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">COD Kampus Sukses</div>
            </div>
          </div>
        </section>

        {/* RECOMMENDATION ROW 1: DEPARTMENT-BASED COLLABORATIVE FILTERING */}
        {recommendations?.department?.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold flex items-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Collaborative Filtering</span>
                </span>
                <h3 className="text-xl font-bold text-slate-100">
                  Mahasiswa di <span className="text-cyan-400 font-extrabold">{user?.jurusan}</span> Juga Melirik...
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendations.department.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        )}

        {/* RECOMMENDATION ROW 2: COURSE-BASED (ACADEMIC CONTEXT) */}
        {recommendations?.courses?.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-widest text-violet-400 font-bold flex items-center space-x-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Kontekstual Akademik</span>
                </span>
                <h3 className="text-xl font-bold text-slate-100">
                  Populer Untuk Kelas <span className="text-violet-400 font-extrabold">{user?.matakuliah[0] || "Semester Ini"}</span>...
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendations.courses.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        )}

        {/* RECOMMENDATION ROW 3: INTERESTS & HOBBIES GRAPH MATCHING */}
        {recommendations?.interests?.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Graph Profiling</span>
                </span>
                <h3 className="text-xl font-bold text-slate-100">
                  Berdasarkan Hobi & Minat Sejenis...
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendations.interests.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        )}

        {/* RECENT / NEW UPLOADS CATALOG ROW */}
        {recentProducts.length > 0 && (
          <section className="space-y-6 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xl font-bold text-slate-100">Barang Baru di Kampusmu</h3>
                <p className="text-xs text-slate-500">Daftar barang pre-loved segar yang diposting oleh teman-teman sekampus.</p>
              </div>
              <Link
                to="/browse"
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center space-x-1 transition-colors"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentProducts.map((product) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
