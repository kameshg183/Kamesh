import React, { useState } from 'react';
import { AppConfiguration, TagLabels, TagVisuals, SheetSettings } from '../types';
import { RotateCcw, Save, Type, Palette, LayoutTemplate, Check, Undo, Redo, Smartphone, Monitor, LayoutGrid, Sliders } from 'lucide-react';
import { DEFAULT_CONFIG } from '../constants';

interface ConfigPanelProps {
  config: AppConfiguration;
  onUpdate: (newConfig: AppConfiguration) => void;
  onSave: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
  config, 
  onUpdate, 
  onSave, 
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [activeTab, setActiveTab] = useState<'labels' | 'visuals'>('labels');
  const [isDirty, setIsDirty] = useState(false);

  const handleLabelChange = (key: keyof TagLabels, value: string) => {
    onUpdate({
      ...config,
      labels: { ...config.labels, [key]: value }
    });
    setIsDirty(true);
  };

  const handleVisualChange = (key: keyof TagVisuals, value: string | number) => {
    onUpdate({
      ...config,
      visuals: { ...config.visuals, [key]: value }
    });
    setIsDirty(true);
  };

  const handleSheetSettingChange = (key: keyof SheetSettings, value: number) => {
    onUpdate({
      ...config,
      sheetSettings: { ...config.sheetSettings, [key]: value }
    });
    setIsDirty(true);
  };

  const handleOrientationChange = (orientation: 'portrait' | 'landscape') => {
    onUpdate({
        ...config,
        paperOrientation: orientation
    });
    setIsDirty(true);
  };

  const handleTextScaleChange = (id: string, value: number) => {
    const newScales = { ...(config.visuals.textScales || {}), [id]: value };
    onUpdate({
       ...config,
       visuals: { ...config.visuals, textScales: newScales }
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave();
    setIsDirty(false);
  };

  const renderTextScaleSlider = (label: string, id: string) => {
      const val = config.visuals.textScales?.[id] || 1;
      return (
          <div className="space-y-2">
              <div className="flex justify-between items-end">
                  <label className="text-xs font-semibold text-slate-600">{label}</label>
                  <span className="text-xs text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.5 rounded">{val.toFixed(2)}x</span>
              </div>
              <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={val}
                  onChange={(e) => handleTextScaleChange(id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
          </div>
      );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto flex flex-col md:flex-row overflow-hidden min-h-[600px]">
      
      {/* Sidebar Tabs */}
      <div className="w-full md:w-72 bg-slate-50 border-r border-slate-100 flex md:flex-col p-2 gap-1">
        <div className="p-4 mb-2 hidden md:block">
            <h3 className="font-bold text-slate-800 text-lg">Settings</h3>
            <p className="text-xs text-slate-500 mt-1">Customize your tag output</p>
        </div>
        
        <button 
          onClick={() => setActiveTab('labels')}
          className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'labels' 
            ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Type className={`w-4 h-4 mr-3 ${activeTab === 'labels' ? 'text-indigo-500' : 'text-slate-400'}`} />
          Text Labels
          {activeTab === 'labels' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
        </button>
        
        <button 
          onClick={() => setActiveTab('visuals')}
          className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'visuals' 
            ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Palette className={`w-4 h-4 mr-3 ${activeTab === 'visuals' ? 'text-indigo-500' : 'text-slate-400'}`} />
          Visual Style
          {activeTab === 'visuals' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">
                    {activeTab === 'labels' ? 'Text Configuration' : 'Visual Settings'}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                    {activeTab === 'labels' ? 'Define global labels for your tags.' : 'Adjust dimensions, spacing and scaling.'}
                </p>
            </div>
            <div className="flex gap-3">
                <div className="flex gap-1 mr-2 border-r border-slate-100 pr-4">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`p-2 rounded-lg transition-colors ${
                            canUndo 
                             ? 'text-slate-600 hover:bg-slate-100' 
                             : 'text-slate-300 cursor-not-allowed'
                        }`}
                        title="Undo"
                    >
                        <Undo className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`p-2 rounded-lg transition-colors ${
                            canRedo
                             ? 'text-slate-600 hover:bg-slate-100' 
                             : 'text-slate-300 cursor-not-allowed'
                        }`}
                        title="Redo"
                    >
                        <Redo className="w-5 h-5" />
                    </button>
                </div>

                <button
                    onClick={onReset}
                    className="flex items-center px-4 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    title="Reset All to Defaults"
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                </button>
                <button
                    onClick={handleSave}
                    className={`flex items-center px-6 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-md ${
                        isDirty ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-default'
                    }`}
                    title="Save Configuration"
                >
                    {isDirty ? <Save className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    {isDirty ? 'Save Changes' : 'Saved'}
                </button>
            </div>
        </div>

        {activeTab === 'labels' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Currency Symbol</label>
              <input
                type="text"
                value={config.labels.currency}
                onChange={(e) => handleLabelChange('currency', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="₹"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Discount Label</label>
              <input
                type="text"
                value={config.labels.offLabel}
                onChange={(e) => handleLabelChange('offLabel', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="Off"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">MRP Label</label>
              <input
                type="text"
                value={config.labels.mrpLabel}
                onChange={(e) => handleLabelChange('mrpLabel', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="MRP"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Price Label</label>
              <input
                type="text"
                value={config.labels.priceLabel}
                onChange={(e) => handleLabelChange('priceLabel', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="Our Price"
              />
            </div>
             <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">No Discount Label</label>
              <input
                type="text"
                value={config.labels.bestPriceLabel}
                onChange={(e) => handleLabelChange('bestPriceLabel', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="Best Price"
              />
            </div>
          </div>
        )}

        {activeTab === 'visuals' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Paper Orientation */}
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="mb-4">
                    <label className="font-bold text-slate-800 flex items-center">
                        <LayoutTemplate className="w-4 h-4 mr-2 text-indigo-500" />
                        Paper Orientation
                    </label>
                    <p className="text-xs text-slate-500 mt-1">Select the paper layout for printing.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleOrientationChange('portrait')}
                        className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${
                            config.paperOrientation === 'portrait' || !config.paperOrientation
                            ? 'border-indigo-500 bg-white shadow-md text-indigo-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200'
                        }`}
                    >
                        <Smartphone className="w-8 h-8 opacity-80" strokeWidth={1.5} />
                        <span className="font-semibold text-sm">Portrait</span>
                    </button>
                    <button
                        onClick={() => handleOrientationChange('landscape')}
                        className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${
                            config.paperOrientation === 'landscape'
                            ? 'border-indigo-500 bg-white shadow-md text-indigo-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200'
                        }`}
                    >
                        <Monitor className="w-8 h-8 opacity-80" strokeWidth={1.5} />
                        <span className="font-semibold text-sm">Landscape</span>
                    </button>
                </div>
             </div>

             {/* Sheet Layout (Gaps) */}
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="mb-4">
                    <label className="font-bold text-slate-800 flex items-center">
                        <LayoutGrid className="w-4 h-4 mr-2 text-indigo-500" />
                        Sheet Layout & Gaps
                    </label>
                    <p className="text-xs text-slate-500 mt-1">Adjust spacing between tags on the print sheet.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-semibold text-slate-600">Horizontal Gap</label>
                            <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">{config.sheetSettings.gapX}cm</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="2" 
                            step="0.1"
                            value={config.sheetSettings.gapX}
                            onChange={(e) => handleSheetSettingChange('gapX', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                    <div>
                         <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-semibold text-slate-600">Vertical Gap</label>
                            <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">{config.sheetSettings.gapY}cm</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="2" 
                            step="0.1"
                            value={config.sheetSettings.gapY}
                            onChange={(e) => handleSheetSettingChange('gapY', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                </div>
             </div>

             {/* Spacing Control */}
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                    <label className="font-bold text-slate-800 flex items-center">
                        <LayoutTemplate className="w-4 h-4 mr-2 text-indigo-500" />
                        Internal Section Spacing
                    </label>
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">{config.visuals.sectionSpacing}x</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="12" 
                    step="0.5"
                    value={config.visuals.sectionSpacing}
                    onChange={(e) => handleVisualChange('sectionSpacing', parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
             </div>

             {/* Font Scale Control */}
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                    <label className="font-bold text-slate-800 flex items-center">
                        <Type className="w-4 h-4 mr-2 text-indigo-500" />
                        Global Content Scale
                    </label>
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">{Math.round(config.visuals.fontScale * 100)}%</span>
                </div>
                <input 
                    type="range" 
                    min="0.7" 
                    max="1.3" 
                    step="0.05"
                    value={config.visuals.fontScale}
                    onChange={(e) => handleVisualChange('fontScale', parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
             </div>

             {/* Specific Element Sizes */}
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="mb-6">
                    <label className="font-bold text-slate-800 flex items-center">
                        <Sliders className="w-4 h-4 mr-2 text-indigo-500" />
                        Fine-Tune Element Sizes
                    </label>
                    <p className="text-xs text-slate-500 mt-1">Adjust specific text elements relative to the base size.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {renderTextScaleSlider("Product Name", "name")}
                    {renderTextScaleSlider("Price (Our Price)", "price")}
                    {renderTextScaleSlider("Label: Our Price", "labelPrice")}
                    {renderTextScaleSlider("MRP (Original Price)", "mrp")}
                    {renderTextScaleSlider("Label: MRP", "labelMrp")}
                    {renderTextScaleSlider("Savings Amount", "savings")}
                    {renderTextScaleSlider("Quantity / Size", "qty")}
                    {renderTextScaleSlider("No Discount Label", "bestPrice")}
                </div>
             </div>

             {/* Line Styles */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Separator Line Type</label>
                    <select 
                        value={config.visuals.separatorStyle}
                        onChange={(e) => handleVisualChange('separatorStyle', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
                    >
                        <option value="dashed">Dashed</option>
                        <option value="solid">Solid</option>
                        <option value="dotted">Dotted</option>
                        <option value="none">None</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Separator Thickness</label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="range" 
                            min="1" 
                            max="6" 
                            value={config.visuals.separatorThickness}
                            onChange={(e) => handleVisualChange('separatorThickness', parseInt(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{config.visuals.separatorThickness}px</span>
                    </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigPanel;