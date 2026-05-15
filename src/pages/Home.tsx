import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Store, ChevronRight, BarChart3, CreditCard, ArrowRight, MapPin, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await api.getStores();
        setStores(data);
      } catch (error) {
        console.error('Failed to fetch stores:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-xl font-display font-black tracking-tight text-slate-800">Zara's General Store</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Digitizing Local Shops</p>
            </div>
          </div>
          {user && (
            <button 
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-6 space-y-8 pb-20">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4"
        >
          <h2 className="text-4xl font-display font-extrabold leading-tight tracking-tight text-slate-900">
            Your Local Shop, <span className="text-indigo-600">Goes Online.</span>
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed font-medium">
            Browse products from your favorite neighborhood stores, order instantly, and pay securely.
          </p>
        </motion.section>

        <section className="grid grid-cols-1 gap-4">
          {user ? (
            <div className="space-y-4">
              {user.role === 'admin' ? (
                <Link to="/admin" className="group relative block overflow-hidden bg-slate-900 text-white p-6 rounded-3xl transition-transform active:scale-95 shadow-xl shadow-slate-200">
                  <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                    <div>
                      <BarChart3 className="text-indigo-400 mb-2" size={32} />
                      <h3 className="text-2xl font-display font-black">Admin Dashboard</h3>
                      <p className="text-slate-400 text-sm mt-1">Manage orders, products, and revenue.</p>
                    </div>
                    <div className="flex items-center text-indigo-400 font-semibold gap-1">
                      Manage Store <ChevronRight size={18} />
                    </div>
                  </div>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-600/20 transition-colors" />
                </Link>
              ) : (
                <Link to="/orders" className="group relative block overflow-hidden bg-indigo-600 text-white p-6 rounded-3xl transition-transform active:scale-95 shadow-xl shadow-indigo-100">
                  <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                    <div>
                      <ShoppingBag className="text-white mb-2 shadow-sm" size={32} />
                      <h3 className="text-2xl font-display font-black">My Orders</h3>
                      <p className="text-indigo-100 text-sm mt-1">Track your active and past orders.</p>
                    </div>
                    <div className="flex items-center text-white font-semibold gap-1">
                      View All Orders <ChevronRight size={18} />
                    </div>
                  </div>
                </Link>
              )}
            </div>
          ) : (
            <Link to="/login" className="bg-indigo-600 text-white p-6 rounded-3xl flex items-center justify-between shadow-xl shadow-indigo-100 transition-transform active:scale-95">
              <div className="flex flex-col">
                <span className="text-xl font-bold">Get Started</span>
                <span className="text-sm text-indigo-100">Login with mobile for best experience</span>
              </div>
              <ChevronRight size={24} />
            </Link>
          )}

          <div className="space-y-4 pt-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2">Popular Stores Near You</h4>
            {loading ? (
              <div className="flex justify-center p-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : stores.length > 0 ? (
              <div className="space-y-3">
                {stores.map(store => (
                  <Link 
                    key={store.id} 
                    to={`/store/${store.id}`}
                    className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                      <Store size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-slate-900 truncate">{store.name}</h5>
                      <div className="flex items-center text-slate-400 text-[10px] uppercase font-bold tracking-wider gap-1">
                        <MapPin size={10} /> {store.address || 'Local Shop'}
                      </div>
                    </div>
                    <ArrowRight className="text-slate-300" size={18} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                <Store className="mx-auto text-slate-300" size={32} />
                <p className="text-slate-400 text-sm font-medium">No stores online yet. Be the first!</p>
              </div>
            )}
          </div>

          <div className="pt-4 pb-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 px-2">Store Features</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:border-indigo-100 transition-colors">
                <CreditCard className="text-indigo-500" size={20} />
                <h5 className="font-bold text-sm text-slate-800">QR Payments</h5>
                <p className="text-[11px] text-slate-500">Scan & pay at the store instantly.</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2 hover:border-indigo-100 transition-colors">
                <ShoppingBag className="text-emerald-500" size={20} />
                <h5 className="font-bold text-sm text-slate-800">Real-time Orders</h5>
                <p className="text-[11px] text-slate-500 font-medium">Get notified when your order is ready.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="p-6 pt-0 text-center pb-10">
        <p className="text-xs text-slate-400 font-medium">Built with StoreLink SaaS Tech.</p>
      </footer>
    </div>
  );
}
