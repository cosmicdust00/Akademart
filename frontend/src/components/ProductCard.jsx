import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, CheckCircle, AlertTriangle, User } from "lucide-react";
import { api } from "../services/api";

export default function ProductCard({ product, onAddToCart }) {
  const {
    product_id,
    name,
    price,
    description,
    image_url,
    status,
    category,
    seller_name,
    seller_jurusan,
    seller_angkatan,
  } = product;

  // Format price in Rupiah
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleCardClick = async () => {
    try {
      // Implicit profiling tracking: View action triggers graph edge update in background
      await api.graph.trackInteraction(product_id, "view");
    } catch (err) {
      console.error("Gagal mengirim event view:", err.message);
    }
  };

  const isAvailable = status === "available" || status === "Tersedia";

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col h-full group relative glow-border">
      {/* Product Image Panel */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        {/* Availability Badge */}
        <span
          className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide flex items-center space-x-1 shadow-md ${
            isAvailable
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md"
              : "bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur-md"
          }`}
        >
          {isAvailable ? (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              <span>COD Ready</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Terjual</span>
            </>
          )}
        </span>

        {/* Category Tag */}
        <span className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider bg-slate-950/80 text-violet-400 border border-white/5 backdrop-blur-md">
          {category}
        </span>

        <img
          src={image_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60"}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            // Fallback gradient if image fails to load
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60";
          }}
        />
      </div>

      {/* Card Detail Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Seller Hyper-Local Identification */}
          <div className="flex items-center space-x-1.5 text-[11px] text-cyan-400 font-medium mb-2.5">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[130px]">{seller_name}</span>
            <span className="text-slate-600">•</span>
            <span className="truncate">{seller_jurusan} ({seller_angkatan})</span>
          </div>

          <Link
            to={`/product/${product_id}`}
            onClick={handleCardClick}
            className="hover:underline text-slate-100 group-hover:text-violet-400 transition-colors duration-200"
          >
            <h3 className="font-bold text-base leading-snug line-clamp-1 mb-2">
              {name}
            </h3>
          </Link>

          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-4">
            {description}
          </p>
        </div>

        {/* Price & Buy Actions */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Harga COD</span>
            <span className="text-base font-extrabold text-white bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent">
              {formatRupiah(price)}
            </span>
          </div>

          {onAddToCart && isAvailable && (
            <button
              onClick={() => onAddToCart(product)}
              className="p-2.5 rounded-xl bg-violet-600/10 text-violet-400 hover:bg-violet-600 hover:text-white border border-violet-500/25 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-violet-600/20"
              title="Tambah ke Keranjang"
            >
              <ShoppingCart className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
