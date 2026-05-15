import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../lib/utils';
import { ArrowLeft, CreditCard, Wallet, Banknote, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

export default function Checkout() {
  const { user } = useAuth();
  const { cart, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cash'>('cash');
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: (user as any)?.address || '',
  });
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    if (!user || cart.length === 0) return;
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast.error('Please fill in all delivery details');
      return;
    }
    setLoading(true);

    try {
      const orderData = {
        customerId: user.id,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
        storeId: cart[0].storeId,
        items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        total: subtotal,
        paymentMethod: paymentMethod,
        paymentStatus: 'unpaid',
      };

      await api.createOrder(orderData);
      
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error: any) {
      toast.error('Failed to place order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-50">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-inner">
          <Wallet size={40} />
        </div>
        <h2 className="text-xl font-display font-bold text-slate-800">Your cart is empty</h2>
        <Link to="/" className="text-indigo-600 font-bold mt-2 hover:underline">Back to shopping</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 p-6 flex items-center gap-4 sticky top-0 z-20">
        <Link to={`/store/${cart[0].storeId}`} className="text-slate-400 hover:text-indigo-600 transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-display font-bold tracking-tight text-slate-800">Checkout</h1>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Delivery Details</h3>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Your Full Name"
              value={customerInfo.name}
              onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
            />
            <input 
              type="tel" 
              placeholder="Phone Number for Contact"
              value={customerInfo.phone}
              onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
            />
            <textarea 
              placeholder="Full Delivery Address"
              value={customerInfo.address}
              onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
              className="w-full h-24 bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none"
            />
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Order Summary</h3>
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">{item.quantity}x</span>
                  <span className="text-slate-700">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Total Amount</span>
            <span className="text-2xl font-display font-black text-indigo-600">{formatCurrency(subtotal)}</span>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-2">Payment Method</h3>
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/10' : 'border-white bg-white shadow-sm'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'cash' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Banknote size={20} />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-slate-800 text-sm">Cash on Pickup</span>
                <span className="text-[11px] text-slate-500 font-medium">Pay at the store counter</span>
              </div>
            </button>
            <button 
              onClick={() => setPaymentMethod('qr')}
              className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'qr' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/10' : 'border-white bg-white shadow-sm'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'qr' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <CreditCard size={20} />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-slate-800 text-sm">QR Payment</span>
                <span className="text-[11px] text-slate-500 font-medium">Scan QR code at pickup</span>
              </div>
            </button>
          </div>
        </section>

        <div className="bg-indigo-50 p-4 rounded-2xl flex gap-3 text-indigo-700 shadow-sm border border-indigo-100">
          <ShieldCheck size={20} className="flex-shrink-0" />
          <p className="text-[11px] font-semibold leading-relaxed">
            Your payment is secure. We use bank-grade encryption for all transactions. Choose "QR Payment" for a contactless experience.
          </p>
        </div>
      </main>

      <footer className="p-6 bg-white border-t border-slate-100 sticky bottom-0">
        <button 
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-slate-900 text-white h-16 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-200 active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Place Order'}
          {!loading && <ArrowLeft className="rotate-180" size={20} />}
        </button>
      </footer>
    </div>
  );
}
