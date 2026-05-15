import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Plus, Minus, Search, ArrowLeft, Store as StoreIcon, Info } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../lib/utils';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  isAvailable: boolean;
  unit?: string;
  stock?: number;
}

interface Store {
  name: string;
  phone: string;
  address: string;
  logoUrl?: string;
}

export default function StoreView() {
  const { storeId } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart, updateQuantity, subtotal } = useCart();

  useEffect(() => {
    if (!storeId) return;

    const fetchData = async () => {
      try {
        const storeData = await api.getStoreById(storeId);
        setStore(storeData);

        const prodsData = await api.getProducts(storeId);
        setProducts(prodsData);
      } catch (error) {
        toast.error("Failed to load store data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId]);

  const filteredProducts = products.filter(p => p.isAvailable);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!store) return <div className="p-10 text-center text-slate-500 font-medium h-screen flex items-center justify-center">Store not found</div>;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-32">
      <header className="bg-white border-b border-slate-100 p-6 sticky top-0 z-20">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/" className="text-slate-400 hover:text-indigo-600 transition-colors"><ArrowLeft size={20} /></Link>
          <div className="flex-1 flex items-center gap-3">
            {store.logoUrl ? (
              <img src={store.logoUrl} className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" alt="" />
            ) : (
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                <StoreIcon size={20} />
              </div>
            )}
            <h1 className="text-xl font-display font-bold tracking-tight text-slate-800">{store.name}</h1>
          </div>
          <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Info size={20} /></button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search products..."
            className="w-full bg-slate-100 border-none h-11 pl-11 pr-4 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-800 outline-none"
          />
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8">
        {/* Product Grid */}
        <section className="grid grid-cols-1 gap-4">
          {filteredProducts.map(prod => {
            const inCart = cart.find(i => i.id === prod.id);
            const isOutOfStock = prod.stock !== undefined && prod.stock <= 0;
            const maxReached = inCart && prod.stock !== undefined && inCart.quantity >= prod.stock;

            return (
              <motion.div 
                layout
                key={prod.id}
                className={`bg-white p-4 rounded-2xl border border-slate-100 flex gap-4 shadow-sm hover:border-indigo-100 transition-colors ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="w-24 h-24 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-50">
                  <img 
                    referrerPolicy="no-referrer"
                    src={prod.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'} 
                    className="w-full h-full object-cover" 
                    alt={prod.name} 
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{prod.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">per {prod.unit || 'Nos'}</span>
                      {prod.stock !== undefined && (
                        <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${prod.stock < 10 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                          {prod.stock} Left
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-extrabold text-indigo-600">{formatCurrency(prod.price)}</span>
                    
                    {isOutOfStock ? (
                      <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full">Sold Out</span>
                    ) : inCart ? (
                      <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-full border border-slate-100 shadow-sm">
                        <button 
                          onClick={() => updateQuantity(prod.id, -1)}
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-black text-sm min-w-[1ch] text-center text-slate-800">{inCart.quantity}</span>
                        <button 
                          onClick={() => {
                            if (maxReached) {
                              toast.error(`Only ${prod.stock} available`);
                              return;
                            }
                            updateQuantity(prod.id, 1);
                          }}
                          disabled={maxReached}
                          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${maxReached ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white active:scale-90'}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart({ id: prod.id, name: prod.name, price: prod.price, quantity: 1, storeId: storeId! })}
                        className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-indigo-100 active:scale-90 transition-transform hover:bg-indigo-700"
                      >
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>
      </main>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 z-40 max-w-[380px] mx-auto"
          >
            <Link 
              to="/checkout"
              className="bg-slate-900 text-white p-4 rounded-3xl flex items-center justify-between shadow-2xl shadow-slate-300"
            >
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center relative shadow-sm">
                  <ShoppingCart size={20} />
                  <span className="absolute -top-1 -right-1 bg-white text-slate-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
                    {cart.length}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">In Cart</span>
                  <span className="font-bold">{formatCurrency(subtotal)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 font-bold text-indigo-400 ring-1 ring-indigo-400/20 px-3 py-1.5 rounded-full bg-indigo-400/5">
                Checkout <ShoppingCart size={16} />
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
