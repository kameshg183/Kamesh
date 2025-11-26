import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Product, TagSize, FontTheme, AppConfiguration, TagSection, TagVisuals } from './types';
import InputForm from './components/InputForm';
import PriceTag from './components/PriceTag';
import ConfigPanel from './components/ConfigPanel';
import { Printer, Settings, LayoutGrid, Type, List, RefreshCw } from 'lucide-react';
import { FONT_THEMES, DEFAULT_CONFIG } from './constants';

// --- History Hook / Logic ---
interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'config'>('generator');
  const [products, setProducts] = useState<Product[]>([]);
  const [tagSize, setTagSize] = useState<TagSize>(TagSize.MEDIUM);
  const [fontTheme, setFontTheme] = useState<FontTheme>('classic');
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  // Initialize state from local storage or default
  const getInitialConfig = (): AppConfiguration => {
    try {
      const saved = localStorage.getItem('appConfig');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration check: If values look like pixels (> 50), convert roughly to cm or reset
        let loadedVisuals = { ...DEFAULT_CONFIG.visuals, ...(parsed.visuals || {}) };
        if (loadedVisuals.tagWidth > 50) loadedVisuals.tagWidth = DEFAULT_CONFIG.visuals.tagWidth;
        if (loadedVisuals.tagHeight > 50) loadedVisuals.tagHeight = DEFAULT_CONFIG.visuals.tagHeight;

        return {
          labels: { ...DEFAULT_CONFIG.labels, ...(parsed.labels || parsed) },
          visuals: loadedVisuals,
          paperOrientation: parsed.paperOrientation || 'portrait',
          pageOrientations: parsed.pageOrientations || {}
        };
      }
      return DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  };

  // History State
  const [history, setHistory] = useState<HistoryState<AppConfiguration>>({
    past: [],
    present: getInitialConfig(),
    future: []
  });

  // Derived current config
  const appConfig = history.present;

  // History Actions
  const setAppConfig = useCallback((newConfig: AppConfiguration | ((prev: AppConfiguration) => AppConfiguration)) => {
    setHistory(curr => {
      const nextPresent = typeof newConfig === 'function' ? newConfig(curr.present) : newConfig;
      
      // Simple deep equality check to prevent history cluttering
      if (JSON.stringify(curr.present) === JSON.stringify(nextPresent)) return curr;

      // Limit history stack size to 50
      const newPast = [...curr.past, curr.present].slice(-50);

      return {
        past: newPast,
        present: nextPresent,
        future: []
      };
    });
  }, []);

  const handleUndo = useCallback(() => {
    setHistory(curr => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future]
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistory(curr => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    if (activeTab !== 'config') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handleUndo, handleRedo]);


  const handleSaveConfig = useCallback(() => {
    localStorage.setItem('appConfig', JSON.stringify(appConfig));
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  }, [appConfig]);

  const handleResetConfig = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all configuration to default?')) {
      setAppConfig(DEFAULT_CONFIG);
    }
  }, [setAppConfig]);

  const handleSectionReorder = useCallback((newOrder: TagSection[]) => {
    setAppConfig(prev => ({
        ...prev,
        visuals: {
            ...prev.visuals,
            sectionOrder: newOrder
        }
    }));
  }, [setAppConfig]);

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

  const handlePageOrientationToggle = (pageIndex: number, current: 'portrait' | 'landscape') => {
    const newOrientation = current === 'landscape' ? 'portrait' : 'landscape';
    setAppConfig(prev => ({
        ...prev,
        pageOrientations: {
            ...prev.pageOrientations,
            [pageIndex]: newOrientation
        }
    }));
  };

  const handleProductVisualChange = (id: string, updates: Partial<TagVisuals>) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const currentVisuals = p.customVisuals || { ...appConfig.visuals };
      
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

  // --- Pagination Logic (Dynamic Flow with Per-Page Orientation & CM) ---
  const paginatedResult = useMemo(() => {
    if (products.length === 0) return { pages: [], orientations: [] };

    // A4 Dimensions in CM
    const A4_WIDTH_CM = 21.0;
    const A4_HEIGHT_CM = 29.7;
    const PADDING_TOP_CM = 1.0;
    const PADDING_LEFT_CM = 0.0; 
    const GAP_X_CM = 0.4;
    const GAP_Y_CM = 0.6;

    const defaultW = appConfig.visuals.tagWidth || 10;
    const defaultH = appConfig.visuals.tagHeight || 8;

    const resultPages: Product[][] = [];
    const resultOrientations: ('portrait' | 'landscape')[] = [];

    let globalIndex = 0;
    let pageIndex = 0;

    // Outer loop creates pages one by one
    while (globalIndex < products.length) {
        const orientation = appConfig.pageOrientations?.[pageIndex] || appConfig.paperOrientation || 'portrait';
        resultOrientations.push(orientation);
        
        const isLand = orientation === 'landscape';
        const PAGE_WIDTH = isLand ? A4_HEIGHT_CM : A4_WIDTH_CM;
        const PAGE_HEIGHT = isLand ? A4_WIDTH_CM : A4_HEIGHT_CM;

        const currentPageProducts: Product[] = [];
        let currentY = PADDING_TOP_CM;

        // Inner loop fills the current page
        while (globalIndex < products.length) {
            // Attempt to build a row
            let tempIndex = globalIndex;
            let rowWidth = PADDING_LEFT_CM;
            let rowHeight = 0;
            let rowCount = 0;

            // Build Row Loop: Add items horizontally until width limit
            while (tempIndex < products.length) {
                const p = products[tempIndex];
                // Fallback if data is corrupted or missing
                const w = p.customVisuals?.tagWidth || defaultW;
                const h = p.customVisuals?.tagHeight || defaultH;
                const gap = rowCount > 0 ? GAP_X_CM : 0;

                // Check if item fits in row
                if (rowWidth + w + gap <= PAGE_WIDTH) {
                    rowWidth += w + gap;
                    rowHeight = Math.max(rowHeight, h);
                    rowCount++;
                    tempIndex++;
                } else {
                    break;
                }
            }

            // Safety check: If a single item is wider than the page, force it in to prevent infinite loops
            if (rowCount === 0 && tempIndex < products.length) {
                 const p = products[tempIndex];
                 rowHeight = p.customVisuals?.tagHeight || defaultH;
                 rowCount = 1;
                 tempIndex++;
            }

            // Check if this row fits vertically in current page
            const gapY = currentPageProducts.length > 0 ? GAP_Y_CM : 0;
            if (currentPageProducts.length > 0 && currentY + rowHeight + gapY > PAGE_HEIGHT) {
                // Page is full vertically. Break inner loop to start new page.
                break;
            }

            // Add row items to the page content
            for (let i = globalIndex; i < tempIndex; i++) {
                currentPageProducts.push(products[i]);
            }
            
            // Advance cursor
            currentY += rowHeight + gapY;
            globalIndex = tempIndex;
        }

        resultPages.push(currentPageProducts);
        pageIndex++;
    }

    return { pages: resultPages, orientations: resultOrientations };
  }, [products, appConfig.visuals.tagWidth, appConfig.visuals.tagHeight, appConfig.paperOrientation, appConfig.pageOrientations]);


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
      {/* Dynamic Print Styles for Mixed Orientations */}
      <style>{`
        @media print {
            @page {
                size: auto;
                margin: 0;
            }
            @page p-portrait {
                size: A4 portrait;
            }
            @page p-landscape {
                size: A4 landscape;
            }
            .print-page-portrait {
                page: p-portrait;
            }
            .print-page-landscape {
                page: p-landscape;
            }
            .print-page {
                break-after: page;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
                width: auto !important;
            }
        }
      `}</style>

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
                       Print Preview ({products.length} Items - {paginatedResult.pages.length} Sheets)
                     </h2>
                     <div className="flex gap-2 items-center">
                        <span className="text-sm text-gray-500 bg-yellow-50 px-3 py-1 rounded border border-yellow-200">
                           Tip: Use the rulers on hover to adjust padding.
                        </span>
                     </div>
                   </div>
                  
                  {/* Pages Loop */}
                  {paginatedResult.pages.map((pageProducts, pageIndex) => {
                    const orientation = paginatedResult.orientations[pageIndex];
                    const isLandscape = orientation === 'landscape';
                    
                    return (
                      <div 
                          key={pageIndex}
                          className={`print-page print-page-${orientation} bg-white shadow-xl mb-8 mx-auto relative flex flex-wrap content-start justify-center gap-x-2 gap-y-2 pt-4 print:shadow-none print:m-0 print:mb-0 print:pt-4 print:break-after-page group/sheet`}
                          style={{ 
                              width: isLandscape ? '297mm' : '210mm', 
                              height: isLandscape ? '210mm' : '297mm',
                              minHeight: isLandscape ? '210mm' : '297mm',
                              transition: 'width 0.3s, height 0.3s'
                          }}
                      >
                          {/* Page Controls Overlay */}
                          <div className="absolute top-2 right-2 flex gap-2 no-print z-50">
                              <div className="bg-gray-100 text-gray-400 px-2 py-1 rounded text-xs font-mono">
                                  Sheet {pageIndex + 1}
                              </div>
                              <button
                                  onClick={() => handlePageOrientationToggle(pageIndex, orientation)}
                                  className="bg-white border border-gray-300 hover:bg-blue-50 text-gray-600 hover:text-blue-600 px-2 py-1 rounded shadow-sm text-xs flex items-center gap-1 transition-colors"
                                  title="Rotate this specific sheet"
                              >
                                  <RefreshCw size={12} />
                                  {isLandscape ? 'Landscape' : 'Portrait'}
                              </button>
                          </div>

                          {pageProducts.map((product) => (
                            <div 
                                key={product.id} 
                                className="relative group print:inline-block print:m-0 box-border cursor-grab active:cursor-grabbing"
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
                                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity no-print z-10 w-6 h-6 flex items-center justify-center text-sm"
                                      title="Remove Tag"
                                    >
                                      &times;
                                    </button>
                                </div>
                            </div>
                          ))}
                      </div>
                    );
                  })}
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
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={history.past.length > 0}
              canRedo={history.future.length > 0}
            />
            
            <div className="mt-8 max-w-3xl mx-auto">
               <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Live Interactive Preview</h3>
               <p className="text-sm text-gray-500 text-center mb-6">Drag and drop sections on the card below to reorder them.</p>
               <div className="flex justify-center bg-gray-200 p-8 rounded-xl">
                 <div className="w-auto">
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
    </div>
  );
};

export default App;