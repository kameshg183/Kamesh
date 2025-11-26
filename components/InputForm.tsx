import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { Plus, Upload, Trash2, Download, Box, Tag, RotateCcw } from 'lucide-react';
import { SAMPLE_DATA } from '../constants';

interface InputFormProps {
  onAddProduct: (p: Product) => void;
  onBulkAdd: (products: Product[]) => void;
  onClear: () => void;
  hasItems: boolean;
}

const generateId = () => {
    // Simple fallback if crypto is not available
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const InputForm: React.FC<InputFormProps> = ({ onAddProduct, onBulkAdd, onClear, hasItems }) => {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [mrp, setMrp] = useState('');
  const [price, setPrice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mrp || !price) return;

    onAddProduct({
      id: generateId(),
      name,
      quantity: qty || '1 Unit',
      mrp: Number(mrp),
      price: Number(price),
    });

    handleResetForm();
  };

  const handleResetForm = () => {
    setName('');
    setQty('');
    setMrp('');
    setPrice('');
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const products: Product[] = [];
    
    // Simple parser assuming headers or standard order: Name, Qty, MRP, Price
    // Skipping header if first row contains "Price" or "MRP"
    const startIndex = lines[0].toLowerCase().includes('mrp') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle commas inside quotes basic impl
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      
      if (parts.length >= 4) {
        products.push({
          id: generateId(),
          name: parts[0].replace(/^"|"$/g, '').trim(),
          quantity: parts[1].replace(/^"|"$/g, '').trim(),
          mrp: parseFloat(parts[2].replace(/[^\d.]/g, '')),
          price: parseFloat(parts[3].replace(/[^\d.]/g, '')),
        });
      }
    }
    return products;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const products = parseCSV(text);
      onBulkAdd(products);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadSample = () => {
    const products = parseCSV(SAMPLE_DATA);
    onBulkAdd(products);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
      <div>
        <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                <Tag className="w-4 h-4" />
            </div>
            Add Item Manually
            </h2>
            {(name || mrp || price) && (
                <button 
                    type="button" 
                    onClick={handleResetForm}
                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                >
                    <RotateCcw size={12} /> Reset Form
                </button>
            )}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Product Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              placeholder="e.g. Maaza Mango"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Qty / Size</label>
            <input
              type="text"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              placeholder="e.g. 1.75 Ltr"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">MRP</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-serif">₹</span>
              <input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="0"
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-indigo-600">Offer Price</label>
            <div className="flex gap-3">
               <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-serif">₹</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    placeholder="0"
                  />
               </div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex-shrink-0"
                title="Add Item"
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="border-t border-slate-100 pt-8">
        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
             <Box className="w-4 h-4" />
          </div>
          Bulk Operations
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-600 group"
          >
            <Upload className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
            Upload CSV
          </button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            onClick={(e) => (e.currentTarget.value = '')} 
          />

          <button
            type="button"
            onClick={loadSample}
            className="flex items-center px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-600 group"
          >
            <Download className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
            Load Sample Data
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={!hasItems}
            className={`flex items-center px-5 py-2.5 rounded-xl border shadow-sm transition-all ml-auto ${
                hasItems 
                ? 'bg-white hover:bg-red-50 text-red-600 border-red-100 hover:border-red-300 cursor-pointer' 
                : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </button>
        </div>
        <p className="mt-4 text-xs text-slate-400 bg-slate-50 inline-block px-3 py-1 rounded-md">
          CSV Format: <code className="text-slate-600 font-mono">Product Name, Quantity, MRP, Offer Price</code>
        </p>
      </div>
    </div>
  );
};

export default InputForm;