import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Search, Image as ImageIcon, Camera, Upload } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

export default function AdminProducts({ storeId }: { storeId: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    categoryId: '',
    imageUrl: '',
    unit: 'Nos',
    stock: '100',
    isAvailable: true
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        setUploading(false);
        toast.success('Image captured!');
      };
    };
    reader.readAsDataURL(file);
  };

  const fetchProducts = async () => {
    try {
      const data = await api.getProducts(storeId);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [storeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.updateProduct(editingId, {
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock),
        });
        toast.success('Product updated!');
      } else {
        await api.addProduct({
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock),
          storeId
        });
        toast.success('Product added!');
      }
      setShowAddForm(false);
      setEditingId(null);
      setFormData({ name: '', price: '', description: '', categoryId: '', imageUrl: '', unit: 'Nos', stock: '100', isAvailable: true });
      fetchProducts();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const startEdit = (prod: any) => {
    setEditingId(prod.id);
    setFormData({
      name: prod.name,
      price: prod.price.toString(),
      description: prod.description || '',
      categoryId: prod.categoryId || '',
      imageUrl: prod.imageUrl || '',
      unit: prod.unit || 'Nos',
      stock: prod.stock?.toString() || '0',
      isAvailable: prod.isAvailable ?? true
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleAvailability = async (id: string, current: boolean) => {
    try {
      await api.updateProduct(id, { isAvailable: !current });
      fetchProducts();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.deleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Deletion failed');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-black tracking-tight text-slate-800">Catalog</h2>
          <p className="text-slate-500 text-sm font-medium">{products.length} products total</p>
        </div>
        <button 
          onClick={() => {
            if (showAddForm) {
              setEditingId(null);
              setFormData({ name: '', price: '', description: '', categoryId: '', imageUrl: '', unit: 'Nos', stock: '100', isAvailable: true });
            }
            setShowAddForm(!showAddForm);
          }}
          className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 active:scale-90 transition-transform"
        >
          {showAddForm ? <Trash2 size={20} className="rotate-45" /> : <Plus size={24} />}
        </button>
      </header>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border-2 border-indigo-500/20 space-y-4 animate-in slide-in-from-top-4 duration-300 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Edit Product' : 'New Product'}</h3>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Product Name" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full h-12 bg-slate-50 border border-transparent rounded-xl px-4 font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
            />
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="number" 
                placeholder="Price (₹)" 
                required
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full h-12 bg-slate-50 border border-transparent rounded-xl px-4 font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
              />
              <select 
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                className="w-full h-12 bg-slate-50 border border-transparent rounded-xl px-4 font-bold text-sm text-slate-600 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
              >
                <option value="Nos">Nos</option>
                <option value="Pieces">Pieces</option>
                <option value="Boxes">Boxes</option>
                <option value="Pack">Pack</option>
                <option value="Kg">Kg</option>
                <option value="Litre">Litre</option>
              </select>
            </div>
            <div className="grid grid-cols-1">
              <input 
                type="number" 
                placeholder="Available Stock" 
                required
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: e.target.value})}
                className="w-full h-12 bg-slate-50 border border-transparent rounded-xl px-4 font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                <ImageIcon size={14} /> Product Image
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col items-center justify-center h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition-all group">
                  <Camera size={24} className="text-slate-400 group-hover:text-indigo-600 mb-1" />
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 uppercase">Take Photo</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                </label>
                
                <label className="flex flex-col items-center justify-center h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition-all group">
                  <Upload size={24} className="text-slate-400 group-hover:text-indigo-600 mb-1" />
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 uppercase">Choose File</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              {formData.imageUrl && (
                <div className="relative w-full h-40 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 group">
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                    className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 backdrop-blur-sm">
                    <p className="text-[10px] text-white font-medium truncate">{formData.imageUrl.startsWith('data:') ? 'Captured Image' : formData.imageUrl}</p>
                  </div>
                </div>
              )}

              {!formData.imageUrl && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    Or Paste Image URL
                  </div>
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/..." 
                    value={formData.imageUrl}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full h-12 bg-slate-50 border border-transparent rounded-xl px-4 font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                  />
                </div>
              )}

              {uploading && (
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 animate-pulse">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                  Processing image...
                </div>
              )}
            </div>
            <textarea 
              placeholder="Description (Optional)"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full h-24 bg-slate-50 border border-transparent rounded-xl p-4 font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
            />
            <div className="flex gap-3">
              {editingId && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setShowAddForm(false);
                    setFormData({ name: '', price: '', description: '', categoryId: '', imageUrl: '', unit: 'Nos', stock: '100', isAvailable: true });
                  }}
                  className="flex-1 bg-slate-100 text-slate-600 h-12 rounded-xl font-bold active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              )}
              <button className="flex-[2] bg-slate-900 text-white h-12 rounded-xl font-bold active:scale-95 transition-transform shadow-lg shadow-slate-100">
                {editingId ? 'Update Product' : 'Add to Catalog'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {products.map(prod => (
          <div key={prod.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-4 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-colors">
            <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest ${prod.isAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              {prod.isAvailable ? 'In Stock' : 'Out of Stock'}
            </div>
            <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 border border-slate-50 overflow-hidden shrink-0">
              {prod.imageUrl ? (
                <img src={prod.imageUrl} className="w-full h-full object-cover" alt="" />
              ) : <ImageIcon size={24} />}
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <h4 className="font-bold text-slate-900 leading-tight pr-12">{prod.name}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-indigo-600 font-black">{formatCurrency(prod.price)}</p>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">per {prod.unit || 'Nos'}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-1">Stock: {prod.stock} {prod.unit || 'Nos'}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => startEdit(prod)}
                  className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                >
                  <Edit2 size={10} /> Edit
                </button>
                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                <button 
                  onClick={() => handleToggleAvailability(prod.id, prod.isAvailable)}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {prod.isAvailable ? 'Deactivate' : 'Activate'}
                </button>
                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                <button 
                  onClick={() => handleDelete(prod.id)}
                  className="text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:text-rose-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && !showAddForm && (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300 shadow-inner">
              <Plus size={32} />
            </div>
            <p className="text-slate-400 font-medium">Add your first product to start selling.</p>
          </div>
        )}
      </div>
    </div>
  );
}
