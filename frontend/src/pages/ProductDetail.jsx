import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { 
  ShoppingCart, 
  MapPin, 
  User, 
  Calendar, 
  ChevronLeft, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader,
  AlertTriangle,
  Compass,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [interactionState, setInteractionState] = useState(null); // 'liked', 'disliked', or null

  useEffect(() => {
    const loadProductData = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        // 1. Fetch individual product
        const res = await api.products.getById(id);
        if (res.success && res.product) {
          setProduct(res.product);

          // 2. Fetch all products to compute related products in the same category
          const allRes = await api.products.getAll();
          if (allRes.success) {
            const others = allRes.products.filter(
              (p) => p.product_id !== id && p.category === res.product.category && p.status === "available"
            );
            setRelatedProducts(others.slice(0, 3));
          }

          // 3. Trigger IMPLICIT tracking event 'view'
          await api.graph.trackInteraction(id, "view");
        } else {
          setErrorMsg("Barang tidak ditemukan di Akademart.");
        }
      } catch (err) {
        setErrorMsg(err.message || "Terjadi kesalahan saat memuat barang.");
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [id]);

  // Format currency
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleAddToCart = () => {
    if (!product) return;
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

      // Trigger implicit interaction edge
      api.graph.trackInteraction(product.product_id, "cart");

      // Notify navbar
      window.dispatchEvent(new Event("cartUpdated"));

      setToastMessage(`Berhasil menambahkan "${product.name}" ke keranjang!`);
      setTimeout(() => setToastMessage(""), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuyNow = () => {
    // Add to cart and immediately jump to checkout
    handleAddToCart();
    navigate("/cart");
  };

  const handleLike = async () => {
    if (!product) return;
    try {
      if (interactionState === 'liked') {
        await api.interactions.remove(product.product_id);
        setInteractionState(null);
        setToastMessage("Batal menyukai produk.");
      } else {
        await api.interactions.like(product.product_id);
        setInteractionState('liked');
        setToastMessage("Produk disukai! Rekomendasi akan disesuaikan.");
      }
      setTimeout(() => setToastMessage(""), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislike = async () => {
    if (!product) return;
    try {
      if (interactionState === 'disliked') {
        await api.interactions.remove(product.product_id);
        setInteractionState(null);
        setToastMessage("Batal dislike produk.");
      } else {
        await api.interactions.dislike(product.product_id);
        setInteractionState('disliked');
        setToastMessage("Produk tidak disukai. Kami akan menyesuaikan rekomendasi.");
      }
      setTimeout(() => setToastMessage(""), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader className="w-8 h-8 text-violet-500 animate-spin mb-4" />
        <p className="text-xs text-slate-400">Memuat rincian barang...</p>
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 mt-20 text-center space-y-6">
          <div className="p-6 bg-slate-900 rounded-3xl border border-white/5 space-y-4">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold">Terjadi Kesalahan</h2>
            <p className="text-sm text-slate-400">{errorMsg || "Barang yang Anda cari tidak tersedia."}</p>
          </div>
          <Link
            to="/browse"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-violet-600 rounded-xl text-xs font-semibold text-white shadow-md shadow-violet-500/20 hover:bg-violet-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const isAvailable = product.status === "available" || product.status === "Tersedia";

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
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to="/browse"
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </Link>
        </div>

        {/* Double-Column Display Detail */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Column 1: Media Preview Image */}
          <div className="lg:col-span-6 glass-panel rounded-3xl overflow-hidden border border-white/10 p-2 glow-border">
            <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900">
              <img
                src={product.image_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700&auto=format&fit=crop&q=60"}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Column 2: Information Details Panel */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              {/* Category Tag & Status Badge */}
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider bg-violet-600/10 text-violet-400 border border-violet-500/20">
                  {product.category}
                </span>

                <span
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                    isAvailable
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                  }`}
                >
                  {isAvailable ? "Tersedia" : "Sudah Terjual"}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="flex flex-col pt-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Harga Pembelian COD</span>
                <span className="text-3xl font-black text-white bg-gradient-to-r from-white via-slate-100 to-violet-300 bg-clip-text text-transparent">
                  {formatRupiah(product.price)}
                </span>
              </div>
            </div>

            {/* Hyper-Local Campus Seller Banner */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
              <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Identitas Seller Kampus</span>
              </span>

              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-white flex items-center justify-center font-bold text-base shadow-md">
                  {product.seller_name ? product.seller_name.charAt(0).toUpperCase() : "A"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-100">{product.seller_name}</div>
                  <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{product.seller_jurusan} ({product.seller_angkatan})</span>
                  </div>
                </div>
              </div>

              <div className="pt-3.5 border-t border-white/5 grid grid-cols-2 gap-4 text-xs text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>COD Area Kampus</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Tanpa Biaya Ongkir</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Deskripsi Barang</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Interaction / Recommendation Feedback */}
            <div className="flex items-center space-x-3 pt-2">
              <span className="text-xs text-slate-400 font-medium mr-2">Bantu sesuaikan rekomendasi:</span>
              <button
                onClick={handleLike}
                className={`p-2 rounded-lg border transition-all duration-300 flex items-center space-x-2 ${
                  interactionState === 'liked'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                    : 'bg-slate-800/50 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-emerald-400'
                }`}
                title="Suka produk ini"
              >
                <ThumbsUp className={`w-4 h-4 ${interactionState === 'liked' ? 'fill-emerald-400/20' : ''}`} />
              </button>
              <button
                onClick={handleDislike}
                className={`p-2 rounded-lg border transition-all duration-300 flex items-center space-x-2 ${
                  interactionState === 'disliked'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                    : 'bg-slate-800/50 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-rose-400'
                }`}
                title="Kurang suka produk ini"
              >
                <ThumbsDown className={`w-4 h-4 ${interactionState === 'disliked' ? 'fill-rose-400/20' : ''}`} />
              </button>
            </div>

            {/* Transactions Actions Bar */}
            {isAvailable ? (
              <div className="flex items-center space-x-4 pt-4 border-t border-white/5">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 rounded-xl border border-violet-500/35 bg-violet-600/10 text-violet-400 hover:bg-violet-600 hover:text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm hover:shadow-violet-600/20"
                >
                  <ShoppingCart className="w-4.5 h-4.5" />
                  <span>Tambah Keranjang</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer glow-button shadow-lg shadow-violet-500/25"
                >
                  <span>Beli Sekarang (COD)</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/80 rounded-xl border border-white/5 text-center text-sm font-semibold text-slate-500 italic">
                Barang ini sudah terjual ke mahasiswa lain.
              </div>
            )}
          </div>
        </section>

        {/* RELATED / RECOMMENDATIONS SECTION (Graph-Driven context) */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-10 border-t border-white/5">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-widest text-violet-400 font-bold flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rekomendasi Terkait</span>
              </span>
              <h3 className="text-xl font-bold text-slate-100">Pembeli Yang Melihat Ini Juga Melirik...</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.product_id}
                  product={p}
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
