import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Product, TagSize, FontTheme, AppConfiguration, TagSection, TagVisuals } from '../types';
import { FONT_THEMES, PX_PER_CM } from '../constants';
import { Minus, Plus, X, RotateCw, Columns, Rows, ArrowLeftRight, ArrowUpDown, Maximize2 } from 'lucide-react';

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
    baseFontSize: 0.8,
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
      label: 'text-xs',
      mrp: 'text-2xl',
      price: 'text-2xl'
    }
  },
  [TagSize.MEDIUM]: {
    baseFontSize: 1,
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
      label: 'text-base',
      mrp: 'text-4xl',
      price: 'text-4xl'
    }
  },
  [TagSize.LARGE]: {
    baseFontSize: 1.2,
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
      label: 'text-xl',
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    
    const updatePosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPopoverPos({
                top: rect.top,
                left: rect.left + (rect.width / 2)
            });
        }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    const handleClickOutside = () => setIsOpen(false);
    // Use capture to ensure we catch clicks outside
    document.addEventListener('click', handleClickOutside); 

    return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
        document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
        setIsOpen(true);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative group/text rounded cursor-pointer transition-colors hover:bg-indigo-50/50 ${className || ''}`} 
      onClick={handleContainerClick}
    >
      {/* Dashed outline on hover to indicate interactivity */}
      <div className="absolute inset-0 border border-transparent group-hover/text:border-indigo-300 border-dashed rounded pointer-events-none no-print"></div>

      {/* The Text Content - Using zoom to scale Tailwind rem-based classes correctly */}
      <div style={{ zoom: scale }} className="relative z-0">
        {children}
      </div>

      {/* Popover Slider - Rendered via Portal to break out of overflow:hidden */}
      {isOpen && createPortal(
        <div 
          className="fixed bg-slate-800 text-white p-2 rounded-xl shadow-2xl z-[9999] flex items-center gap-2 no-print border border-slate-700 animate-in fade-in zoom-in-95 duration-200"
          style={{
              top: popoverPos.top - 12,
              left: popoverPos.left,
              transform: 'translate(-50%, -100%)'
          }}
          onClick={(e) => e.stopPropagation()} // Prevent close on slider click
        >
          <button className="p-1 hover:bg-slate-700 rounded-full transition-colors" onClick={() => onUpdateScale(id, Math.max(0.5, scale - 0.1))}>
             <Minus size={14} />
          </button>
          <input 
            type="range" 
            min="0.5" 
            max="2.5" 
            step="0.1" 
            value={scale} 
            onChange={(e) => onUpdateScale(id, parseFloat(e.target.value))}
            className="w-20 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <button className="p-1 hover:bg-slate-700 rounded-full transition-colors" onClick={() => onUpdateScale(id, Math.min(3, scale + 0.1))}>
             <Plus size={14} />
          </button>
          <div className="w-px h-4 bg-slate-600 mx-1"></div>
          <button className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors" onClick={() => setIsOpen(false)}>
            <X size={14} />
          </button>
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-800 rotate-45 border-r border-b border-slate-700"></div>
        </div>,
        document.body
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
}) => {
  const labels = config.labels;
  const productCustoms = product.customVisuals || {};
  
  // Local preview state for smooth resizing without layout thrashing
  const [previewVisuals, setPreviewVisuals] = useState<Partial<TagVisuals> | null>(null);

  // Computed visuals merging config, product defaults, and active resize preview
  const visuals = useMemo(() => {
    const base = { ...config.visuals, ...productCustoms };
    return previewVisuals ? { ...base, ...previewVisuals } : base;
  }, [config.visuals, productCustoms, previewVisuals]);

  const textScales = visuals.textScales || {};
  const layoutDirection = visuals.layoutDirection || 'col';
  const isRowLayout = layoutDirection === 'row';

  const savings = product.mrp - product.price;
  const hasSavings = savings > 0;
  const theme = FONT_THEMES[fontTheme];
  const layout = LAYOUT_CONFIG[size];
  
  const [draggedSection, setDraggedSection] = useState<TagSection | null>(null);
  const [justDroppedSection, setJustDroppedSection] = useState<TagSection | null>(null);

  const [isResizing, setIsResizing] = useState<null | 'w' | 'h' | 'wh'>(null);
  const [isSnapped, setIsSnapped] = useState(false);

  const resizeStartRef = useRef<{ x: number, y: number, w: number, h: number, fontScale: number } | null>(null);
  
  const snapLocks = useRef<{
    w: { active: boolean, anchor: number | null, timer: ReturnType<typeof setTimeout> | null, ignoreAnchor: number | null },
    h: { active: boolean, anchor: number | null, timer: ReturnType<typeof setTimeout> | null, ignoreAnchor: number | null }
  }>({
    w: { active: false, anchor: null, timer: null, ignoreAnchor: null },
    h: { active: false, anchor: null, timer: null, ignoreAnchor: null }
  });

  const sectionOrder = visuals.sectionOrder || ['savings', 'product', 'footer'];

  const separatorStyle: React.CSSProperties = isRowLayout ? {
    borderRightWidth: `${visuals.separatorThickness}px`,
    borderRightStyle: visuals.separatorStyle,
    borderColor: '#1e293b', // slate-800
    marginRight: `${visuals.sectionSpacing * 0.25}rem`,
    paddingRight: `${visuals.sectionSpacing * 0.25}rem`
  } : {
    borderBottomWidth: `${visuals.separatorThickness}px`,
    borderBottomStyle: visuals.separatorStyle,
    borderColor: '#1e293b', // slate-800
    marginBottom: `${visuals.sectionSpacing * 0.25}rem`,
    paddingBottom: `${visuals.sectionSpacing * 0.25}rem`
  };

  const contentStyle: React.CSSProperties = {
    zoom: visuals.fontScale
  };

  // Dimensions in CM
  const currentWidth = visuals.tagWidth || 10;
  const currentHeight = visuals.tagHeight || 7.5;
  const currentPaddingX = visuals.paddingX || 0.5;
  const currentPaddingY = visuals.paddingY || 0.5;

  const dimensionStyle: React.CSSProperties = {
    width: `${currentWidth}cm`,
    height: `${currentHeight}cm`,
    paddingLeft: `${currentPaddingX}cm`,
    paddingRight: `${currentPaddingX}cm`,
    paddingTop: `${currentPaddingY}cm`,
    paddingBottom: `${currentPaddingY}cm`,
  };

  // --- Handlers ---

  const handleTextScaleUpdate = (id: string, newScale: number) => {
    if (onVisualChange) {
      onVisualChange({ 
        textScales: { ...textScales, [id]: newScale } 
      });
    }
  };

  const handleSwapDimensions = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onVisualChange) return;

    onVisualChange({
      tagWidth: currentHeight,
      tagHeight: currentWidth
    });
  };

  const handleToggleLayout = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onVisualChange) return;
    
    onVisualChange({
        layoutDirection: isRowLayout ? 'col' : 'row'
    });
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
      w: currentWidth, // in CM
      h: currentHeight, // in CM
      fontScale: visuals.fontScale || 1
    };
  };

  const applySnap = (rawValue: number, axis: 'w' | 'h') => {
    // Snap to nearest 0.5 CM
    const SNAP_INCREMENT = 0.5; 
    const SNAP_THRESHOLD = 0.4; // 0.4 CM threshold

    const nearestSnap = Math.round(rawValue / SNAP_INCREMENT) * SNAP_INCREMENT;
    const dist = Math.abs(rawValue - nearestSnap);
    const lock = snapLocks.current[axis];

    if (lock.active) {
        if (Math.abs(rawValue - lock.anchor!) > 1.0) { // break lock if pulled away by 1cm
            if (lock.timer) clearTimeout(lock.timer);
            lock.active = false;
            lock.timer = null;
            setIsSnapped(false);
            return rawValue;
        }
        return lock.anchor!; 
    }

    if (dist < SNAP_THRESHOLD) {
        if (lock.ignoreAnchor === nearestSnap) {
            return rawValue; 
        }

        lock.active = true;
        lock.anchor = nearestSnap;
        setIsSnapped(true);
        
        lock.timer = setTimeout(() => {
            lock.active = false;
            lock.ignoreAnchor = nearestSnap; 
            lock.timer = null;
            setIsSnapped(false);
        }, 600); 

        return nearestSnap;
    }

    if (dist >= SNAP_THRESHOLD) {
        lock.ignoreAnchor = null;
        if (lock.active) {
             if (lock.timer) clearTimeout(lock.timer);
             lock.active = false;
             setIsSnapped(false);
        }
    }

    return rawValue;
  };


  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      
      const dxPx = e.clientX - resizeStartRef.current.x;
      const dyPx = e.clientY - resizeStartRef.current.y;
      
      // Convert pixel delta to CM delta
      const dxCm = dxPx / PX_PER_CM;
      const dyCm = dyPx / PX_PER_CM;

      const startW = resizeStartRef.current.w;
      const startH = resizeStartRef.current.h;
      const startScale = resizeStartRef.current.fontScale;

      const updates: Partial<TagVisuals> = {};

      if (isResizing === 'w') {
        const rawW = Math.max(3, startW + dxCm); // Min 3cm
        updates.tagWidth = applySnap(rawW, 'w');
      } else if (isResizing === 'h') {
        const rawH = Math.max(3, startH + dyCm); // Min 3cm
        updates.tagHeight = applySnap(rawH, 'h');
      } else if (isResizing === 'wh') {
        const newWidth = Math.max(3, startW + dxCm);
        const ratio = newWidth / startW;
        updates.tagWidth = newWidth;
        updates.tagHeight = Math.max(3, startH * ratio);
        updates.fontScale = Math.max(0.5, startScale * ratio);
      }
      
      setPreviewVisuals(updates);
    };

    const handleMouseUp = () => {
      if (onVisualChange && previewVisuals) {
         onVisualChange(previewVisuals);
      }
      
      setPreviewVisuals(null);
      setIsResizing(null);
      setIsSnapped(false);
      resizeStartRef.current = null;
      
      ['w', 'h'].forEach(axis => {
        const lock = snapLocks.current[axis as 'w'|'h'];
        if (lock.timer) clearTimeout(lock.timer);
        lock.active = false;
        lock.timer = null;
        lock.ignoreAnchor = null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onVisualChange, previewVisuals]);


  // --- Renderers ---

  const renderSavings = () => (
    <div className={`flex-shrink-0 flex flex-col justify-center items-center cursor-move overflow-hidden min-h-0 ${isRowLayout ? 'h-full w-auto px-2' : 'w-full'}`}>
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
    <div className={`flex-1 flex flex-col justify-center items-center text-center px-1 min-h-0 cursor-move overflow-hidden ${isRowLayout ? 'h-full' : 'w-full'}`}>
      <EditableText id="name" scale={textScales['name'] || 1} onUpdateScale={handleTextScaleUpdate} className="w-full">
        <h2 className={`${theme.nameClass} font-bold ${layout.product.name} mb-2 tracking-wide break-words w-full`}>
            {product.name}
        </h2>
      </EditableText>
      
      <EditableText id="qty" scale={textScales['qty'] || 1} onUpdateScale={handleTextScaleUpdate}>
        <span className={`${theme.metaClass} ${layout.product.qty} text-slate-700 font-semibold bg-slate-100 rounded-full inline-block px-3 py-1 max-w-full truncate`}>
            {product.quantity}
        </span>
      </EditableText>
    </div>
  );

  const renderFooter = () => (
    <div className={`flex-shrink-0 cursor-move overflow-hidden min-h-0 ${isRowLayout ? 'h-full w-auto px-2 flex flex-col justify-center' : 'w-full'}`}>
      <div className={`flex ${isRowLayout ? 'flex-col gap-2 items-center text-center' : 'justify-between items-end w-full'}`}>
        <div className={`${isRowLayout ? 'text-center' : 'text-center px-1'}`}>
          <EditableText id="labelMrp" scale={textScales['labelMrp'] || 1} onUpdateScale={handleTextScaleUpdate}>
             <div className={`${theme.metaClass} text-slate-900 font-bold uppercase ${layout.footer.label} mb-1`}>{labels.mrpLabel}</div>
          </EditableText>
          <EditableText id="mrp" scale={textScales['mrp'] || 1} onUpdateScale={handleTextScaleUpdate}>
             <div className={`${theme.priceClass} ${layout.footer.mrp} line-through decoration-red-500 decoration-2 text-slate-400 font-black leading-none`}>
                {labels.currency}{product.mrp}
             </div>
          </EditableText>
        </div>
        
        <div className={`${isRowLayout ? 'text-center' : 'text-right px-1'}`}>
          <EditableText id="labelPrice" scale={textScales['labelPrice'] || 1} onUpdateScale={handleTextScaleUpdate}>
             <div className={`${theme.metaClass} text-slate-900 font-bold uppercase ${layout.footer.label} mb-1`}>{labels.priceLabel}</div>
          </EditableText>
          <EditableText id="price" scale={textScales['price'] || 1} onUpdateScale={handleTextScaleUpdate}>
            <div className={`${theme.priceClass} ${layout.footer.price} font-black text-slate-900 leading-none`}>
                {labels.currency} {product.price}
            </div>
          </EditableText>
        </div>
      </div>
    </div>
  );

  const sectionRenderers: Record<string, () => React.JSX.Element> = {
    'savings': renderSavings,
    'product': renderProduct,
    'footer': renderFooter
  };

  return (
    <div 
      className={`relative flex flex-col break-inside-avoid print:break-inside-avoid box-border group/tag select-none`}
      style={dimensionStyle}
    >
      {/* Resize Overlay Guidelines */}
      {isResizing && (
        <>
            <div 
                className={`absolute top-[-1000px] bottom-[-1000px] w-px border-r ${isSnapped ? 'border-green-500 border-2' : 'border-indigo-400 border-dashed'} z-50 pointer-events-none print:hidden opacity-60`} 
                style={{ right: `${currentPaddingX}cm` }}
            />
            <div 
                className={`absolute left-[-1000px] right-[-1000px] h-px border-b ${isSnapped ? 'border-green-500 border-2' : 'border-indigo-400 border-dashed'} z-50 pointer-events-none print:hidden opacity-60`} 
                style={{ bottom: `${currentPaddingY}cm` }}
            />
            <div 
                className={`absolute ${isSnapped ? 'bg-green-600' : 'bg-indigo-600'} text-white text-xs px-2.5 py-1.5 rounded-full shadow-lg z-50 whitespace-nowrap font-mono print:hidden transition-all font-semibold`}
                style={{ 
                    bottom: `calc(${currentPaddingY}cm - 36px)`,
                    right: `${currentPaddingX}cm`
                }}
            >
                {currentWidth.toFixed(1)}cm × {currentHeight.toFixed(1)}cm
            </div>
        </>
      )}

      {/* Main Tag Content Area */}
      <div className={`absolute inset-[0] transition-all duration-200 border-4 border-slate-900 bg-white overflow-hidden flex ${isRowLayout ? 'flex-row' : 'flex-col'}`}
         style={{
             top: `${currentPaddingY}cm`,
             bottom: `${currentPaddingY}cm`,
             left: `${currentPaddingX}cm`,
             right: `${currentPaddingX}cm`,
         }}
      >
        <div className={`flex h-full w-full ${isRowLayout ? 'flex-row' : 'flex-col'}`} style={contentStyle}>
            {sectionOrder.map((section, index) => {
            const isLast = index === sectionOrder.length - 1;
            const renderer = sectionRenderers[section];
            
            // Safety check: skip rendering if section identifier is invalid/unknown
            if (!renderer) return null;

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
                    ${enableDnD ? 'transition-all duration-300' : ''}
                    ${section === justDroppedSection 
                        ? 'border-green-500 bg-green-50 z-10' 
                        : (enableDnD ? 'border-transparent border hover:border-indigo-300 hover:bg-indigo-50/30' : '')}
                `}
                title={enableDnD ? "Drag to reorder" : ""}
                >
                {renderer()}
                </div>
            );
            })}
        </div>
      </div>
      
      {enableDnD && (
         <div 
           className="absolute no-print pointer-events-none z-10"
           style={{
             top: `calc(${currentPaddingY}cm + 8px)`,
             right: `calc(${currentPaddingX}cm + 8px)`
           }}
         >
            <span className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-full opacity-40 uppercase font-bold tracking-wider">Drag items to reorder</span>
         </div>
      )}

      {onVisualChange && (
        <>
           {/* Orientation / Layout Controls */}
           <div 
             className="absolute z-40 no-print opacity-0 group-hover/tag:opacity-100 transition-all duration-300 flex flex-col gap-2"
             style={{
                 top: `calc(${currentPaddingY}cm)`,
                 left: `calc(${currentPaddingX}cm - 36px)`
             }}
           >
                <button
                  onClick={handleSwapDimensions}
                  className="w-8 h-8 bg-white rounded-full shadow-lg border border-slate-100 text-slate-500 hover:text-indigo-600 hover:scale-110 flex items-center justify-center transition-all"
                  title="Rotate Shape"
                >
                  <RotateCw size={14} />
                </button>

                <button
                  onClick={handleToggleLayout}
                  className="w-8 h-8 bg-white rounded-full shadow-lg border border-slate-100 text-slate-500 hover:text-indigo-600 hover:scale-110 flex items-center justify-center transition-all"
                  title="Toggle Content Layout"
                >
                  {isRowLayout ? <ArrowUpDown size={14} /> : <ArrowLeftRight size={14} />}
                </button>
           </div>

           {/* Width Handle */}
           <div 
             className="absolute w-4 h-full cursor-col-resize z-20 no-print flex items-center justify-center group/handle-w"
             style={{
                right: `calc(${currentPaddingX}cm - 8px)`, 
                top: `${currentPaddingY}cm`,
                bottom: `${currentPaddingY}cm`
             }}
             onMouseDown={(e) => startResize(e, 'w')}
             title="Resize Width"
           >
             <div className="w-1.5 h-8 bg-indigo-200 rounded-full opacity-0 group-hover/tag:opacity-100 group-hover/handle-w:bg-indigo-500 transition-all shadow-sm"></div>
           </div>

           {/* Height Handle */}
           <div 
             className="absolute h-4 w-full cursor-row-resize z-20 no-print flex items-center justify-center group/handle-h"
             style={{
                bottom: `calc(${currentPaddingY}cm - 8px)`, 
                left: `${currentPaddingX}cm`,
                right: `${currentPaddingX}cm`
             }}
             onMouseDown={(e) => startResize(e, 'h')}
             title="Resize Height"
           >
              <div className="h-1.5 w-8 bg-indigo-200 rounded-full opacity-0 group-hover/tag:opacity-100 group-hover/handle-h:bg-indigo-500 transition-all shadow-sm"></div>
           </div>

           {/* Corner Resize Handle */}
           <div 
             className="absolute w-8 h-8 cursor-nwse-resize z-30 no-print flex items-center justify-center transition-all opacity-0 group-hover/tag:opacity-100 hover:scale-110"
             style={{
                right: `calc(${currentPaddingX}cm - 16px)`, 
                bottom: `calc(${currentPaddingY}cm - 16px)`
             }}
             onMouseDown={(e) => startResize(e, 'wh')}
             title="Resize Scale"
           >
              <div className="w-6 h-6 bg-white rounded-full shadow-lg border-2 border-indigo-500 flex items-center justify-center text-indigo-500">
                 <Maximize2 size={12} strokeWidth={3} />
              </div>
           </div>
        </>
      )}
    </div>
  );
};

export default PriceTag;