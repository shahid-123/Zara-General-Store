import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, ShoppingCart, Package, Settings, Store as StoreIcon, LogOut } from 'lucide-react';
import AdminOverview from './admin/AdminOverview';
import AdminOrders from './admin/AdminOrders';
import AdminProducts from './admin/AdminProducts';
import AdminSettings from './admin/AdminSettings';
import toast from 'react-hot-toast';
import { api } from '../services/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchStore = async () => {
    setLoading(true);
    try {
      // Run cleanup first to ensure only one store exists
      await api.cleanupDuplicateStores();
      const data = await api.getMyStore();
      setStore(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, [user]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;

  if (!store) {
    return <CreateStorePage onCreated={(newStore) => setStore(newStore)} />;
  }

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
    { label: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    { label: 'Products', icon: Package, path: '/admin/products' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 max-w-md mx-auto">
      <header className="bg-white border-b border-slate-100 p-6 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <StoreIcon size={20} />
          </div>
          <div>
            <h1 className="font-display font-black tracking-tight text-lg text-slate-800">{store?.name || 'Admin'}</h1>
            <div className="flex items-center text-[10px] font-bold text-emerald-500 uppercase tracking-widest gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Store Live
            </div>
          </div>
        </div>
        <button 
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 p-6 pb-24">
        <Routes>
          <Route index element={<AdminOverview storeId={store.id} />} />
          <Route path="orders" element={<AdminOrders storeId={store.id} />} />
          <Route path="products" element={<AdminProducts storeId={store.id} />} />
          <Route path="settings" element={<AdminSettings storeId={store.id} store={store} onUpdate={fetchStore} />} />
        </Routes>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-2 flex justify-around items-center z-30 max-w-md mx-auto shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        {navItems.map(item => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${isActive ? 'text-indigo-600 bg-indigo-50/30' : 'text-slate-400'}`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function CreateStorePage({ onCreated }: { onCreated: (store: any) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.saveStore({ name, phone });
      const newStore = await api.getMyStore();
      onCreated(newStore);
      toast.success('Store created!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 flex flex-col items-center justify-center min-h-screen text-center space-y-6 bg-slate-50">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-4 shadow-sm">
        <StoreIcon size={40} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-black text-slate-900">Setup Your Store</h2>
        <p className="text-slate-500 font-medium max-w-xs">You need to create a store profile before you can manage products and orders.</p>
      </div>
      
      <form onSubmit={handleCreate} className="w-full space-y-4 max-w-xs transition-all">
        <input 
          type="text" 
          placeholder="Store Name" 
          value={name}
          required
          onChange={e => setName(e.target.value)}
          className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm transition-all"
        />
        <input 
          type="tel" 
          placeholder="Business Phone" 
          value={phone}
          required
          onChange={e => setPhone(e.target.value)}
          className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm transition-all"
        />
        <button 
          disabled={loading}
          className="w-full bg-indigo-600 text-white h-14 rounded-2xl font-bold shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95 transition-transform"
        >
          {loading ? 'Creating...' : 'Launch Store'}
        </button>
      </form>
    </div>
  );
}
