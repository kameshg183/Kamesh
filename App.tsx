import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Product, TagSize, FontTheme, AppConfiguration, TagSection, TagVisuals, SheetSettings } from './types';
import InputForm from './components/InputForm';
import PriceTag from './components/PriceTag';
import ConfigPanel from './components/ConfigPanel';
import Ruler from './components/Ruler';
import { Printer, Settings, LayoutGrid, Type, List, RefreshCw, Undo, Redo, Sparkles, PackageOpen } from 'lucide-react';
import { FONT_THEMES, DEFAULT_CONFIG } from './constants';

// --- History & State Logic ---

interface GlobalState {
  products: Product[];
  config: AppConfiguration;
}

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'config'>('generator');
  const [tagSize, setTagSize] = useState<TagSize>(TagSize.MEDIUM);
  const [fontTheme, setFontTheme] = useState<FontTheme>('classic');
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  // Initialize state from local storage (config) + default empty products
  const getInitialState = (): GlobalState => {
    let initialConfig = DEFAULT_CONFIG;
    try {
      const saved = localStorage.getItem('appConfig');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration check: If values look like pixels (> 50), convert roughly to cm or reset
        let loadedVisuals = { ...DEFAULT_CONFIG.visuals, ...(parsed.visuals || {}) };
        if (loadedVisuals.tagWidth > 50) loadedVisuals.tagWidth = DEFAULT_CONFIG.visuals.tagWidth;
        if (loadedVisuals.tagHeight > 50) loadedVisuals.tagHeight = DEFAULT_CONFIG.visuals.tagHeight;

        // Sanitize sectionOrder to prevent rendering crashes with old data
        if (loadedVisuals.sectionOrder) {
           const validSections = ['savings', 'product', 'footer'];
           const isValid = Array.isArray(loadedVisuals.sectionOrder) && 
                           loadedVisuals.sectionOrder.every((s: string) => validSections.includes(s));
           if (!isValid) loadedVisuals.sectionOrder = DEFAULT_CONFIG.visuals.sectionOrder;
        }

        initialConfig = {
          labels: { ...DEFAULT_CONFIG.labels, ...(parsed.labels || parsed) },
          visuals: loadedVisuals,
          sheetSettings: { ...DEFAULT_CONFIG.sheetSettings, ...(parsed.sheetSettings || {}) },
          paperOrientation: parsed.paperOrientation || 'portrait',
          pageOrientations: parsed.pageOrientations || {}
        };
      }
    } catch (e) {
      console.error("Failed to load config", e);
    }

    return {
      products: [],
      config: initialConfig
    };
  };

  // Centralized History State
  const [history, setHistory] = useState<HistoryState<GlobalState>>({
    past: [],
    present: getInitialState(),
    future: []
  });

  const { products, config } = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // --- History Actions ---

  const updateState = useCallback((updater: (curr: GlobalState) => GlobalState) => {
    setHistory(curr => {
      const nextPresent = updater(curr.present);
      
      // Simple equality check to prevent history cluttering
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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Support Ctrl+Z / Cmd+Z and Ctrl+Y / Cmd+Shift+Z
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);


  // --- Event Handlers (Using updateState) ---

  const handleSaveConfig = useCallback(() => {
    localStorage.setItem('appConfig', JSON.stringify(config));
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  }, [config]);

  const handleResetConfig = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all configuration to default?')) {
      updateState(prev => ({ ...prev, config: DEFAULT_CONFIG }));
    }
  }, [updateState]);

  // Adapter for ConfigPanel which expects (config) => void
  const handleConfigUpdate = useCallback((newConfig: AppConfiguration) => {
      updateState(prev => ({ ...prev, config: newConfig }));
  }, [updateState]);

  const handleSectionReorder = useCallback((newOrder: TagSection[]) => {
    updateState(prev => ({
        ...prev,
        config: {
            ...prev.config,
            visuals: {
                ...prev.config.visuals,
                sectionOrder: newOrder
            }
        }
    }));
  }, [updateState]);

  const handleAddProduct = useCallback((product: Product) => {
    updateState(prev => ({
        ...prev,
        products: [...prev.products, product]
    }));
  }, [updateState]);

  const handleBulkAdd = useCallback((newProducts: Product[]) => {
    updateState(prev => ({
        ...prev,
        products: [...prev.products, ...newProducts]
    }));
  }, [updateState]);

  const handleClear = useCallback(() => {
     // Direct state update without confirmation dialog to ensure immediate action
     updateState(prev => {
        if (prev.products.length === 0) return prev;
        return { ...prev, products: [] };
     });
  }, [updateState]);

  const handleRemoveProduct = useCallback((id: string) => {
    updateState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id)
    }));
  }, [updateState]);

  const handlePrint = () => {
    window.print();
  };

  const handlePageOrientationToggle = (pageIndex: number, current: 'portrait' | 'landscape') => {
    const newOrientation = current === 'landscape' ? 'portrait' : 'landscape';
    updateState(prev => ({
        ...prev,
        config: {
            ...prev.config,
            pageOrientations: {
                ...prev.config.pageOrientations,
                [pageIndex]: newOrientation
            }
        }
    }));
  };

  const handleSheetPaddingChange = (axis: 'x' | 'y', val: number) => {
      updateState(prev => ({
          ...prev,
          config: {
              ...prev.config,
              sheetSettings: {
                  ...prev.config.sheetSettings,
                  [axis === 'x' ? 'paddingX' : 'paddingY']: val
              }
          }
      }));
  };

  const handleProductVisualChange = (id: string, updates: Partial<TagVisuals>) => {
    updateState(prev => ({
        ...prev,
        products: prev.products.map(p => {
            if (p.id !== id) return p;
            const currentVisuals = p.customVisuals || { ...prev.config.visuals };
            
            let newVisuals = { ...currentVisuals, ...updates };
            if (updates.textScales && currentVisuals.textScales) {
                newVisuals.textScales = { ...currentVisuals.textScales, ...updates.textScales };
            }

            return {
                ...p,
                customVisuals: newVisuals
            };
        })
    }));
  };


  // --- Pagination Logic ---
  const paginatedResult = useMemo(() => {
    if (products.length === 0) return { pages: [], orientations: [] };

    // A4 Dimensions in CM
    const A4_WIDTH_CM = 21.0;
    const A4_HEIGHT_CM = 29.7;
    
    const PADDING_Y_CM = config.sheetSettings?.paddingY ?? DEFAULT_CONFIG.sheetSettings.paddingY;
    const PADDING_X_CM = config.sheetSettings?.paddingX ?? DEFAULT_CONFIG.sheetSettings.paddingX;
    const GAP_X_CM = config.sheetSettings?.gapX ?? DEFAULT_CONFIG.sheetSettings.gapX;
    const GAP_Y_CM = config.sheetSettings?.gapY ?? DEFAULT_CONFIG.sheetSettings.gapY;

    const defaultW = config.visuals.tagWidth || 10;
    const defaultH = config.visuals.tagHeight || 8;

    const resultPages: Product[][] = [];
    const resultOrientations: ('portrait' | 'landscape')[] = [];

    let globalIndex = 0;
    let pageIndex = 0;

    // Safety limit to prevent infinite loops if calculation goes wrong
    const MAX_PAGES = 100; 

    while (globalIndex < products.length && pageIndex < MAX_PAGES) {
        const orientation = config.pageOrientations?.[pageIndex] || config.paperOrientation || 'portrait';
        resultOrientations.push(orientation);
        
        const isLand = orientation === 'landscape';
        const PAGE_WIDTH = isLand ? A4_HEIGHT_CM : A4_WIDTH_CM;
        const PAGE_HEIGHT = isLand ? A4_WIDTH_CM : A4_HEIGHT_CM;

        // Ensure available dimensions are positive to prevent loops
        const AVAILABLE_WIDTH = Math.max(1, PAGE_WIDTH - (PADDING_X_CM * 2));
        const AVAILABLE_HEIGHT = Math.max(1, PAGE_HEIGHT - (PADDING_Y_CM * 2));

        const currentPageProducts: Product[] = [];
        let currentY = 0;

        while (globalIndex < products.length) {
            let tempIndex = globalIndex;
            let rowWidth = 0;
            let rowHeight = 0;
            let rowCount = 0;

            // Build Row
            while (tempIndex < products.length) {
                const p = products[tempIndex];
                const w = p.customVisuals?.tagWidth || defaultW;
                const h = p.customVisuals?.tagHeight || defaultH;
                const gap = rowCount > 0 ? GAP_X_CM : 0;

                if (rowWidth + w + gap <= AVAILABLE_WIDTH) {
                    rowWidth += w + gap;
                    rowHeight = Math.max(rowHeight, h);
                    rowCount++;
                    tempIndex++;
                } else {
                    break;
                }
            }

            // Force at least one item if it's too big for the page width
            if (rowCount === 0 && tempIndex < products.length) {
                 const p = products[tempIndex];
                 rowHeight = p.customVisuals?.tagHeight || defaultH;
                 rowCount = 1;
                 tempIndex++;
            }

            // Check if Row fits vertically
            const gapY = currentPageProducts.length > 0 ? GAP_Y_CM : 0;
            if (currentPageProducts.length > 0 && currentY + rowHeight + gapY > AVAILABLE_HEIGHT) {
                break; // Break 'Build Page' loop, start new page
            }

            // Add row to page
            for (let i = globalIndex; i < tempIndex; i++) {
                currentPageProducts.push(products[i]);
            }
            
            currentY += rowHeight + gapY;
            globalIndex = tempIndex;
        }

        resultPages.push(currentPageProducts);
        pageIndex++;
    }

    return { pages: resultPages, orientations: resultOrientations };
  }, [products, config]);


  // --- Drag and Drop Logic ---
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

    updateState(prev => {
        const list = [...prev.products];
        const indexSource = list.findIndex(p => p.id === sourceId);
        const indexTarget = list.findIndex(p => p.id === targetId);
        if (indexSource === -1 || indexTarget === -1) return prev;
        
        const [movedProduct] = list.splice(indexSource, 1);
        list.splice(indexTarget, 0, movedProduct);
        
        return { ...prev, products: list };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <style>{`
        @media print {
            @page { size: auto; margin: 0; }
            @page p-portrait { size: A4 portrait; }
            @page p-landscape { size: A4 landscape; }
            .print-page-portrait { page: p-portrait; }
            .print-page-landscape { page: p-landscape; }
            .print-page {
                break-after: page; margin: 0 !important;
                box-shadow: none !important; border: none !important;
                height: auto !important; min-height: 0 !important;
                overflow: visible !important; width: auto !important;
            }
        }
      `}</style>

      {/* Modern Header */}
      <header className="bg-slate-900 text-white shadow-md no-print sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-3">
          <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
            
            {/* Logo */}
            <div className="flex items-center gap-3 w-full xl:w-auto">
              <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-900/50">
                <LayoutGrid size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white leading-tight">SmartTag Print</h1>
                <p className="text-xs text-slate-400 font-medium">Retail Price Tag Generator</p>
              </div>
            </div>
            
            {/* Center Controls */}
            <div className="flex items-center gap-4 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-md">
                {/* Navigation Pills */}
                <nav className="flex bg-slate-900/80 p-1 rounded-xl">
                  <button
                      onClick={() => setActiveTab('generator')}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      activeTab === 'generator' 
                        ? 'bg-slate-700 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                  >
                      <List size={16} className="mr-2" />
                      Generator
                  </button>
                  <button
                      onClick={() => setActiveTab('config')}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      activeTab === 'config' 
                        ? 'bg-slate-700 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                  >
                      <Settings size={16} className="mr-2" />
                      Configuration
                  </button>
                </nav>

                <div className="w-px h-6 bg-slate-700 mx-1"></div>

                {/* History Controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleUndo}
                        disabled={!canUndo}
                        className={`p-2 rounded-lg transition-colors ${canUndo ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'}`}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={18} />
                    </button>
                    <button
                        onClick={handleRedo}
                        disabled={!canRedo}
                        className={`p-2 rounded-lg transition-colors ${canRedo ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'}`}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo size={18} />
                    </button>
                </div>
            </div>

            {/* Right Controls */}
            {activeTab === 'generator' && (
              <div className="flex flex-wrap justify-center items-center gap-3 w-full xl:w-auto">
                 {/* Font Selector */}
                 <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-1.5 border border-slate-700/50">
                    <Type size={16} className="ml-2 text-slate-500" />
                    <div className="flex gap-1">
                      {(Object.keys(FONT_THEMES) as FontTheme[]).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setFontTheme(theme)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            fontTheme === theme 
                              ? 'bg-indigo-600 text-white shadow-md' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          {FONT_THEMES[theme].label}
                        </button>
                      ))}
                    </div>
                 </div>

                 {/* Size Selector */}
                 <div className="flex bg-slate-800 rounded-xl p-1.5 border border-slate-700/50">
                    <button onClick={() => setTagSize(TagSize.SMALL)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tagSize === TagSize.SMALL ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:bg-slate-700'}`}>Compact</button>
                    <button onClick={() => setTagSize(TagSize.MEDIUM)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tagSize === TagSize.MEDIUM ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:bg-slate-700'}`}>Standard</button>
                    <button onClick={() => setTagSize(TagSize.LARGE)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tagSize === TagSize.LARGE ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:bg-slate-700'}`}>Large</button>
                 </div>

                {/* CTA */}
                <button
                  onClick={handlePrint}
                  disabled={products.length === 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-900/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ml-2"
                >
                  <Printer size={18} strokeWidth={2.5} />
                  Print Tags
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 space-y-8 print:p-0 print:space-y-0 print:w-full print:max-w-none">
        
        {activeTab === 'generator' && (
          <>
            <section className="no-print animate-in fade-in slide-in-from-bottom-4 duration-500">
              <InputForm
                onAddProduct={handleAddProduct}
                onBulkAdd={handleBulkAdd}
                onClear={handleClear}
                hasItems={products.length > 0}
              />
            </section>

            <section className="print:w-full">
              {products.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 no-print text-center shadow-sm">
                   <div className="bg-slate-50 p-6 rounded-full mb-4">
                     <PackageOpen className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
                   </div>
                   <h3 className="text-xl font-bold text-slate-700 mb-2">Your shelf is empty</h3>
                   <p className="text-slate-400 max-w-sm">Add individual items using the form above or upload a CSV file to generate your tags instantly.</p>
                 </div>
              ) : (
                <div className="overflow-auto print:overflow-visible pb-12">
                   <div className="flex justify-between items-center mb-6 no-print">
                     <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                       <Sparkles className="text-indigo-500 w-5 h-5" />
                       Print Preview 
                       <span className="text-lg font-normal text-slate-400 ml-2">
                         ({products.length} Items &bull; {paginatedResult.pages.length} Sheets)
                       </span>
                     </h2>
                     <div className="flex gap-2 items-center">
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 flex items-center">
                           <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                           Tip: Hover over sheet edges to adjust margins
                        </span>
                     </div>
                   </div>
                  
                  {paginatedResult.pages.map((pageProducts, pageIndex) => {
                    const orientation = paginatedResult.orientations[pageIndex];
                    const isLandscape = orientation === 'landscape';
                    const paddingX = config.sheetSettings?.paddingX ?? DEFAULT_CONFIG.sheetSettings.paddingX;
                    const paddingY = config.sheetSettings?.paddingY ?? DEFAULT_CONFIG.sheetSettings.paddingY;
                    const gapX = config.sheetSettings?.gapX ?? DEFAULT_CONFIG.sheetSettings.gapX;
                    const gapY = config.sheetSettings?.gapY ?? DEFAULT_CONFIG.sheetSettings.gapY;
                    
                    const widthCM = isLandscape ? 29.7 : 21.0;
                    const heightCM = isLandscape ? 21.0 : 29.7;

                    return (
                      <div 
                          key={pageIndex}
                          className={`print-page print-page-${orientation} bg-white shadow-2xl shadow-slate-200/50 mb-12 mx-auto relative group/sheet print:shadow-none print:m-0 print:mb-0 print:break-after-page rounded-sm overflow-hidden`}
                          style={{ 
                              width: `${widthCM}cm`, 
                              height: `${heightCM}cm`,
                              minHeight: `${heightCM}cm`,
                              transition: 'width 0.3s, height 0.3s',
                          }}
                      >
                          <div className="absolute top-0 left-0 w-full opacity-0 group-hover/sheet:opacity-100 transition-opacity z-20">
                             <Ruler 
                                length={widthCM}
                                orientation="horizontal"
                                padding={paddingX}
                                onPaddingChange={(val) => handleSheetPaddingChange('x', val)}
                             />
                          </div>
                          <div className="absolute top-0 left-0 h-full opacity-0 group-hover/sheet:opacity-100 transition-opacity z-20">
                             <Ruler 
                                length={heightCM}
                                orientation="vertical"
                                padding={paddingY}
                                onPaddingChange={(val) => handleSheetPaddingChange('y', val)}
                             />
                          </div>

                          <div className="absolute top-3 right-3 flex gap-2 no-print z-50 opacity-0 group-hover/sheet:opacity-100 transition-all duration-300">
                              <div className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-full text-xs font-mono shadow-lg backdrop-blur-sm">
                                  Page {pageIndex + 1}
                              </div>
                              <button
                                  onClick={() => handlePageOrientationToggle(pageIndex, orientation)}
                                  className="bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-full shadow-lg text-xs flex items-center gap-1.5 transition-all font-medium border border-slate-100"
                              >
                                  <RefreshCw size={12} />
                                  {isLandscape ? 'Landscape' : 'Portrait'}
                              </button>
                          </div>

                          <div 
                            className="w-full h-full flex flex-wrap content-start justify-center relative z-10"
                            style={{
                                padding: `${paddingY}cm ${paddingX}cm`,
                                rowGap: `${gapY}cm`,
                                columnGap: `${gapX}cm`
                            }}
                          >
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
                                            config={config}
                                            onVisualChange={(updates) => handleProductVisualChange(product.id, updates)}
                                        />
                                        <button
                                            onClick={() => handleRemoveProduct(product.id)}
                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 no-print z-30 flex items-center justify-center text-lg leading-none"
                                            title="Remove Tag"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </div>
                            ))}
                          </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'config' && (
          <div className="no-print animate-in fade-in zoom-in-95 duration-300">
            <ConfigPanel 
              config={config} 
              onUpdate={handleConfigUpdate}
              onSave={handleSaveConfig}
              onReset={handleResetConfig}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />
            
            <div className="mt-12 max-w-4xl mx-auto">
               <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-slate-800">Live Interactive Preview</h3>
                  <p className="text-sm text-slate-500 mt-1">Drag and drop sections inside the tag below to reorder them.</p>
               </div>
               
               <div className="flex justify-center bg-slate-200/50 p-12 rounded-3xl border border-slate-200 shadow-inner">
                 <div className="w-auto shadow-2xl shadow-slate-300/50 rounded transform hover:scale-[1.02] transition-transform duration-300">
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
                      config={config}
                      enableDnD={true}
                      onOrderChange={handleSectionReorder}
                      onVisualChange={(updates) => updateState(prev => ({ 
                          ...prev, 
                          config: { ...prev.config, visuals: { ...prev.config.visuals, ...updates } } 
                      }))}
                    />
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto p-8 text-center text-slate-400 text-sm no-print">
        <p>&copy; {new Date().getFullYear()} Smart Retail Solutions. Optimized for Chrome Desktop Printing.</p>
      </footer>

      {showSaveToast && (
        <div className="fixed bottom-8 right-8 bg-slate-800 text-white px-6 py-3.5 rounded-xl shadow-2xl animate-bounce z-50 flex items-center border border-slate-700">
          <div className="mr-3 bg-green-500 rounded-full p-1">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <span className="font-medium">Configuration Saved Successfully</span>
        </div>
      )}
    </div>
  );
};

export default App;