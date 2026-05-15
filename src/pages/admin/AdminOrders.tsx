import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Clock, XCircle, Package, ChevronRight, Phone } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

export default function AdminOrders({ storeId }: { storeId: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [storeId]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      toast.success(`Order ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const togglePayment = async (orderId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
      await api.updatePaymentStatus(orderId, newStatus as any);
      toast.success(`Payment marked as ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const statusColors: any = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    accepted: 'bg-blue-50 text-blue-600 border-blue-100',
    preparing: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    ready: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    completed: 'bg-slate-100 text-slate-500 border-slate-200',
    rejected: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  if (loading) return <div className="flex h-32 items-center justify-center text-slate-400 font-medium">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-black tracking-tight text-slate-800">Orders</h2>
          <p className="text-slate-500 text-sm font-medium">{orders.length} orders total</p>
        </div>
      </header>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {orders.map(order => (
            <motion.div 
              layout
              key={order.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:border-indigo-100 transition-colors"
            >
              <div className="p-5 border-b border-slate-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        #{order.id.slice(-6)}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900">{order.items.length} Items</h3>
                    <p className="text-[11px] text-slate-400 font-semibold">{order.createdAt ? format(new Date(order.createdAt), 'p, d MMM') : 'Just now'}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-xl font-display font-black text-slate-900">{formatCurrency(order.total)}</p>
                    <label className="mt-2 flex items-center gap-2 cursor-pointer group">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                        Mark Paid
                      </span>
                      <div 
                        onClick={() => togglePayment(order.id, order.paymentStatus)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${order.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                      >
                        <motion.div 
                          animate={{ x: order.paymentStatus === 'paid' ? 22 : 2 }}
                          className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                        />
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Details</h4>
                    <a href={`tel:${order.customerPhone}`} className="text-indigo-600 p-2 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                      <Phone size={14} />
                    </a>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
                    <p className="text-xs text-slate-500 font-medium">{order.customerPhone}</p>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1 italic">
                      {order.customerAddress}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50/50">
                <div className="flex flex-wrap gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => updateStatus(order.id, 'accepted')}
                        className="flex-1 h-10 bg-slate-900 text-white rounded-xl text-xs font-bold transition-transform active:scale-95 shadow-sm"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => updateStatus(order.id, 'rejected')}
                        className="flex-1 h-10 bg-white border border-slate-200 text-rose-500 rounded-xl text-xs font-bold transition-transform active:scale-95 shadow-sm"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {order.status === 'accepted' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'preparing')}
                      className="flex-1 h-10 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 active:scale-95"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'ready')}
                      className="flex-1 h-10 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-100 active:scale-95"
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'completed')}
                      className="flex-1 h-10 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-100 active:scale-95"
                    >
                      Complete Order
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {orders.length === 0 && (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Package size={32} />
            </div>
            <p className="text-slate-400 font-medium">No orders yet recently.</p>
          </div>
        )}
      </div>
    </div>
  );
}
