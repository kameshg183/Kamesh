import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { Plus, Upload, Trash2, FileText, Download } from 'lucide-react';
import { SAMPLE_DATA } from '../constants';

interface InputFormProps {
  onAddProduct: (p: Product) => void;
  onBulkAdd: (products: Product[]) => void;
  onClear: () => void;
}

const InputForm: React.FC<InputFormProps> = ({ onAddProduct, onBulkAdd, onClear }) => {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [mrp, setMrp] = useState('');
  const [price, setPrice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mrp || !price) return;

    onAddProduct({
      id: crypto.randomUUID(),
      name,
      quantity: qty || '1 Unit',
      mrp: Number(mrp),
      price: Number(price),
    });

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
          id: crypto.randomUUID(),
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Add Single Item
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Product Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Maaza Mango"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Qty / Size</label>
            <input
              type="text"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. 1.75 Ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">MRP</label>
            <input
              type="number"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Offer Price</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors"
                title="Add Item"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Bulk Operations
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            onClick={loadSample}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Load Sample Data
          </button>

          <button
            onClick={onClear}
            className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          CSV Format: <code>Product Name, Quantity, MRP, Offer Price</code>
        </p>
      </div>
    </div>
  );
};

export default InputForm;