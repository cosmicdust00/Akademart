import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ArrowUpDown, 
  Sparkles,
  RefreshCw,
  Loader 
} from "lucide-react";

export default function Browse() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedFakultas, setSelectedFakultas] = useState("Semua");
  const [availabilityFilter, setAvailabilityFilter] = useState("available"); // 'available' | 'all'
  const [sortOption, setSortOption] = useState("newest"); // 'newest' | 'price-asc' | 'price-desc'

  const categories = ["Semua", "Buku", "Elektronik", "Fashion", "Peralatan Kos"];
  const fakultasOptions = ["Semua", "Fakultas Ilmu Komputer", "Fakultas Teknik", "Fakultas Ekonomi & Bisnis", "Fakultas Ilmu Sosial & Ilmu Politik"];

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.products.getAll();
      if (res.success) {
        setProducts(res.products);
        setFilteredProducts(res.products);
      }
    } catch (err) {
      console.error("Gagal memuat katalog produk:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter & Sort Application Pipeline
  useEffect(() => {
    let result = [...products];

    // 1. Text Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.seller_name.toLowerCase().includes(query)
      );
    }

    // 2. Category Filter
    if (selectedCategory !== "Semua") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // 3. Faculty Filter
    if (selectedFakultas !== "Semua") {
      result = result.filter((p) => p.seller_jurusan && getFacultyByMajor(p.seller_jurusan) === selectedFakultas);
    }

    // 4. Availability Filter
    if (availabilityFilter === "available") {
      result = result.filter((p) => p.status === "available" || p.status === "Tersedia");
    }

    // 5. Sorting
    if (sortOption === "newest") {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortOption === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
  }, [products, searchQuery, selectedCategory, selectedFakultas, availabilityFilter, sortOption]);

  // Helper map from major to faculty (preseeded mappings)
  const getFacultyByMajor = (major) => {
    if (["Teknik Informatika", "Sistem Informasi", "Teknologi Informasi"].includes(major)) {
      return "Fakultas Ilmu Komputer";
    }
    if (["Teknik Elektro", "Teknik Mesin", "Teknik Sipil", "Teknik Kimia"].includes(major)) {
      return "Fakultas Teknik";
    }
    if (["Manajemen", "Akuntansi", "Ekonomi Pembangunan"].includes(major)) {
      return "Fakultas Ekonomi & Bisnis";
    }
    if (["Ilmu Komunikasi", "Hubungan Internasional", "Administrasi Publik"].includes(major)) {
      return "Fakultas Ilmu Sosial & Ilmu Politik";
    }
    return "Lainnya";
  };

  // Add to Cart
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

      // Trigger implicit purchase tracking
      api.graph.trackInteraction(product.product_id, "cart");

      window.dispatchEvent(new Event("cartUpdated"));

      setToastMessage(`Berhasil menambahkan "${product.name}" ke keranjang!`);
      setTimeout(() => setToastMessage(""), 3500);
    } catch (err) {
      console.error(err);
    }
  };

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-2">
              Katalog <span className="text-violet-400">Akademart</span>
            </h1>
            <p className="text-xs text-slate-500">
              Temukan {filteredProducts.length} barang pre-loved aktif di lingkungan kampus Anda.
            </p>
          </div>

          {/* Quick Refresh & Search Combo */}
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama barang atau penjual..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
              />
            </div>
            
            <button
              onClick={loadProducts}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-slate-400 hover:text-white"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Master Catalog Layout (Filters Sidebar + Products Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="space-y-6 lg:col-span-1">
            <div className="glass-panel rounded-2xl p-6 border border-white/10 glow-border space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                  <Filter className="w-4.5 h-4.5 text-violet-400" />
                  <span>Filter Pencarian</span>
                </span>
                {(selectedCategory !== "Semua" || selectedFakultas !== "Semua" || availabilityFilter !== "available" || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory("Semua");
                      setSelectedFakultas("Semua");
                      setAvailabilityFilter("available");
                      setSearchQuery("");
                    }}
                    className="text-[10px] text-violet-400 font-bold hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Kategori</label>
                <div className="flex flex-col space-y-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                        selectedCategory === cat
                          ? "bg-violet-600/15 text-violet-400 border border-violet-500/20 font-bold"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Faculty selection dropdown */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Asal Fakultas Seller</label>
                <select
                  value={selectedFakultas}
                  onChange={(e) => setSelectedFakultas(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 appearance-none cursor-pointer"
                >
                  {fakultasOptions.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Availability */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Ketersediaan</label>
                <div className="flex items-center space-x-4 pt-1">
                  <label className="inline-flex items-center text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="availability"
                      value="available"
                      checked={availabilityFilter === "available"}
                      onChange={() => setAvailabilityFilter("available")}
                      className="mr-2 text-violet-600 focus:ring-0 border-white/10 bg-slate-900 cursor-pointer"
                    />
                    Tersedia (COD Ready)
                  </label>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="availability"
                      value="all"
                      checked={availabilityFilter === "all"}
                      onChange={() => setAvailabilityFilter("all")}
                      className="mr-2 text-violet-600 focus:ring-0 border-white/10 bg-slate-900 cursor-pointer"
                    />
                    Tampilkan Semua (Termasuk Terjual)
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Catalog Grid Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sorting Actions */}
            <div className="flex items-center justify-between bg-white/3 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/5">
              <span className="text-xs text-slate-400 font-medium">
                Menampilkan {filteredProducts.length} hasil
              </span>

              <div className="flex items-center space-x-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-500 font-semibold uppercase">Urutkan:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-transparent border-none text-xs text-violet-400 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="newest">Baru Dipasang</option>
                  <option value="price-asc">Harga: Terendah</option>
                  <option value="price-desc">Harga: Tertinggi</option>
                </select>
              </div>
            </div>

            {/* Catalog Grid Display */}
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <Loader className="w-8 h-8 animate-spin text-violet-500 mb-3" />
                <p className="text-xs">Memuat katalog...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="glass-panel rounded-2xl h-80 flex flex-col items-center justify-center border border-dashed border-white/10">
                <p className="text-sm font-semibold text-slate-400 mb-1">Tidak ada produk yang cocok</p>
                <p className="text-xs text-slate-500">Coba ubah kata kunci atau pengaturan filter di bilah samping.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.product_id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
