import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import {
  Store, Plus, Trash2, Check, DollarSign,
  Layers, CheckCircle, Eye, X, Upload, Sparkles, Loader, Handshake,
  Minus, ShoppingCart
} from "lucide-react";

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const [metrics, setMetrics] = useState({
    totalEarnings: 0,
    activeCount: 0,
    soldCount: 0,
    totalViews: 0
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Buku");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ["Buku", "Elektronik", "Fashion", "Peralatan Kos"];

  const loadSellerData = async () => {
    setLoading(true);
    try {
      const productsData = await api.seller.getProducts();

      if (Array.isArray(productsData)) {
        let earnings = 0;
        let active = 0;
        let soldTotal = 0;
        let viewsTotal = 0;

        const parsedProducts = productsData.map(p => {
          // Parse integer dari Neo4j agar aman digunakan
          const price = p.price?.low ?? p.price ?? 0;
          const stock = p.stock?.low ?? p.stock ?? 0;
          const views = p.views?.low ?? p.views ?? 0; // Data dari backend query baru
          const sold = p.sold?.low ?? p.sold ?? 0;    // Data dari backend query baru

          // Akumulasi Metrik Dasbor Utama
          if (stock > 0 || p.status === "available") active += 1;

          soldTotal += sold;
          earnings += (sold * price); // Pendapatan real dari barang yang benar-benar terjual
          viewsTotal += views;

          return { ...p, price, stock, views, sold };
        });

        setMyProducts(parsedProducts);
        setMetrics({
          totalEarnings: earnings,
          activeCount: active,
          soldCount: soldTotal,
          totalViews: viewsTotal
        });
      }
    } catch (err) {
      console.error("Gagal memuat dasbor penjual:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      loadSellerData();
    }
  }, [user, authLoading]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  // --- KONTROL STOK BARU ---
  const handleUpdateStock = async (productId, amount, operation) => {
    try {
      // Panggil API untuk update (tambah/kurang/set)
      await api.seller.updateStock(productId, amount, operation);

      setToastMessage("Stok berhasil diperbarui!");
      setTimeout(() => setToastMessage(""), 3000);
      loadSellerData(); // Refresh data untuk melihat perubahan langsung
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui stok produk");
    }
  };

  const handleConfirmSale = async (productId) => {
    if (!window.confirm("Apakah pembeli sudah ketemuan, membayar, dan menerima barang ini (COD Selesai)?")) return;
    try {
      await api.seller.confirmSale(productId);
      setToastMessage("Transaksi COD selesai! Pendapatan telah diperbarui.");
      setTimeout(() => setToastMessage(""), 4000);
      loadSellerData();
    } catch (err) {
      console.error(err);
      alert("Gagal mengonfirmasi penjualan.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Hapus barang ini dari katalog Akademart secara permanen?")) return;
    try {
      await api.seller.deleteProduct(id);
      setToastMessage("Barang berhasil dihapus.");
      setTimeout(() => setToastMessage(""), 3500);
      loadSellerData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus produk");
    }
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || !newProdDesc || !selectedFile) {
      alert("Mohon lengkapi semua isian produk dan pilih gambar produk.");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", newProdName);
      fd.append("price", newProdPrice);
      fd.append("stock", 1);
      fd.append("description", newProdDesc);
      fd.append("categoryNames", JSON.stringify([newProdCategory]));
      fd.append("image", selectedFile);

      await api.products.create(fd);

      setToastMessage("Barang jualan berhasil dipasang!");
      setTimeout(() => setToastMessage(""), 3500);

      setNewProdName("");
      setNewProdPrice("");
      setNewProdDesc("");
      setSelectedFile(null);
      setFilePreview("");
      setModalOpen(false);

      loadSellerData();
    } catch (err) {
      alert("Gagal menambahkan barang.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader className="w-10 h-10 text-violet-500 animate-spin mb-4" />
        <p className="text-xs text-slate-400">
          {authLoading ? "Memverifikasi sesi toko..." : "Memuat dasbor toko dan analitik..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <Navbar />

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-violet-600 border border-violet-400/30 text-white font-semibold text-xs shadow-2xl flex items-center space-x-2 animate-scaleIn">
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-2">
              Toko <span className="text-violet-400">Saya</span>
            </h1>
            <p className="text-xs text-slate-500">
              Kelola barang jualan Anda dan pantau performa interaksi (Views & Sales) secara langsung.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center space-x-2 glow-button cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/10 flex items-center justify-center text-cyan-400">
              <DollarSign className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{formatRupiah(metrics.totalEarnings)}</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Total Pendapatan</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400">
              <Layers className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{metrics.activeCount} Barang</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Listing Tersedia</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{metrics.soldCount} Transaksi</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Berhasil COD</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-amber-600/10 flex items-center justify-center text-amber-400">
              <Eye className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{metrics.totalViews} Kali</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Total Dilihat</div>
            </div>
          </div>
        </section>

        {/* Tabel Listings */}
        <section className="glass-panel rounded-3xl border border-white/10 overflow-hidden glow-border">
          <div className="px-6 py-4.5 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
            <h3 className="font-bold text-base text-slate-100 flex items-center space-x-2">
              <Store className="w-5 h-5 text-violet-400 animate-pulse" />
              <span>Daftar Barang Jualan Saya</span>
            </h3>
            <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded-lg text-slate-400 font-semibold uppercase">
              {myProducts.length} Items
            </span>
          </div>

          {myProducts.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <p className="text-sm font-semibold text-slate-400">Belum ada barang jualan yang terdaftar.</p>
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2.5 bg-violet-600/10 text-violet-400 border border-violet-500/25 hover:bg-violet-600 hover:text-white rounded-xl transition-all text-xs font-semibold cursor-pointer"
              >
                Jual Barang Pertama Anda
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-widest font-bold bg-slate-950/40">
                    <th className="px-6 py-4">Informasi Produk</th>
                    <th className="px-6 py-4">Kinerja</th>
                    <th className="px-6 py-4 text-center">Manajemen Stok</th>
                    <th className="px-6 py-4 text-center">Status COD</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {myProducts.map((prod) => {
                    const statusNormal = prod.status ? prod.status.toString().toUpperCase() : "";

                    const isAvail = statusNormal === "AVAILABLE";
                    const isPending = statusNormal === "BOUGHT_PENDING";
                    const isSold = statusNormal === "SOLD";

                    console.log(`Debug Produk: ${prod.name} | Status DB: ${prod.status} | isPending: ${isPending}`);
                    return (
                      <tr key={prod.product_id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4.5 flex items-center space-x-3.5">
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-12 h-12 object-cover rounded-lg border border-white/5 bg-slate-900"
                          />
                          <div>
                            <div className="font-bold text-slate-100">{prod.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 max-w-[200px]">
                              {prod.category} • {formatRupiah(prod.price)}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1.5">
                            <span className="flex items-center space-x-1.5 text-xs text-slate-400" title="Dilihat pengguna lain">
                              <Eye className="w-3.5 h-3.5 text-cyan-400" /> <span>{prod.views} views</span>
                            </span>
                            <span className="flex items-center space-x-1.5 text-xs text-slate-400" title="Berhasil terjual (COD)">
                              <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" /> <span>{prod.sold} terjual</span>
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-3 bg-slate-900/50 p-1.5 rounded-xl border border-white/5 w-max mx-auto">
                            <button
                              onClick={() => handleUpdateStock(prod.product_id, 1, 'subtract')}
                              disabled={prod.stock <= 0}
                              className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg disabled:opacity-30 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold w-6 text-center">{prod.stock}</span>
                            <button
                              onClick={() => handleUpdateStock(prod.product_id, 1, 'add')}
                              className="p-1.5 bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center space-y-2">
                            {/* Indikator Status */}
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${isAvail ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                isPending ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                  "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                              {isAvail ? "Tersedia" : isPending ? "Menunggu COD" : "Terjual"}
                            </span>

                            {/* Tombol Konfirmasi COD - MUNCUL HANYA SAAT PENDING */}
                            {isPending && (
                              <button
                                onClick={() => handleConfirmSale(prod.product_id)}
                                className="w-full py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
                              >
                                <Handshake className="w-3.5 h-3.5" />
                                <span>Konfirmasi COD</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* MODAL TAMBAH PRODUK */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-white/10 glow-border shadow-2xl relative space-y-5 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-violet-400" />
                <span>Pasang Barang Baru</span>
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1 font-semibold">Nama Barang</label>
                <input type="text" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs text-slate-400 mb-1 font-semibold">Harga Jual (IDR)</label>
                  <input type="number" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500" required />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-slate-400 mb-1 font-semibold">Kategori</label>
                  <select value={newProdCategory} onChange={(e) => setNewProdCategory(e.target.value)} className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500">
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1 font-semibold">Deskripsi</label>
                <textarea rows="3" value={newProdDesc} onChange={(e) => setNewProdDesc(e.target.value)} className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500 resize-none" required></textarea>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1.5 font-semibold">Unggah Foto</label>
                {filePreview ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setSelectedFile(null); setFilePreview(""); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 text-rose-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-white/15 hover:border-violet-500/50 rounded-xl aspect-video flex flex-col items-center justify-center p-4 cursor-pointer">
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" required />
                  </label>
                )}
              </div>
              <div className="flex justify-end pt-3">
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5">
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div> : <><span>Pasang Sekarang</span><Check className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}