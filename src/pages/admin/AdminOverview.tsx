import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, ShoppingBag, IndianRupee } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { api } from '../../services/api';

export default function AdminOverview({ storeId }: { storeId: string }) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const orders = await api.getOrders();
        
        let revenue = 0;
        let pending = 0;
        const customers = new Set();

        orders.forEach((order: any) => {
          if (order.status === 'completed' || order.paymentStatus === 'paid') revenue += order.total;
          if (order.status === 'pending') pending++;
          customers.add(order.customerId);
        });

        setStats({
          totalOrders: orders.length,
          totalRevenue: revenue,
          activeCustomers: customers.size,
          pendingOrders: pending
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
  }, [storeId]);

  const cards = [
    { label: 'Revenue', value: formatCurrency(stats.totalRevenue), icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending', value: stats.pendingOrders, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Customers', value: stats.activeCustomers, icon: Users, color: 'text-violet-500', bg: 'bg-violet-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <header>
        <h2 className="text-2xl font-display font-black tracking-tight text-slate-800">Overview</h2>
        <p className="text-slate-500 text-sm font-medium">How your store is performing today.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-xl flex items-center justify-center shadow-sm`}>
              <card.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className="text-xl font-display font-black text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative shadow-xl shadow-slate-200">
        <div className="relative z-10 space-y-4">
          <h3 className="font-bold text-lg">Daily Goal</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Goal Progress</span>
              <span className="text-indigo-400">75%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">You're doing great! Complete <span className="text-indigo-400 font-bold">5 more orders</span> to reach your daily target.</p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
