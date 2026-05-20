import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  ShoppingCart, 
  LogOut, 
  User as UserIcon, 
  Store, 
  Home as HomeIcon, 
  Search,
  Sparkles,
  Menu,
  X
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync cart items count
  useEffect(() => {
    const syncCart = () => {
      const stored = localStorage.getItem(`akademart_cart_${user?.user_id}`);
      if (stored) {
        const cartItems = JSON.parse(stored);
        const count = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
        setCartCount(count);
      } else {
        setCartCount(0);
      }
    };

    if (user) {
      syncCart();
      // Add custom event listener for cart updates
      window.addEventListener("cartUpdated", syncCart);
      return () => window.removeEventListener("cartUpdated", syncCart);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: "Beranda", path: "/home", icon: HomeIcon },
    { name: "Katalog", path: "/browse", icon: Store },
    { name: "Dasbor Penjual", path: "/seller", icon: UserIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass-nav shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <Link to="/home" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white animate-pulse-glow" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-violet-400 bg-clip-text text-transparent">
              Akade<span className="text-violet-400 font-black">mart</span>
            </span>
          </Link>

          {/* Navigation Links Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-violet-600/15 text-violet-400 border border-violet-500/20 shadow-inner"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Badge & Actions Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart Badge */}
            <Link
              to="/cart"
              className={`relative p-2.5 rounded-xl border transition-all duration-200 ${
                isActive("/cart")
                  ? "bg-violet-600/15 text-violet-400 border-violet-500/20"
                  : "text-slate-300 hover:text-white hover:bg-white/5 border-transparent"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-[10px] font-bold text-white ring-2 ring-slate-950 animate-bounce">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile Pill */}
            {user && (
              <div className="flex items-center space-x-3 pl-3 border-l border-white/10">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-100">{user.full_name}</div>
                  <div className="text-[10px] text-cyan-400 font-medium tracking-wide uppercase">
                    {user.jurusan}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-violet-500/30">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : "A"}
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  id="navbar-logout-btn"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-200 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Toggle Menu Mobile */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Cart Badge Mobile */}
            <Link
              to="/cart"
              className="relative p-2 text-slate-300 hover:text-white"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white ring-2 ring-slate-950">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-nav border-t border-white/5 px-4 pt-2 pb-4 space-y-2 animate-fadeIn">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium ${
                  active
                    ? "bg-violet-600/20 text-violet-400 border border-violet-500/10"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          
          {user && (
            <div className="pt-4 border-t border-white/5 mt-4 space-y-3">
              <div className="flex items-center space-x-3 px-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-inner">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : "A"}
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-100">{user.full_name}</div>
                  <div className="text-xs text-cyan-400">{user.jurusan} ({user.angkatan})</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
