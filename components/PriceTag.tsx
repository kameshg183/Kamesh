import React, { useRef, useState, useEffect } from 'react';
import { Product, TagSize, FontTheme, AppConfiguration, TagSection, TagVisuals } from '../types';
import { FONT_THEMES } from '../constants';
import { Minus, Plus, X } from 'lucide-react';

interface PriceTagProps {
  product: Product;
  size: TagSize;
  fontTheme: FontTheme;
  config: AppConfiguration;
  enableDnD?: boolean;
  onOrderChange?: (newOrder: TagSection[]) => void;
  onVisualChange?: (updates: Partial<TagVisuals>) => void;
  width?: number;
  height?: number;
}

const LAYOUT_CONFIG = {
  [TagSize.SMALL]: {
    container: 'h-[280px]',
    basePadding: 2,
    savings: {
      amount: 'text-4xl',
      symbol: 'text-lg',
      label: 'text-base -translate-y-2'
    },
    product: {
      name: 'text-lg leading-tight line-clamp-2',
      qty: 'text-sm'
    },
    footer: {
      label: 'text-[9px]',
      mrp: 'text-2xl',
      price: 'text-2xl'
    }
  },
  [TagSize.MEDIUM]: {
    container: 'h-[360px]',
    basePadding: 3,
    savings: {
      amount: 'text-[4.5rem]',
      symbol: 'text-2xl',
      label: 'text-xl -translate-y-3'
    },
    product: {
      name: 'text-2xl leading-tight line-clamp-3',
      qty: 'text-lg'
    },
    footer: {
      label: 'text-[10px]',
      mrp: 'text-4xl',
      price: 'text-4xl'
    }
  },
  [TagSize.LARGE]: {
    container: 'h-[500px]',
    basePadding: 4,
    savings: {
      amount: 'text-[7rem]',
      symbol: 'text-3xl',
      label: 'text-3xl -translate-y-5'
    },
    product: {
      name: 'text-3xl leading-tight line-clamp-3',
      qty: 'text-xl'
    },
    footer: {
      label: 'text-xs',
      mrp: 'text-6xl',
      price: 'text-6xl'
    }
  }
};

