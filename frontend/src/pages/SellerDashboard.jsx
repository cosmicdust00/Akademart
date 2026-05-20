import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import { 
  Store, Plus, Trash2, Check, ToggleLeft, ToggleRight, DollarSign, 
  Layers, CheckCircle, Eye, X, Upload, Sparkles, Loader
} from "lucide-react";

export default function SellerDashboard() {
  const { user } = useAuth();
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
      // Menggunakan endpoint khusus seller agar produk yang laku juga tertarik
      const productsData = await api.seller.getProducts();
      
      if (Array.isArray(productsData)) {
        // Parser Harga dari Neo4j Integer (MencegahNaN)
        const parsedProducts = productsData.map(p => ({
            ...p,
            price: (p.price && p.price.low !== undefined) ? p.price.low : p.price
        }));

        setMyProducts(parsedProducts);

        // Kalkulasi Metrik
        let earnings = 0;
        let active = 0;
        let sold = 0;
        
        parsedProducts.forEach(p => {
          const isAvail = p.status === "available" || p.status === "Tersedia";
          if (isAvail) active += 1;
          else {
            sold += 1;
            earnings += p.price;
          }
        });

        // Simulasi view (nanti bisa disambungkan dengan properti Neo4j view count)
        const mockViews = parsedProducts.length * 12 + 5; 

        setMetrics({
          totalEarnings: earnings,
          activeCount: active,
          soldCount: sold,
          totalViews: mockViews
        });
      }
    } catch (err) {
      console.error("Gagal memuat dasbor penjual:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSellerData();
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleToggleStatus = async (product) => {
    const isAvail = product.status === "available" || product.status === "Tersedia";
    // Jika sedang available, kita set stok jadi 0 (sold_out). Jika terjual, set stok 1 (available)
    const targetStock = isAvail ? 0 : 1; 
    
    try {
      await api.seller.updateStock(product.product_id, targetStock, 'set');
      setToastMessage(`Status barang "${product.name}" berhasil diubah!`);
      setTimeout(() => setToastMessage(""), 3500);
      loadSellerData(); // Refresh data
    } catch (err) {
      console.error(err);
      alert("Gagal merubah status produk");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus barang jualan ini dari Akademart?")) return;
    try {
      // Menggunakan API delete khusus seller
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
      fd.append("stock", 1); // Default saat upload barang adalah 1
      fd.append("description", newProdDesc);
      // Di backend, kategori ditangkap sebagai array: categoryNames
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
      alert("Gagal menambahkan barang. Pastikan ukuran file gambar tidak terlalu besar.");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader className="w-8 h-8 text-violet-500 animate-spin mb-4" />
        <p className="text-xs text-slate-400">Memuat dasbor toko Anda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-violet-600 border border-violet-400/30 text-white font-semibold text-xs shadow-2xl flex items-center space-x-2 animate-scaleIn">
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10">
        {/* Dashboard Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-2">
              Toko <span className="text-violet-400">Saya</span>
            </h1>
            <p className="text-xs text-slate-500">
              Kelola barang jualan Anda dan pantau performa transaksi COD di lingkungan kampus.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            id="seller-add-product-btn"
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center space-x-2 glow-button cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>

        {/* Business Metrics Grid */}
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
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Listing Aktif</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{metrics.soldCount} Terjual</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Barang Terjual (COD)</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-amber-600/10 flex items-center justify-center text-amber-400">
              <Eye className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{metrics.totalViews} Kali</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Dilihat Mahasiswa</div>
            </div>
          </div>
        </section>

        {/* Listings Table Display */}
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
              <p className="text-xs text-slate-500">Mulai jual buku referensi, modul praktikum, atau aksesoris kos Anda yang tidak terpakai!</p>
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
                    <th className="px-6 py-4">Barang</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Harga</th>
                    <th className="px-6 py-4 text-center">Status Jualan</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {myProducts.map((prod) => {
                    const isAvail = prod.status === "available" || prod.status === "Tersedia";
                    return (
                      <tr key={prod.product_id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4.5 flex items-center space-x-3.5">
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-11 h-11 object-cover rounded-lg border border-white/5 bg-slate-900"
                          />
                          <div>
                            <div className="font-bold text-slate-100">{prod.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 max-w-[280px]">
                              {prod.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold px-2 py-1 bg-white/5 border border-white/5 text-slate-400 rounded-lg">
                            {prod.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-slate-200">
                          {formatRupiah(prod.price)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(prod)}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              isAvail
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}
                          >
                            {isAvail ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-rose-400" />}
                            <span>{isAvail ? "Tersedia (COD)" : "Terjual"}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteProduct(prod.product_id)}
                            className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                            title="Hapus Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* CREATE NEW LISTING OVERLAY MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-white/10 glow-border shadow-2xl relative space-y-5 animate-scaleIn max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-violet-400" />
                <span>Pasang Barang Baru</span>
              </h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setFilePreview("");
                  setSelectedFile(null);
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1 font-semibold">Nama Barang</label>
                <input
                  type="text"
                  placeholder="Contoh: Buku Kalkulus Purcell Edisi 9"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs text-slate-400 mb-1 font-semibold">Harga Jual (IDR)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 95000"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-slate-400 mb-1 font-semibold">Kategori</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1 font-semibold">Deskripsi & Kondisi Barang</label>
                <textarea
                  placeholder="Jelaskan kondisi barang, kelengkapan, dan tempat ketemuan COD..."
                  rows="3"
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 resize-none"
                  required
                ></textarea>
              </div>

              {/* File Image Upload Drag & Drop Area */}
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1.5 font-semibold">Unggah Foto Barang</label>
                
                {filePreview ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview("");
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 text-rose-400 hover:text-white"
                      title="Ganti gambar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-white/15 hover:border-violet-500/50 rounded-xl aspect-video flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-white/2 transition-all">
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-xs text-slate-300 font-semibold">Klik atau seret foto ke area ini</span>
                    <span className="text-[10px] text-slate-500 mt-1">Mendukung JPEG, PNG, WEBP (maks. 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                  </label>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setFilePreview("");
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Pasang Sekarang</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
