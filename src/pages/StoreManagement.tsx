import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Plus, Store } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { fetchLowItemStores, deleteStore } from '../services/storesAPI';
import { useAuth } from '../contexts/AuthContext';

interface StoreData {
  id: string;
  name: string;
  itemCount: number;
  createdAt?: string;
}

export default function StoreManagement() {
  const { user } = useAuth();
  const [allStores, setAllStores] = useState<StoreData[]>([]);
  const [lowItemStores, setLowItemStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchStores();
    }
  }, [user?.id]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const stores = await fetchLowItemStores(user?.id || '');
      const low = stores.filter((s: StoreData) => s.itemCount <= 2);
      const active = stores.filter((s: StoreData) => s.itemCount > 2);
      
      setAllStores(stores);
      setLowItemStores(low);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async (storeId: string, storeName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${storeName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(storeId);
    try {
      await deleteStore(storeId, user?.id || '');
      setAllStores(prev => prev.filter(s => s.id !== storeId));
      setLowItemStores(prev => prev.filter(s => s.id !== storeId));
      toast.success(`"${storeName}" deleted successfully`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete store');
    } finally {
      setDeleting(null);
    }
  };

  const activeStores = allStores.filter(s => s.itemCount > 2);
  const statsData = [
    { label: 'Total Stores', value: allStores.length, color: 'text-blue-600' },
    { label: 'Active Stores', value: activeStores.length, color: 'text-green-600' },
    { label: 'Flagged Stores', value: lowItemStores.length, color: 'text-amber-600' },
    { 
      label: 'Cleanup Rate', 
      value: `${allStores.length > 0 ? Math.round((lowItemStores.length / allStores.length) * 100) : 0}%`, 
      color: 'text-purple-600' 
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-8 h-8 text-indigo-600" />
            Store Management
          </h1>
          <p className="text-slate-600 mt-1">Manage your stores and maintain store quality</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {statsData.map((stat, idx) => (
            <motion.div
              key={stat.label}
              whileHover={{ translateY: -4 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
            >
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Active Stores Section */}
        {activeStores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Active Stores ({activeStores.length})
            </h2>
            <div className="space-y-2">
              {activeStores.map((store, idx) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  className="flex items-center justify-between bg-gradient-to-r from-green-50 to-transparent p-3 rounded-lg border border-green-200 hover:shadow-md transition"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{store.name}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {store.itemCount} items
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    ✓ Active
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Low-Item Stores Section */}
        {lowItemStores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Flagged Stores ({lowItemStores.length})
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              These stores have 2 or fewer items. Consider deleting them to maintain a healthy store list.
            </p>
            <div className="space-y-2">
              {lowItemStores.map((store, idx) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-transparent p-3 rounded-lg border-2 border-amber-200 hover:shadow-md transition"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{store.name}</p>
                    <p className="text-xs text-amber-700 mt-1 font-medium">
                      ⚠️ Only {store.itemCount} item{store.itemCount !== 1 ? 's' : ''} - Below minimum threshold
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteStore(store.id, store.name)}
                    disabled={deleting === store.id}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition disabled:opacity-50 flex-shrink-0"
                    title="Delete store"
                  >
                    {deleting === store.id ? (
                      <div className="animate-spin h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full"></div>
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {allStores.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-sm p-12 text-center"
          >
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No stores found</p>
            <p className="text-slate-500 text-sm mt-2">Create your first store to get started</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Create Store
            </motion.button>
          </motion.div>
        )}

        {/* Health Check Section */}
        {allStores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-sm p-6 border border-indigo-200"
          >
            <h3 className="font-semibold text-slate-900 mb-2">Store Health Status</h3>
            <div className="flex items-center gap-2">
              {lowItemStores.length === 0 ? (
                <>
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-sm text-green-700">
                    ✓ All stores are healthy! No cleanup required.
                  </p>
                </>
              ) : (
                <>
                  <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span>
                  <p className="text-sm text-amber-700">
                    {lowItemStores.length} store{lowItemStores.length !== 1 ? 's' : ''} need{lowItemStores.length === 1 ? 's' : ''} attention. Delete them to improve store quality.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
