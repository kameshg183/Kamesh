import React, { useState } from 'react';
import { AppConfiguration, TagLabels, TagVisuals } from '../types';
import { RotateCcw, Save, Type, Palette, LayoutTemplate, Check } from 'lucide-react';
import { DEFAULT_CONFIG } from '../constants';

interface ConfigPanelProps {
  config: AppConfiguration;
  onUpdate: (newConfig: AppConfiguration) => void;
  onSave: () => void;
  onReset: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onUpdate, onSave, onReset }) => {
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

  const handleSave = () => {
    onSave();
    setIsDirty(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 flex md:flex-col">
        <div className="p-4 md:border-b border-gray-100 hidden md:block">
            <h3 className="font-bold text-gray-800">Edit Tag</h3>
            <p className="text-xs text-gray-500">Customize appearance</p>
        </div>
        
        <button 
          onClick={() => setActiveTab('labels')}
          className={`flex-1 md:flex-none flex items-center px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === 'labels' ? 'bg-white text-blue-600 border-l-4 border-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent'
          }`}
        >
          <Type className="w-4 h-4 mr-3" />
          Text Labels
        </button>
        
        <button 
          onClick={() => setActiveTab('visuals')}
          className={`flex-1 md:flex-none flex items-center px-6 py-4 text-sm font-medium transition-colors ${
            activeTab === 'visuals' ? 'bg-white text-blue-600 border-l-4 border-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent'
          }`}
        >
          <Palette className="w-4 h-4 mr-3" />
          Visual Style
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
                {activeTab === 'labels' ? 'Text Configuration' : 'Visual Settings'}
            </h2>
            <div className="flex gap-2">
                <button
                    onClick={onReset}
                    className="flex items-center px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                    title="Reset All to Defaults"
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                </button>
                <button
                    onClick={handleSave}
                    className={`flex items-center px-6 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-md ${
                        isDirty ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'
                    }`}
                    title="Save Configuration"
                >
                    {isDirty ? <Save className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    {isDirty ? 'Save Changes' : 'Saved'}
                </button>
            </div>
        </div>

        {activeTab === 'labels' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Currency Symbol</label>
              <input
                type="text"
                value={config.labels.currency}
                onChange={(e) => handleLabelChange('currency', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="₹"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Discount Label</label>
              <input
                type="text"
                value={config.labels.offLabel}
                onChange={(e) => handleLabelChange('offLabel', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Off"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">MRP Label</label>
              <input
                type="text"
                value={config.labels.mrpLabel}
                onChange={(e) => handleLabelChange('mrpLabel', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="MRP"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">Price Label</label>
              <input
                type="text"
                value={config.labels.priceLabel}
                onChange={(e) => handleLabelChange('priceLabel', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Our Price"
              />
            </div>
             <div className="md:col-span-2 space-y-1">
              <label className="block text-sm font-semibold text-gray-700">No Discount Label</label>
              <input
                type="text"
                value={config.labels.bestPriceLabel}
                onChange={(e) => handleLabelChange('bestPriceLabel', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Best Price"
              />
            </div>
          </div>
        )}

        {activeTab === 'visuals' && (
          <div className="space-y-8 animate-fadeIn">
             {/* Spacing Control */}
             <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                    <label className="font-semibold text-gray-800 flex items-center">
                        <LayoutTemplate className="w-4 h-4 mr-2 text-gray-500" />
                        Section Spacing (Drag to Move Lines)
                    </label>
                    <span className="text-sm text-gray-500 font-mono">{config.visuals.sectionSpacing}x</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="12" 
                    step="0.5"
                    value={config.visuals.sectionSpacing}
                    onChange={(e) => handleVisualChange('sectionSpacing', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-gray-500 mt-2">Adjusting this slider moves the separator lines up or down by changing padding.</p>
             </div>

             {/* Font Scale Control */}
             <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                    <label className="font-semibold text-gray-800 flex items-center">
                        <Type className="w-4 h-4 mr-2 text-gray-500" />
                        Content Font Size
                    </label>
                    <span className="text-sm text-gray-500 font-mono">{Math.round(config.visuals.fontScale * 100)}%</span>
                </div>
                <input 
                    type="range" 
                    min="0.7" 
                    max="1.3" 
                    step="0.05"
                    value={config.visuals.fontScale}
                    onChange={(e) => handleVisualChange('fontScale', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-gray-500 mt-2">Scales all text inside the tag. Use this to fit more content or make text larger.</p>
             </div>

             {/* Line Styles */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Line Type</label>
                    <select 
                        value={config.visuals.separatorStyle}
                        onChange={(e) => handleVisualChange('separatorStyle', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="dashed">Dashed</option>
                        <option value="solid">Solid</option>
                        <option value="dotted">Dotted</option>
                        <option value="none">None</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Line Thickness</label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="range" 
                            min="1" 
                            max="6" 
                            value={config.visuals.separatorThickness}
                            onChange={(e) => handleVisualChange('separatorThickness', parseInt(e.target.value))}
                            className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-sm font-mono w-8">{config.visuals.separatorThickness}px</span>
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