import React, { useRef } from 'react';
import { PX_PER_CM } from '../constants';

interface RulerProps {
    length: number; // in cm
    orientation: 'horizontal' | 'vertical';
    padding: number; // current padding in cm
    onPaddingChange: (newPadding: number) => void;
    className?: string;
}

const Ruler: React.FC<RulerProps> = ({ length, orientation, padding, onPaddingChange, className }) => {
    const isHorz = orientation === 'horizontal';
    const ticks = Array.from({ length: Math.ceil(length) + 1 });
    const isDragging = useRef(false);

    // Handler for Start (Left/Top) Handle
    const handleStartMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = true;
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startPadding = padding;

        const handleMouseMove = (mv: MouseEvent) => {
            if (!isDragging.current) return;
            let delta = 0;
            if (isHorz) {
                delta = (mv.clientX - startX) / PX_PER_CM;
            } else {
                delta = (mv.clientY - startY) / PX_PER_CM;
            }
            // Clamp padding to max half the length (minus a bit of buffer)
            const newPadding = Math.max(0, Math.min(length / 2 - 0.5, startPadding + delta));
            onPaddingChange(newPadding);
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Handler for End (Right/Bottom) Handle
    const handleEndMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = true;
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startPadding = padding;

        const handleMouseMove = (mv: MouseEvent) => {
            if (!isDragging.current) return;
            let delta = 0;
            if (isHorz) {
                delta = (mv.clientX - startX) / PX_PER_CM;
            } else {
                delta = (mv.clientY - startY) / PX_PER_CM;
            }
            
            // Inverted logic for end handle: 
            // Moving Left (negative delta) INCREASES padding.
            // Moving Up (negative delta) INCREASES padding.
            const newPadding = Math.max(0, Math.min(length / 2 - 0.5, startPadding - delta));
            onPaddingChange(newPadding);
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div 
            className={`absolute bg-white border-slate-200 z-30 select-none print:hidden transition-opacity duration-200 opacity-90 backdrop-blur-sm
            ${isHorz ? 'h-6 top-0 left-0 right-0 border-b flex' : 'w-6 top-0 left-0 bottom-0 border-r block'}
            ${className || ''}`}
        >
            {/* Ticks */}
            {ticks.map((_, i) => (
                <div 
                    key={i} 
                    className="absolute text-[9px] flex justify-center items-center font-sans font-medium text-slate-400"
                    style={isHorz ? {
                        left: `${(i / length) * 100}%`,
                        height: '100%',
                        width: '1px',
                        borderLeft: '1px solid #e2e8f0'
                    } : {
                        top: `${(i / length) * 100}%`,
                        width: '100%',
                        height: '1px',
                        borderTop: '1px solid #e2e8f0'
                    }}
                >
                    <span className="bg-white/90 px-0.5">{i > 0 ? i : ''}</span>
                </div>
            ))}

            {/* Margin Start Marker (Left / Top) */}
            <div 
                className={`absolute bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-sm z-40 group`}
                style={isHorz ? {
                    left: `${(padding / length) * 100}%`,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    cursor: 'col-resize'
                } : {
                    top: `${(padding / length) * 100}%`,
                    left: 0,
                    right: 0,
                    height: '2px',
                    cursor: 'row-resize'
                }}
                onMouseDown={handleStartMouseDown}
                title={`Margin: ${padding.toFixed(1)}cm`}
            >
                {/* Visual Triangle Handle */}
                <div className={`absolute bg-indigo-500 w-2 h-2 transform rotate-45 ${isHorz ? '-left-[3px] top-0' : '-top-[3px] left-0'}`}></div>
            </div>

            {/* Margin Area Visualization (Start) */}
            <div 
                 className="absolute bg-slate-100/80 pointer-events-none"
                 style={isHorz ? {
                     left: 0,
                     width: `${(padding / length) * 100}%`,
                     height: '100%'
                 } : {
                     top: 0,
                     height: `${(padding / length) * 100}%`,
                     width: '100%'
                 }}
            />
            
            {/* Margin End Marker (Right / Bottom) */}
             <div 
                className={`absolute bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-sm z-40 group`}
                style={isHorz ? {
                    right: `${(padding / length) * 100}%`,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    cursor: 'col-resize'
                } : {
                    bottom: `${(padding / length) * 100}%`,
                    left: 0,
                    right: 0,
                    height: '2px',
                    cursor: 'row-resize'
                }}
                onMouseDown={handleEndMouseDown}
                title={`Margin: ${padding.toFixed(1)}cm`}
            >
                <div className={`absolute bg-indigo-500 w-2 h-2 transform rotate-45 ${isHorz ? '-right-[3px] top-0' : '-bottom-[3px] left-0'}`}></div>
            </div>
            
            {/* Margin Area Visualization (End) */}
             <div 
                 className="absolute bg-slate-100/80 pointer-events-none"
                 style={isHorz ? {
                     right: 0,
                     width: `${(padding / length) * 100}%`,
                     height: '100%'
                 } : {
                     bottom: 0,
                     height: `${(padding / length) * 100}%`,
                     width: '100%'
                 }}
            />
        </div>
    );
};

export default Ruler;