import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { Download, FileText, Trash2, AlertCircle, BarChart3, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { fetchSalesStatistics, fetchLowItemStores, deleteStore } from '../services/storesAPI';
import { useAuth } from '../contexts/AuthContext';

interface DailySales {
  date: string;
  revenue: number;
  orders: number;
  items: number;
  avgOrderValue: number;
}

interface Store {
  id: string;
  name: string;
  itemCount: number;
}

export default function DailySalesStatistics() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [salesData, setSalesData] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(false);
  const [lowItemStores, setLowItemStores] = useState<Store[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch stores and low-item stores on mount
  useEffect(() => {
    if (user?.id) {
      fetchLowItemStores(user.id).then(setLowItemStores).catch(console.error);
    }
  }, [user?.id]);

  const handleGenerateReport = async () => {
    if (!selectedStore) {
      toast.error('Please select a store');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchSalesStatistics(selectedStore, startDate, endDate);
      setSalesData(data.dailyStats || []);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;

    setDeleting(storeId);
    try {
      await deleteStore(storeId, user?.id || '');
      setLowItemStores(prev => prev.filter(s => s.id !== storeId));
      toast.success('Store deleted successfully');
    } catch (error) {
      toast.error('Failed to delete store');
      console.error(error);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownloadPDF = () => {
    if (salesData.length === 0) {
      toast.error('No data to download');
      return;
    }

    const storeName = stores.find(s => s.id === selectedStore)?.name || 'Store';
    const html = generateHTMLReport(storeName, startDate, endDate, salesData);
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${storeName}-${startDate}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  const handleDownloadCSV = () => {
    if (salesData.length === 0) {
      toast.error('No data to download');
      return;
    }

    const storeName = stores.find(s => s.id === selectedStore)?.name || 'Store';
    const csv = generateCSV(salesData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${storeName}-${startDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  // Calculate summary stats
  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
  const totalItems = salesData.reduce((sum, d) => sum + d.items, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Daily Sales Statistics
          </h1>
          <p className="text-slate-600 mt-1">View and export your store sales reports</p>
        </motion.div>

        {/* Low-Item Stores Alert */}
        {lowItemStores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Low-Item Stores</h3>
                <p className="text-sm text-amber-800 mt-1">
                  You have {lowItemStores.length} store(s) with 2 or fewer items. Clean them up to maintain a healthy store list.
                </p>
                <div className="mt-3 space-y-2">
                  {lowItemStores.map(store => (
                    <div key={store.id} className="flex items-center justify-between bg-white rounded p-2">
                      <span className="text-sm font-medium text-slate-700">
                        {store.name} ({store.itemCount} item{store.itemCount !== 1 ? 's' : ''})
                      </span>
                      <button
                        onClick={() => handleDeleteStore(store.id)}
                        disabled={deleting === store.id}
                        className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Store Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Store
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Choose a store...</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateReport}
            disabled={loading || !selectedStore}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </motion.button>
        </motion.div>

        {/* Summary Cards */}
        {salesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <SummaryCard
              label="Total Revenue"
              value={`₹${totalRevenue.toFixed(2)}`}
              icon={TrendingUp}
              color="bg-blue-50"
            />
            <SummaryCard
              label="Total Orders"
              value={totalOrders.toString()}
              icon={FileText}
              color="bg-green-50"
            />
            <SummaryCard
              label="Items Sold"
              value={totalItems.toString()}
              icon={BarChart3}
              color="bg-purple-50"
            />
            <SummaryCard
              label="Avg Order Value"
              value={`₹${avgOrderValue.toFixed(2)}`}
              icon={TrendingUp}
              color="bg-orange-50"
            />
          </motion.div>
        )}

        {/* Data Table */}
        {salesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700">Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700">Orders</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700">Items</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700">Avg Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {salesData.map((day, idx) => (
                    <motion.tr
                      key={day.date}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-3 text-sm font-medium text-slate-900">
                        {format(new Date(day.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-semibold text-green-600">
                        ₹{day.revenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-slate-600">{day.orders}</td>
                      <td className="px-6 py-3 text-sm text-right text-slate-600">{day.items}</td>
                      <td className="px-6 py-3 text-sm text-right text-slate-600">
                        ₹{day.avgOrderValue.toFixed(2)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Export Buttons */}
            <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadCSV}
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-2 px-4 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function SummaryCard({ label, value, icon: Icon, color }: SummaryCardProps) {
  return (
    <motion.div
      whileHover={{ translateY: -4 }}
      className={`${color} rounded-lg p-4 border border-slate-200`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-600">{label}</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <Icon className="w-8 h-8 text-slate-400 opacity-50" />
      </div>
    </motion.div>
  );
}

function generateHTMLReport(storeName: string, startDate: string, endDate: string, data: DailySales[]) {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const totalItems = data.reduce((sum, d) => sum + d.items, 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sales Report - ${storeName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        h1 { color: #1e293b; margin: 0; }
        .meta { color: #64748b; font-size: 14px; margin-top: 10px; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-box { background: #f1f5f9; padding: 20px; border-radius: 8px; }
        .stat-label { font-size: 12px; color: #64748b; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1e293b; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: bold; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 40px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${storeName} - Sales Report</h1>
        <div class="meta">
          Period: ${startDate} to ${endDate}
          <br/>
          Generated: ${new Date().toLocaleString()}
        </div>
      </div>

      <div class="summary">
        <div class="stat-box">
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value">₹${totalRevenue.toFixed(2)}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Total Orders</div>
          <div class="stat-value">${totalOrders}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Items Sold</div>
          <div class="stat-value">${totalItems}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Revenue</th>
            <th>Orders</th>
            <th>Items</th>
            <th>Avg Order Value</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(day => `
            <tr>
              <td>${new Date(day.date).toLocaleDateString()}</td>
              <td>₹${day.revenue.toFixed(2)}</td>
              <td>${day.orders}</td>
              <td>${day.items}</td>
              <td>₹${day.avgOrderValue.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This is an auto-generated report. Please contact support for any discrepancies.</p>
      </div>
    </body>
    </html>
  `;
}

function generateCSV(data: DailySales[]) {
  const headers = ['Date', 'Revenue', 'Orders', 'Items', 'Avg Order Value'];
  const rows = data.map(day => [
    new Date(day.date).toLocaleDateString(),
    day.revenue.toFixed(2),
    day.orders,
    day.items,
    day.avgOrderValue.toFixed(2)
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}
