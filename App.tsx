import React, { useState, useCallback, useMemo } from 'react';
import { Product, TagSize, FontTheme, AppConfiguration, TagSection, TagVisuals } from './types';
import InputForm from './components/InputForm';
import PriceTag from './components/PriceTag';
import ConfigPanel from './components/ConfigPanel';
import { Printer, Settings, LayoutGrid, Type, List } from 'lucide-react';
import { FONT_THEMES, DEFAULT_CONFIG } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'config'>('generator');
  const [products, setProducts] = useState<Product[]>([]);
  const [tagSize, setTagSize] = useState<TagSize>(TagSize.MEDIUM);
  const [fontTheme, setFontTheme] = useState<FontTheme>('classic');
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  // State for full app config (labels + visuals)
  const [appConfig, setAppConfig] = useState<AppConfiguration>(() => {
    try {
      const saved = localStorage.getItem('appConfig');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults
        return {
          labels: { ...DEFAULT_CONFIG.labels, ...(parsed.labels || parsed) },
          visuals: { ...DEFAULT_CONFIG.visuals, ...(parsed.visuals || {}) }
        };
      }
      return DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });

  const handleSaveConfig = useCallback(() => {
    localStorage.setItem('appConfig', JSON.stringify(appConfig));
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  }, [appConfig]);

  const handleResetConfig = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all configuration to default?')) {
      setAppConfig(DEFAULT_CONFIG);
      handleSaveConfig();
    }
  }, [handleSaveConfig]);

  const handleSectionReorder = useCallback((newOrder: TagSection[]) => {
    setAppConfig(prev => ({
        ...prev,
        visuals: {
            ...prev.visuals,
            sectionOrder: newOrder
        }
    }));
  }, []);

  const handleAddProduct = useCallback((product: Product) => {
    setProducts((prev) => [...prev, product]);
  }, []);

  const handleBulkAdd = useCallback((newProducts: Product[]) => {
    setProducts((prev) => [...prev, ...newProducts]);
  }, []);

  const handleClear = useCallback(() => {
    setProducts([]);
  }, []);

  const handleRemoveProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleProductVisualChange = (id: string, updates: Partial<TagVisuals>) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const currentVisuals = p.customVisuals || { ...appConfig.visuals };
      
      // If updates contain textScales, merge them deeply
      let newVisuals = { ...currentVisuals, ...updates };
      if (updates.textScales && currentVisuals.textScales) {
        newVisuals.textScales = { ...currentVisuals.textScales, ...updates.textScales };
      }

      return {
        ...p,
        customVisuals: newVisuals
      };
    }));
  };

  // --- Pagination Logic for A4 ---
  const paginatedProducts = useMemo(() => {
    const pages: Product[][] = [];
    if (products.length === 0) return pages;

    const currentTagHeight = appConfig.visuals.tagHeight || 360;
    const currentTagWidth = appConfig.visuals.tagWidth || 380;
    
    // A4 dimensions in px (approx 96 DPI)
    // Width 210mm ~ 794px
    // Height 297mm ~ 1123px
    // Margins ~ 40px top/bottom total
    const PAGE_HEIGHT = 1123;
    const VERTICAL_MARGINS = 40; 
    const AVAILABLE_HEIGHT = PAGE_HEIGHT - VERTICAL_MARGINS;
    
    // How many rows fit?
    // We add a small buffer for tag margins
    const tagTotalHeight = currentTagHeight + 8; // 8px visual margin
    const rowsPerPage = Math.max(1, Math.floor(AVAILABLE_HEIGHT / tagTotalHeight));
    
    // Always 2 columns for now as per design requirement
    const itemsPerPage = rowsPerPage * 2; 

    for (let i = 0; i < products.length; i += itemsPerPage) {
      pages.push(products.slice(i, i + itemsPerPage));
    }
    return pages;
  }, [products, appConfig.visuals.tagHeight, appConfig.visuals.tagWidth]);


  // --- Drag and Drop for Products ---
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);

  const onProductDragStart = (e: React.DragEvent, id: string) => {
    setDraggedProductId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    (e.currentTarget as HTMLElement).classList.add('opacity-40');
  };

  const onProductDragEnd = (e: React.DragEvent) => {
    setDraggedProductId(null);
    (e.currentTarget as HTMLElement).classList.remove('opacity-40');
  };

  const onProductDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onProductDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedProductId;
    if (!sourceId || sourceId === targetId) return;

    setProducts(prev => {
        const indexSource = prev.findIndex(p => p.id === sourceId);
        const indexTarget = prev.findIndex(p => p.id === targetId);
        if (indexSource === -1 || indexTarget === -1) return prev;
        const newProducts = [...prev];
        const [movedProduct] = newProducts.splice(indexSource, 1);
        newProducts.splice(indexTarget, 0, movedProduct);
        return newProducts;
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white shadow-md no-print sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
            <div className="flex items-center justify-between w-full xl:w-auto">
              <div className="flex items-center gap-3">
                <div className="bg-white text-gray-900 p-2 rounded-lg">
                  <LayoutGrid size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">SmartTag Print</h1>
                  <p className="text-xs text-gray-400">Retail Price Tag Generator</p>
                </div>
              </div>
            </div>
            
            <nav className="flex bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('generator')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'generator' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <List size={16} className="mr-2" />
                Generator
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'config' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Settings size={16} className="mr-2" />
                Configuration
              </button>
            </nav>

            {activeTab === 'generator' && (
              <div className="flex flex-wrap justify-center items-center gap-4 w-full xl:w-auto">
                 <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1.5 border border-gray-700">
                    <Type size={16} className="ml-2 text-gray-400" />
                    <div className="flex gap-1">
                      {(Object.keys(FONT_THEMES) as FontTheme[]).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setFontTheme(theme)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                            fontTheme === theme 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          {FONT_THEMES[theme].label}
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="flex bg-gray-800 rounded-lg p-1.5 border border-gray-700">
                    <button 
                      onClick={() => setTagSize(TagSize.SMALL)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-all ${tagSize === TagSize.SMALL ? 'bg-white text-gray-900 shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                      Compact
                    </button>
                    <button 
                      onClick={() => setTagSize(TagSize.MEDIUM)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-all ${tagSize === TagSize.MEDIUM ? 'bg-white text-gray-900 shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                      Standard
                    </button>
                    <button 
                      onClick={() => setTagSize(TagSize.LARGE)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-all ${tagSize === TagSize.LARGE ? 'bg-white text-gray-900 shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                      Large
                    </button>
                 </div>

                <button
                  onClick={handlePrint}
                  disabled={products.length === 0}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                >
                  <Printer size={20} />
                  Print
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8 print:p-0 print:space-y-0 print:w-full print:max-w-none">
        
        {activeTab === 'generator' && (
          <>
            <section className="no-print">
              <InputForm
                onAddProduct={handleAddProduct}
                onBulkAdd={handleBulkAdd}
                onClear={handleClear}
              />
            </section>

            <section className="print:w-full">
              {products.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 no-print">
                   <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                   <h3 className="text-lg font-medium text-gray-600">No products added yet</h3>
                   <p className="text-gray-400">Add items manually or upload a CSV file to get started.</p>
                 </div>
              ) : (
                <div className="overflow-auto print:overflow-visible">
                   <div className="flex justify-between items-center mb-4 no-print">
                     <h2 className="text-xl font-bold text-gray-800">
                       Print Preview ({products.length} Items - {paginatedProducts.length} Pages)
                     </h2>
                     <span className="text-sm text-gray-500 bg-yellow-50 px-3 py-1 rounded border border-yellow-200">
                       Tip: Drag tags to reorder. Drag edges to resize. Click text to change size.
                     </span>
                   </div>
                  
                  {/* Pages Loop */}
                  {paginatedProducts.map((pageProducts, pageIndex) => (
                    <div 
                        key={pageIndex}
                        className="print-page bg-white shadow-xl mb-8 mx-auto relative flex flex-wrap content-start justify-center gap-x-4 pt-8 print:shadow-none print:m-0 print:mb-0 print:pt-4 print:break-after-page"
                        style={{ width: '210mm', height: '297mm', minHeight: '297mm' }}
                    >
                        {/* Page Number Indicator (Screen only) */}
                        <div className="absolute top-2 right-2 text-xs text-gray-300 no-print">Page {pageIndex + 1}</div>

                        {pageProducts.map((product) => (
                          <div 
                              key={product.id} 
                              className="relative group print:inline-block print:m-0 mb-1 box-border cursor-grab active:cursor-grabbing"
                              draggable={true}
                              onDragStart={(e) => onProductDragStart(e, product.id)}
                              onDragEnd={onProductDragEnd}
                              onDragOver={onProductDragOver}
                              onDrop={(e) => onProductDrop(e, product.id)}
                          >
                              <div className="p-0">
                                  <PriceTag 
                                    product={product} 
                                    size={tagSize} 
                                    fontTheme={fontTheme} 
                                    config={appConfig}
                                    onVisualChange={(updates) => handleProductVisualChange(product.id, updates)}
                                  />
                                  <button
                                    onClick={() => handleRemoveProduct(product.id)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity no-print z-10"
                                    title="Remove Tag"
                                  >
                                    &times;
                                  </button>
                              </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'config' && (
          <div className="no-print">
            <ConfigPanel 
              config={appConfig} 
              onUpdate={setAppConfig}
              onSave={handleSaveConfig}
              onReset={handleResetConfig}
            />
            
            <div className="mt-8 max-w-3xl mx-auto">
               <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Live Interactive Preview</h3>
               <p className="text-sm text-gray-500 text-center mb-6">Drag and drop sections on the card below to reorder them.</p>
               <div className="flex justify-center bg-gray-200 p-8 rounded-xl">
                 <div className="w-[300px]">
                    <PriceTag 
                      product={{
                        id: 'preview',
                        name: 'Example Product',
                        quantity: '1 Kg',
                        mrp: 100,
                        price: 60
                      }}
                      size={TagSize.MEDIUM}
                      fontTheme={fontTheme}
                      config={appConfig}
                      enableDnD={true}
                      onOrderChange={handleSectionReorder}
                      onVisualChange={(updates) => setAppConfig(prev => ({ ...prev, visuals: { ...prev.visuals, ...updates } }))}
                    />
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto p-6 text-center text-gray-400 text-sm no-print">
        <p>&copy; {new Date().getFullYear()} Smart Retail Solutions. Optimized for Chrome Desktop Printing.</p>
      </footer>

      {showSaveToast && (
        <div className="fixed bottom-8 right-8 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce z-50 flex items-center">
          <div className="mr-2 bg-green-500 rounded-full p-1">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          Configuration Saved!
        </div>
      )}
      
      {/* Global styles for print pagination */}
      <style>{`
        @media print {
            .print-page {
                break-after: page;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
            }
        }
      `}</style>
    </div>
  );
};

export default App;