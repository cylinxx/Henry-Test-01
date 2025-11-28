import React, { useState, useEffect } from 'react';
import { SkuType, SkuTarget } from '../types';
import { X, Check, Users, Layers, AlertTriangle, ArrowRight } from 'lucide-react';

interface SkuSelectorProps {
  target: SkuTarget;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sku: SkuType) => void;
}

const SkuSelector: React.FC<SkuSelectorProps> = ({ target, isOpen, onClose, onConfirm }) => {
  const [step, setStep] = useState<'SELECT' | 'CONFIRM'>('SELECT');
  const [pendingSku, setPendingSku] = useState<SkuType | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('SELECT');
      setPendingSku(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const skuOptions = [
    { type: SkuType.BASE, color: 'bg-gray-600', label: 'Basic monitoring & control' },
    { type: SkuType.PRIME, color: 'bg-cyan-600', label: 'Advanced analytics & remote tools' },
    { type: SkuType.PREMIUM, color: 'bg-yellow-600', label: 'Full suite + AI features' },
  ];

  const getTitle = () => {
    if (step === 'CONFIRM') return 'Confirm Changes';

    switch (target.type) {
      case 'SINGLE': return 'Update Device SKU';
      case 'MULTI': return 'Bulk Update SKU';
      case 'GROUP': return 'Update Group SKU';
      case 'MULTI_GROUP': return 'Update Multiple Groups';
      default: return 'Select SKU';
    }
  };

  const getDescription = () => {
    if (step === 'CONFIRM') return 'Please verify the changes before proceeding.';

    switch (target.type) {
      case 'SINGLE': 
        return <>Update license for <span className="text-cyan-400 font-medium">{target.label}</span></>;
      case 'MULTI': 
        return <>Applying changes to <span className="text-cyan-400 font-medium">{target.count} devices</span></>;
      case 'GROUP':
        return <>Updating all devices in group <span className="text-cyan-400 font-medium">{target.label}</span></>;
      case 'MULTI_GROUP':
        return <>Updating all devices in <span className="text-cyan-400 font-medium">{target.count} groups</span></>;
    }
  };

  const handleSelect = (sku: SkuType) => {
    setPendingSku(sku);
    setStep('CONFIRM');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      {/* Increased width from max-w-md to max-w-lg for approx 15% increase */}
      <div className="bg-[#2b2d31] w-full max-w-lg rounded-xl shadow-2xl border border-gray-700 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-[#1e1f22]">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              {step === 'CONFIRM' && <AlertTriangle size={20} className="text-yellow-500" />}
              {step !== 'CONFIRM' && (target.type === 'GROUP' || target.type === 'MULTI_GROUP' ? <Layers size={20} className="text-cyan-400"/> : null)}
              {getTitle()}
            </h2>
            <p className="text-sm text-gray-400 mt-1">{getDescription()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-7">
          {step === 'SELECT' ? (
            <div className="space-y-3">
              {skuOptions.map((option) => {
                const isSelected = target.currentSku === option.type;
                
                return (
                  <button
                    key={option.type}
                    onClick={() => handleSelect(option.type)}
                    className={`w-full group flex items-center justify-between p-4 rounded-lg border border-gray-700 hover:border-cyan-500/50 hover:bg-gray-700/50 transition-all ${isSelected ? 'bg-gray-700 border-cyan-500 ring-1 ring-cyan-500' : 'bg-[#232428]'}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded text-xs font-bold text-white uppercase min-w-[80px] text-center ${option.type === SkuType.BASE ? 'bg-gray-500' : option.type === SkuType.PRIME ? 'bg-cyan-600' : 'bg-yellow-600'}`}>
                        {option.type}
                      </span>
                      <span className="text-gray-300 text-sm">{option.label}</span>
                    </div>
                    {isSelected && <Check size={18} className="text-cyan-400" />}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
              
              {/* Verification Card */}
              <div className="bg-[#232428] rounded-lg p-6 border border-gray-700 shadow-inner">
                 <div className="flex justify-between items-center mb-5 pb-5 border-b border-gray-700">
                    <span className="text-gray-400 text-sm">Devices Affected</span>
                    <span className="text-white font-medium flex items-center gap-2 text-base">
                      {target.type === 'GROUP' || target.type === 'MULTI_GROUP' ? <Layers size={16} className="text-cyan-400"/> : <Users size={16} className="text-cyan-400"/>}
                      {target.count} Devices
                    </span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Target Plan</span>
                    <div className="flex items-center gap-2">
                      <ArrowRight size={16} className="text-gray-500" />
                      <span className={`px-3 py-1 rounded text-xs font-bold text-white uppercase ${pendingSku === SkuType.BASE ? 'bg-gray-500' : pendingSku === SkuType.PRIME ? 'bg-cyan-600' : 'bg-yellow-600'}`}>
                          {pendingSku}
                      </span>
                    </div>
                 </div>
              </div>

              {/* Message */}
              <div className="text-sm text-gray-300 bg-cyan-950/20 border border-cyan-900/30 p-5 rounded-lg flex gap-3 items-start">
                <AlertTriangle size={20} className="text-cyan-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Confirm that you want to update <strong>{target.count} devices</strong> to the <strong>{pendingSku}</strong> plan?
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setStep('SELECT')} 
                  className="flex-1 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors font-medium text-sm"
                >
                  Back
                </button>
                <button 
                  onClick={() => onConfirm(pendingSku!)} 
                  className="flex-1 py-3 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 transition-all text-sm"
                >
                  Confirm Update
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'SELECT' && (
          <div className="p-4 bg-[#1e1f22] text-xs text-gray-500 text-center border-t border-gray-700 flex justify-between items-center px-6">
             <span>Changes apply immediately.</span>
             {target.count > 1 && (
               <span className="flex items-center gap-1 text-cyan-500 bg-cyan-950/30 px-2 py-0.5 rounded">
                 <Users size={12}/> {target.count} items targeted
               </span>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkuSelector;