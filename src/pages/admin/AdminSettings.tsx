import React, { useState } from 'react';
import { LogOut, Save, MapPin, Phone, Info, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminSettings({ storeId, store, onUpdate }: { storeId: string, store: any, onUpdate?: () => void }) {
  const { logout } = useAuth();
  const [formData, setFormData] = useState({
    name: store?.name || '',
    phone: store?.phone || '',
    address: store?.address || '',
    upiId: store?.upiId || '',
    logoUrl: store?.logoUrl || ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.saveStore({ ...formData, id: storeId });
      toast.success('Settings updated!');
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    logout();
    navigate('/');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <header>
        <h2 className="text-2xl font-display font-black tracking-tight text-slate-800">Settings</h2>
        <p className="text-slate-500 text-sm font-medium">Update your store information.</p>
      </header>

      <form onSubmit={handleUpdate} className="space-y-6">
        <section className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Store Profile</label>
            <div className="grid grid-cols-1 gap-3">
              <div className="relative">
                <Info className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-4 font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm"
                  placeholder="Store Name"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-4 font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm"
                  placeholder="Phone"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                <textarea 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full h-32 bg-white border border-slate-100 rounded-2xl pl-12 pr-4 pt-4 font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm resize-none"
                  placeholder="Store Address"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Payments (UPI)</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={formData.upiId}
                onChange={e => setFormData({...formData, upiId: e.target.value})}
                className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-4 font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm"
                placeholder="UPI ID (e.g. store@upi)"
              />
            </div>
            <p className="text-[10px] text-slate-400 px-1 font-medium italic">Customers will see this ID to pay via any UPI app during checkout or pickup.</p>
          </div>
        </section>

        <div className="flex gap-4 pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 bg-slate-900 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-100 active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
            <Save size={18} />
          </button>
          
          <button 
            type="button"
            onClick={handleLogout}
            className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <LogOut size={22} />
          </button>
        </div>
      </form>

      <section className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 space-y-2">
        <h4 className="font-display font-bold text-indigo-800">Support Center</h4>
        <p className="text-xs text-indigo-700 leading-relaxed font-medium">Need help setting up your POS or managing inventory? Reach out to our technical support team available 24/7.</p>
        <button className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-2 hover:underline">Contact Support</button>
      </section>
    </div>
  );
}
