import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MapPin, Network, ArrowRight, UserPlus, Search, Handshake } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">

      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-violet-600/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />

      {/* Navbar Simple */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-violet-500" />
          <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Akademart
          </span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-5 py-2 text-slate-300 hover:text-white font-medium transition-colors">
            Masuk
          </Link>
          <Link
            to="/login"
            state={{ defaultMode: 'register' }}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-all"
          >
            Daftar
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-20 pb-32">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight">
          Marketplace Kampus <br />
          <span className="text-violet-500">Dengan Sistem Rekomendatif.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12">
          Jual beli buku, alat praktikum, dan perlengkapan kuliah dari sesama mahasiswa. Ditenagai oleh sistem graf untuk rekomendasi yang akurat.
        </p>

        <Link
          to="/login"
          state={{ defaultMode: 'register' }}
          className="flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-violet-600/25 hover:scale-105"
        >
          Mulai Jelajahi Katalog <ArrowRight className="w-5 h-5" />
        </Link>
      </main>

      {/* Features Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-2 gap-8">
        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm">
          <div className="p-3 bg-violet-500/20 w-fit rounded-xl mb-4">
            <MapPin className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-200">Local & COD</h3>
          <p className="text-slate-400 leading-relaxed">
            Semua penjual dan pembeli berada di lingkungan kampus yang sama. Transaksi langsung, aman, dan tanpa biaya ongkos kirim.
          </p>
        </div>

        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm">
          <div className="p-3 bg-indigo-500/20 w-fit rounded-xl mb-4">
            <Network className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-200">Graph Recommendation</h3>
          <p className="text-slate-400 leading-relaxed">
            Sistem menganalisis mata kuliah, jurusan, dan pola belanja untuk menampilkan barang yang relevan dengan kebutuhan user.
          </p>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-100">Cara Kerja Akademart</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6">
            <div className="p-4 bg-violet-500/10 rounded-full mb-6 border border-violet-500/20">
              <UserPlus className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-200">Buat Akun</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Daftar dan atur profil kamu untuk mendapatkan rekomendasi sesuai.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="p-4 bg-indigo-500/10 rounded-full mb-6 border border-indigo-500/20">
              <Search className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-200">Cari Barang</h3>
            <p className="text-slate-400 text-sm leading-relaxed w-80">
              Temukan buku, perangkat, atau perlengkapan kuliah yang dijual oleh teman sekampus.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6">
            <div className="p-4 bg-blue-500/10 rounded-full mb-6 border border-blue-500/20">
              <Handshake className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-200">Transaksi Aman</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Pilih lokasi dan waktu bertemu (COD) di area kampus.
            </p>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 mt-12">
        <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-violet-500" />
              <span className="text-lg font-bold text-slate-300">Akademart</span>
            </div>
            <p className="text-slate-500 text-sm">
              Marketplace untuk mahasiswa.
            </p>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Akademart.
          </p>
        </div>
      </footer>
    </div>
  );
}