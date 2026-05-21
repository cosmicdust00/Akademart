import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import { 
  ShoppingCart, 
  Trash2, 
  MapPin, 
  Clock, 
  CheckCircle, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  AlertTriangle,
  X,
  FileText,
  Loader
} from "lucide-react";

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  // Checkout modal states
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [meetingSpot, setMeetingSpot] = useState("Selasar Fakultas");
  const [meetingTime, setMeetingTime] = useState("Besok Jam Istirahat (12:00 - 13:00)");
  const [customSpot, setCustomSpot] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState(null);

  const meetingSpots = [
    "Selasar Fakultas Komputer (Fasilkom)",
    "Kantin Fakultas Teknik (FT)",
    "Perpustakaan Pusat Kampus",
    "Gedung Kuliah Bersama (GKB)",
    "Masjid Raya Kampus",
    "Kantin Pujasera Utama"
  ];

  const loadCart = () => {
    try {
      const cartKey = `akademart_cart_${user?.user_id}`;
      const stored = localStorage.getItem(cartKey);
      
      if (stored) {
        let parsed = JSON.parse(stored);
        
        // Pastikan formatnya selalu array (mencegah error jika data korup)
        if (!Array.isArray(parsed)) parsed = [];
        
        // Filter super ketat: Hanya masukkan barang yang datanya lengkap
        const validItems = parsed.filter(item => 
          item && 
          item.product_id && 
          item.name && 
          item.price !== undefined
        );
        
        setCartItems(validItems);
        
        // Perbarui localStorage jika ada barang rusak yang dibuang
        if (validItems.length !== parsed.length) {
          localStorage.setItem(cartKey, JSON.stringify(validItems));
        }
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error("Data keranjang rusak, melakukan reset...", err);
      // Jika JSON parse gagal total, reset keranjang
      setCartItems([]);
      localStorage.removeItem(`akademart_cart_${user?.user_id}`);
    } finally {
      // APAPUN YANG TERJADI, PASTIKAN LOADING BERHENTI
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.user_id) {
      loadCart();
    } else {
      // Jika user gagal dimuat (atau delay), paksa loading berhenti
      const timer = setTimeout(() => setLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Remove from cart
  const handleRemove = (productId) => {
    const cartKey = `akademart_cart_${user?.user_id}`;
    const updated = cartItems.filter(item => item.product_id !== productId);
    
    setCartItems(updated);
    localStorage.setItem(cartKey, JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
    
    setToastMessage("Barang dihapus dari keranjang.");
    setTimeout(() => setToastMessage(""), 2500);
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const shippingFee = 0; // Same campus COD is always free
  const total = subtotal + shippingFee;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    const finalSpot = meetingSpot === "Ketik Sendiri..." ? customSpot : meetingSpot;
    if (!finalSpot) {
      alert("Silakan tentukan atau ketik lokasi titik temu COD Anda.");
      return;
    }

    try {
      // Buat array untuk menampung barang yang sukses dan gagal
      let successItems = [];
      let failedItems = [];

      for (const item of cartItems) {
        try {
          // Tembak endpoint interaksi BOUGHT ke backend Neo4j
          await api.interactions.buy(item.product_id);
          successItems.push(item);
        } catch (err) {
          // Jika Neo4j melempar 400 (Barang habis/tidak ada)
          failedItems.push(item.name);
        }
      }

      // Jika ada barang yang gagal dibeli (sudah keduluan orang lain)
      if (failedItems.length > 0) {
        alert(`Mohon maaf, barang berikut sudah habis terjual atau tidak tersedia:\n- ${failedItems.join('\n- ')}\n\nSilakan hapus dari keranjang Anda.`);
        return; // Hentikan proses checkout
      }

      // Jika semua sukses, Buat Tiket/Resi Pembelian
      const orderRef = `COD-${Date.now().toString().slice(-6)}`;
      setLastOrderDetails({
        orderId: orderRef,
        items: [...cartItems], // Semua pasti stok 1
        total,
        spot: finalSpot,
        time: meetingTime
      });

      // Bersihkan keranjang belanja di LocalStorage
      const cartKey = `akademart_cart_${user?.user_id}`;
      localStorage.removeItem(cartKey);
      setCartItems([]);
      window.dispatchEvent(new Event("cartUpdated"));

      // Buka pop-up sukses
      setCheckoutOpen(false);
      setSuccessOpen(true);
    } catch (err) {
      alert("Terjadi kesalahan sistem saat checkout COD.");
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
        <p className="text-xs text-slate-400">Memuat keranjang belanja...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <Navbar />

      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-violet-600 border border-violet-400/30 text-white font-semibold text-xs shadow-2xl flex items-center space-x-2 animate-scaleIn">
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-2">
            Keranjang <span className="text-violet-400">Belanja</span>
          </h1>
          <p className="text-xs text-slate-500">
            Periksa kembali barang belanjaan Anda dan atur jadwal COD dengan seller kampus.
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/10 p-16 text-center space-y-5 glow-border max-w-xl mx-auto">
            <ShoppingCart className="w-14 h-14 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <h2 className="text-base font-bold">Keranjang Belanja Kosong</h2>
              <p className="text-xs text-slate-400">Anda belum menambahkan produk kampus apa pun ke keranjang belanja.</p>
            </div>
            <Link
              to="/browse"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              <span>Jelajahi Katalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Column 1: Items List */}
            <div className="lg:col-span-8 space-y-4">
              {cartItems.map((item) => (
                <div 
                  key={item.product_id}
                  className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-4 animate-scaleIn"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded-xl border border-white/5 bg-slate-900"
                    />
                    <div>
                      <h3 className="font-bold text-slate-100 line-clamp-1 text-sm">{item.name}</h3>
                      <div className="text-[10px] text-cyan-400 mt-1">
                        Seller: {item.seller_name} ({item.seller_jurusan})
                      </div>
                      <div className="text-xs font-bold text-slate-300 mt-1">
                        {formatRupiah(item.price)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Adjusters */}
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                      Kuantitas: 1
                    </span>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(item.product_id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors cursor-pointer"
                      title="Hapus dari keranjang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 2: Checkout Summary Card */}
            <div className="lg:col-span-4">
              <div className="glass-panel rounded-3xl p-6 border border-white/10 glow-border space-y-6">
                <h3 className="font-bold text-base text-slate-100 border-b border-white/5 pb-3">Ringkasan Pembelian</h3>
                
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Jumlah Barang</span>
                    <span className="font-bold text-slate-200">
                      {cartItems.reduce((acc, curr) => acc + curr.quantity, 0)} Items
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal Produk</span>
                    <span className="font-bold text-slate-200">{formatRupiah(subtotal)}</span>
                  </div>

                  {/* Hyper local shipping benefit */}
                  <div className="flex justify-between items-center text-emerald-400 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/15">
                    <span className="flex items-center space-x-1.5 font-semibold">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
                      <span>Same-Campus COD Rate</span>
                    </span>
                    <span className="font-bold uppercase text-[10px]">Gratis Ongkir</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Total Tagihan</span>
                    <span className="text-xl font-black text-white bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent">
                      {formatRupiah(total)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setCheckoutOpen(true)}
                  id="checkout-proceed-btn"
                  className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transition-all text-xs flex items-center justify-center space-x-2 glow-button cursor-pointer"
                >
                  <span>Lanjutkan Ke Checkout COD</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* CHECKOUT POPUP DIALOG */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/10 glow-border shadow-2xl relative space-y-5 animate-scaleIn max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-violet-400" />
                <span>Atur Titik Temu COD</span>
              </h2>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              
              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1.5 font-semibold">Pilih Lokasi Pertemuan Kampus</label>
                <select
                  value={meetingSpot}
                  onChange={(e) => setMeetingSpot(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500 cursor-pointer appearance-none"
                >
                  {meetingSpots.map((spot) => (
                    <option key={spot} value={spot}>{spot}</option>
                  ))}
                  <option value="Ketik Sendiri...">Ketik Sendiri...</option>
                </select>
              </div>

              {meetingSpot === "Ketik Sendiri..." && (
                <div className="flex flex-col animate-scaleIn">
                  <label className="text-xs text-slate-400 mb-1 font-semibold">Tulis Lokasi Spesifik</label>
                  <input
                    type="text"
                    placeholder="Contoh: Depan GKB V Fasilkom Lantai 2"
                    value={customSpot}
                    onChange={(e) => setCustomSpot(e.target.value)}
                    className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>
              )}

              <div className="flex flex-col">
                <label className="text-xs text-slate-400 mb-1 font-semibold flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Jadwal / Waktu Pertemuan COD</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Besok jam 12:00 saat istirahat"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="pt-2 text-[11px] text-slate-500 italic leading-relaxed">
                * Sistem ini tidak memerlukan pembayaran kartu/transfer. Anda akan membayar langsung ke penjual menggunakan tunai (COD) setelah barang diperiksa langsung di tempat pertemuan.
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  id="checkout-confirm-btn"
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Konfirmasi Pembelian</span>
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION SUCCESS TICKETS DIALOG */}
      {successOpen && lastOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-slate-900 border-2 border-dashed border-violet-500/30 relative text-center space-y-6 shadow-2xl shadow-violet-500/20 animate-scaleIn">
            
            {/* Success icon */}
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
              <CheckCircle className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Pesanan COD Berhasil!</h2>
              <p className="text-xs text-slate-400">Tiket pesanan COD Anda telah diterbitkan.</p>
            </div>

            {/* Ticket Slip Container */}
            <div className="p-4 bg-slate-950/70 border border-white/5 rounded-2xl text-left text-xs space-y-3.5 relative overflow-hidden">
              {/* Slip header logo */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                <span className="flex items-center space-x-1 text-violet-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Akademart COD Slip</span>
                </span>
                <span>ID: {lastOrderDetails.orderId}</span>
              </div>

              {/* Items in ticket */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Barang Belanja</div>
                <div className="divide-y divide-white/5">
                  {lastOrderDetails.items.map((item) => (
                    <div key={item.product_id} className="py-1.5 flex justify-between font-medium">
                      <span className="truncate max-w-[200px] text-slate-300">
                        {item.name} <span className="text-slate-500 font-normal">x{item.quantity}</span>
                      </span>
                      <span className="text-slate-200">{formatRupiah(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* COD instructions */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">Titik Pertemuan</span>
                  <span className="text-cyan-400 font-bold mt-0.5">{lastOrderDetails.spot}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">Waktu Janjian COD</span>
                  <span className="text-violet-300 font-semibold mt-0.5">{lastOrderDetails.time}</span>
                </div>
              </div>

              {/* Ticket Footer */}
              <div className="pt-2.5 border-t border-white/5 flex justify-between items-center text-slate-300">
                <span className="font-semibold text-slate-400">Total COD Tunai</span>
                <span className="font-black text-sm text-emerald-400">{formatRupiah(lastOrderDetails.total)}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
              Silakan temui penjual sesuai lokasi dan waktu di atas. Pastikan untuk membawa uang pas. Relasi graph Anda telah terhubung!
            </div>

            <button
              onClick={() => {
                setSuccessOpen(false);
                setLastOrderDetails(null);
                navigate("/home");
              }}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}