// --- Helper Component for Individual Text Scaling ---
const EditableText: React.FC<{
  id: string; // e.g., 'productName', 'price'
  scale: number;
  onUpdateScale: (id: string, newScale: number) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ id, scale, onUpdateScale, children, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close slider when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = () => setIsOpen(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only open if not already open to prevent immediate close via doc listener
    if (!isOpen) setIsOpen(true);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateScale(id, parseFloat(e.target.value));
  };

  return (
    <div 
      className={`relative group/text rounded cursor-pointer transition-colors hover:bg-blue-50/50 ${className || ''}`} 
      onClick={handleContainerClick}
    >
      {/* Dashed outline on hover to indicate interactivity */}
      <div className="absolute inset-0 border border-transparent group-hover/text:border-blue-300 border-dashed rounded pointer-events-none no-print"></div>

      {/* The Text Content */}
      <div style={{ fontSize: `${scale}em` }} className="relative z-0">
        {children}
      </div>

      {/* Popover Slider */}
      {isOpen && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-900 text-white p-2 rounded shadow-xl z-50 flex items-center gap-2 no-print"
          onClick={(e) => e.stopPropagation()} // Prevent close on slider click
        >
          <button className="p-1 hover:bg-gray-700 rounded" onClick={() => onUpdateScale(id, Math.max(0.5, scale - 0.1))}>
             <Minus size={12} />
          </button>
          <input 
            type="range" 
            min="0.5" 
            max="2.5" 
            step="0.1" 
            value={scale} 
            onChange={handleSliderChange}
            className="w-20 h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <button className="p-1 hover:bg-gray-700 rounded" onClick={() => onUpdateScale(id, Math.min(3, scale + 0.1))}>
             <Plus size={12} />
          </button>
          <button className="ml-2 text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
            <X size={12} />
          </button>
          <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
};


const PriceTag: React.FC<PriceTagProps> = ({ 
  product, 
  size, 
  fontTheme, 
  config, 
  enableDnD = false,
  onOrderChange,
  onVisualChange,
  width,
  height
}) => {
  const labels = config.labels;
  const visuals = product.customVisuals ? { ...config.visuals, ...product.customVisuals } : config.visuals;
  const textScales = visuals.textScales || {};

  const savings = product.mrp - product.price;
  const hasSavings = savings > 0;
  const theme = FONT_THEMES[fontTheme];
  const layout = LAYOUT_CONFIG[size];
  
  const [draggedSection, setDraggedSection] = useState<TagSection | null>(null);
  const [justDroppedSection, setJustDroppedSection] = useState<TagSection | null>(null);

  const [isResizing, setIsResizing] = useState<null | 'w' | 'h' | 'wh'>(null);
  const resizeStartRef = useRef<{ x: number, y: number, w: number, h: number, fontScale: number } | null>(null);

  const sectionOrder = visuals.sectionOrder || ['savings', 'product', 'footer'];

  const separatorStyle: React.CSSProperties = {
    borderBottomWidth: `${visuals.separatorThickness}px`,
    borderBottomStyle: visuals.separatorStyle,
    borderColor: '#111827',
    marginBottom: `${visuals.sectionSpacing * 0.25}rem`,
    paddingBottom: `${visuals.sectionSpacing * 0.25}rem`
  };

  const contentStyle: React.CSSProperties = {
    zoom: visuals.fontScale
  };

  const dimensionStyle: React.CSSProperties = {
    width: visuals.tagWidth ? `${visuals.tagWidth}px` : '380px',
    height: visuals.tagHeight ? `${visuals.tagHeight}px` : '360px',
    padding: `${layout.basePadding * 0.25}rem`
  };

  // --- Handlers ---

  const handleTextScaleUpdate = (id: string, newScale: number) => {
    if (onVisualChange) {
      onVisualChange({ 
        textScales: { ...textScales, [id]: newScale } 
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, section: TagSection) => {
    if (!enableDnD) return;
    setDraggedSection(section);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
    setJustDroppedSection(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    if (draggedSection) {
        setJustDroppedSection(draggedSection);
        setTimeout(() => setJustDroppedSection(null), 800);
    }
    setDraggedSection(null);
  };

  const handleDragOver = (e: React.DragEvent, targetSection: TagSection) => {
    e.preventDefault();
    if (!enableDnD || !onOrderChange || !draggedSection || draggedSection === targetSection) return;

    const newOrder = [...sectionOrder];
    const sourceIndex = newOrder.indexOf(draggedSection);
    const targetIndex = newOrder.indexOf(targetSection);

    if (sourceIndex !== -1 && targetIndex !== -1) {
        newOrder.splice(sourceIndex, 1);
        newOrder.splice(targetIndex, 0, draggedSection);
        onOrderChange(newOrder);
    }
  };

  const startResize = (e: React.MouseEvent, direction: 'w' | 'h' | 'wh') => {
    if (!onVisualChange) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(direction);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: visuals.tagWidth || 380,
      h: visuals.tagHeight || 360,
      fontScale: visuals.fontScale || 1
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current || !onVisualChange) return;
      
      const dx = e.clientX - resizeStartRef.current.x;
      const dy = e.clientY - resizeStartRef.current.y;
      const startW = resizeStartRef.current.w;
      const startH = resizeStartRef.current.h;
      const startScale = resizeStartRef.current.fontScale;

      const updates: Partial<TagVisuals> = {};

      if (isResizing === 'w') {
        updates.tagWidth = Math.max(150, startW + dx);
      } else if (isResizing === 'h') {
        updates.tagHeight = Math.max(150, startH + dy);
      } else if (isResizing === 'wh') {
        const newWidth = Math.max(150, startW + dx);
        const ratio = newWidth / startW;
        updates.tagWidth = newWidth;
        updates.tagHeight = Math.max(150, startH * ratio);
        updates.fontScale = Math.max(0.5, startScale * ratio);
      }

      onVisualChange(updates);
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      resizeStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onVisualChange]);


  // --- Renderers ---

  const renderSavings = () => (
    <div className={`flex-shrink-0 flex flex-col justify-center items-center cursor-move w-full overflow-hidden min-h-0`}>
      {hasSavings ? (
        <div className="text-center w-full min-w-0">
          <div className={`flex items-baseline justify-center ${theme.priceClass} font-black leading-none flex-wrap`}>
            <span className={`${layout.savings.symbol} mr-1`}>{labels.currency}</span>
            <EditableText id="savings" scale={textScales['savings'] || 1} onUpdateScale={handleTextScaleUpdate}>
               <span className={`${layout.savings.amount} tracking-tighter`}>{Math.round(savings)}</span>
            </EditableText>
            <span className={`${layout.savings.label} ml-2 font-bold transform ${theme.metaClass}`}>{labels.offLabel}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full py-2">
          <EditableText id="bestPrice" scale={textScales['bestPrice'] || 1} onUpdateScale={handleTextScaleUpdate}>
            <span className={`text-3xl font-bold ${theme.priceClass} uppercase`}>{labels.bestPriceLabel}</span>
          </EditableText>
        </div>
      )}
    </div>
  );

  const renderProduct = () => (
    <div className="flex-1 flex flex-col justify-center items-center text-center px-1 min-h-0 cursor-move w-full overflow-hidden">
      <EditableText id="name" scale={textScales['name'] || 1} onUpdateScale={handleTextScaleUpdate} className="w-full">
        <h2 className={`${theme.nameClass} font-bold ${layout.product.name} mb-2 tracking-wide break-words w-full`}>
            {product.name}
        </h2>
      </EditableText>
      
      <EditableText id="qty" scale={textScales['qty'] || 1} onUpdateScale={handleTextScaleUpdate}>
        <span className={`${theme.metaClass} ${layout.product.qty} text-gray-700 font-semibold bg-gray-100 rounded-full inline-block px-3 py-1 max-w-full truncate`}>
            {product.quantity}
        </span>
      </EditableText>
    </div>
  );

  const renderFooter = () => (
    <div className={`flex-shrink-0 cursor-move w-full overflow-hidden min-h-0`}>
      <div className="flex justify-between items-end w-full">
        <div className="text-center px-1">
          <div className={`${theme.metaClass} text-black font-bold uppercase ${layout.footer.label} mb-1`}>{labels.mrpLabel}</div>
          <EditableText id="mrp" scale={textScales['mrp'] || 1} onUpdateScale={handleTextScaleUpdate}>
             <div className={`${theme.priceClass} ${layout.footer.mrp} line-through decoration-red-500 decoration-2 text-gray-500 font-black leading-none`}>
                {labels.currency}{product.mrp}
             </div>
          </EditableText>
        </div>
        
        <div className="text-right px-1">
          <div className={`${theme.metaClass} text-black font-bold uppercase ${layout.footer.label} mb-1`}>{labels.priceLabel}</div>
          <EditableText id="price" scale={textScales['price'] || 1} onUpdateScale={handleTextScaleUpdate}>
            <div className={`${theme.priceClass} ${layout.footer.price} font-black text-black leading-none`}>
                {labels.currency} {product.price}
            </div>
          </EditableText>
        </div>
      </div>
    </div>
  );

  const sectionRenderers = {
    'savings': renderSavings,
    'product': renderProduct,
    'footer': renderFooter
  };

  return (
    <div 
      className={`relative flex flex-col break-inside-avoid print:break-inside-avoid box-border group/tag`}
      style={dimensionStyle}
    >
      {isResizing && (
        <>
            <div className="absolute right-0 top-[-1000px] bottom-[-1000px] w-px border-r border-blue-500 border-dashed z-50 pointer-events-none print:hidden opacity-70" />
            <div className="absolute bottom-0 left-[-1000px] right-[-1000px] h-px border-b border-blue-500 border-dashed z-50 pointer-events-none print:hidden opacity-70" />
            <div className="absolute bottom-[-28px] right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-md z-50 whitespace-nowrap font-mono print:hidden">
                {Math.round(visuals.tagWidth || 380)}px × {Math.round(visuals.tagHeight || 360)}px
            </div>
        </>
      )}

      <div className="absolute inset-0 border-4 border-gray-900 bg-white overflow-hidden flex flex-col">
        <div className="flex flex-col h-full w-full" style={contentStyle}>
            {sectionOrder.map((section, index) => {
            const isLast = index === sectionOrder.length - 1;

            return (
                <div
                key={section}
                draggable={enableDnD}
                onDragStart={(e) => handleDragStart(e, section)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, section)}
                style={isLast ? undefined : separatorStyle}
                className={`
                    ${section === 'product' ? 'flex-1 min-h-0 flex flex-col' : 'flex-shrink-0'} 
                    ${enableDnD ? 'transition-all duration-500 rounded border-2' : ''}
                    ${section === justDroppedSection 
                        ? 'border-green-500 bg-green-50 scale-[1.02] shadow-sm z-10' 
                        : (enableDnD ? 'border-transparent border-dashed hover:border-blue-300 hover:bg-blue-50/50' : '')}
                `}
                title={enableDnD ? "Drag to reorder" : ""}
                >
                {sectionRenderers[section]()}
                </div>
            );
            })}
        </div>
      </div>
      
      {enableDnD && (
         <div className="absolute top-2 right-2 no-print pointer-events-none z-10">
            <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded opacity-50">Drag items to reorder</span>
         </div>
      )}

      {onVisualChange && (
        <>
           <div 
             className="absolute top-0 right-[-6px] w-4 h-full cursor-col-resize hover:bg-blue-400/20 z-20 no-print transition-colors"
             onMouseDown={(e) => startResize(e, 'w')}
             title="Drag to resize width"
           ></div>

           <div 
             className="absolute bottom-[-6px] left-0 w-full h-4 cursor-row-resize hover:bg-blue-400/20 z-20 no-print transition-colors"
             onMouseDown={(e) => startResize(e, 'h')}
             title="Drag to resize height"
           ></div>

           <div 
             className="absolute bottom-[-8px] right-[-8px] w-6 h-6 bg-gray-200 hover:bg-blue-500 cursor-nwse-resize z-30 rounded-tl shadow border border-gray-300 no-print flex items-center justify-center transition-colors group-hover/tag:bg-blue-200"
             onMouseDown={(e) => startResize(e, 'wh')}
             title="Drag to Scale (Text & Size)"
           >
              <svg width="8" height="8" viewBox="0 0 10 10" className="opacity-50">
                 <path d="M10 10 L10 0 L0 10 Z" fill="currentColor"/>
              </svg>
           </div>
        </>
      )}
    </div>
  );
};

export default PriceTag;