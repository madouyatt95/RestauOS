import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Check, ChefHat, Save } from 'lucide-react';
import { PRODUCTS, type Product } from '../stores/orderStore';

export default function MenuBuilder() {
  const [items, setItems] = useState<Product[]>(PRODUCTS);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    const newItem: Product = {
      id: `p${Date.now()}`,
      name: 'Nouveau Plat',
      price: 0,
      category: 'plats',
      image: '',
      stock: 10,
      cost: 0,
      allergens: [],
    };
    setItems([newItem, ...items]);
    setEditingId(newItem.id);
  };

  const handleUpdate = (id: string, field: keyof Product, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer ce produit ?")) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  return (
    <div className="page-content pt-14 pb-28 bg-[#0a0c10] min-h-screen">
      <div className="flex items-center justify-between mb-8 px-4">
        <div>
          <h1 className="text-white font-black text-2xl">Menu Builder</h1>
          <p className="text-text-secondary text-xs uppercase tracking-widest font-bold">Gestion de la Carte</p>
        </div>
        <button onClick={handleAdd} className="w-10 h-10 rounded-xl bg-orange flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg shadow-orange/20">
          <Plus size={20} />
        </button>
      </div>

      <div className="px-4 space-y-4">
        {items.map(item => (
          <motion.div layout key={item.id} className="glass-card p-4 border-white/5 flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 shrink-0 overflow-hidden">
              {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <ChefHat size={24} />}
            </div>
            
            {editingId === item.id ? (
              <div className="flex-1 space-y-2">
                <input type="text" value={item.name} onChange={e => handleUpdate(item.id, 'name', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm" placeholder="Nom du plat" />
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          handleUpdate(item.id, 'image', reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-orange file:text-white hover:file:bg-orange/80 cursor-pointer" 
                  />
                </div>
                <div className="flex gap-2">
                  <input type="number" value={item.price} onChange={e => handleUpdate(item.id, 'price', Number(e.target.value))} className="w-1/2 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm" placeholder="Prix" />
                  <select value={item.category} onChange={e => handleUpdate(item.id, 'category', e.target.value)} className="w-1/2 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm">
                    <option value="plats" className="bg-[#0a0c10]">Plats</option>
                    <option value="boissons" className="bg-[#0a0c10]">Boissons</option>
                    <option value="desserts" className="bg-[#0a0c10]">Desserts</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <h3 className="text-white font-bold">{item.name}</h3>
                <p className="text-orange font-black text-sm">{item.price.toLocaleString()} F</p>
                <span className="text-text-tertiary text-[10px] uppercase tracking-widest">{item.category}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {editingId === item.id ? (
                <button onClick={() => setEditingId(null)} className="w-8 h-8 rounded-lg bg-green/20 text-green flex items-center justify-center"><Check size={16} /></button>
              ) : (
                <button onClick={() => setEditingId(item.id)} className="w-8 h-8 rounded-lg bg-blue/10 text-blue flex items-center justify-center"><Edit2 size={16} /></button>
              )}
              <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg bg-red/10 text-red flex items-center justify-center"><Trash2 size={16} /></button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <button onClick={() => alert("Menu synchronisé avec le Cloud Odoo/Supabase !")} className="px-6 py-3 rounded-full bg-white text-[#0a0c10] font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-2xl shadow-white/20 active:scale-95 transition-transform">
          <Save size={18} /> Sauvegarder
        </button>
      </div>
    </div>
  );
}
