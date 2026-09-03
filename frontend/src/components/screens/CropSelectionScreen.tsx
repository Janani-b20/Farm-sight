import React from 'react';
import { Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../i18n/translations';
import { CROP_OPTIONS } from '../../data/mockData';
import { CropId } from '../../types';

interface CropSelectionProps {
  onSelectCrop?: (crop: CropId) => void;
}

export const CropSelectionScreen: React.FC<CropSelectionProps> = ({ onSelectCrop }) => {
  const { selectedCrop, setSelectedCrop, language } = useApp();
  const t = translations[language];

  const handleSelect = (cropId: CropId) => {
    setSelectedCrop(cropId);
    if (onSelectCrop) onSelectCrop(cropId);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-sage-800 uppercase tracking-wide">
        {t.selectCropPrompt}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {CROP_OPTIONS.map((crop) => {
          const isSelected = selectedCrop === crop.id;
          return (
            <button
              key={crop.id}
              onClick={() => handleSelect(crop.id)}
              type="button"
              className={`relative overflow-hidden rounded-3xl p-3 text-left transition-all border flex flex-col items-center text-center ${
                isSelected
                  ? 'border-sage-600 bg-sage-50 ring-2 ring-sage-500/20 shadow-md scale-102'
                  : 'border-gray-200 bg-white hover:border-sage-200 shadow-xs'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sage-600 text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
              <div className="w-14 h-14 rounded-2xl overflow-hidden mb-2 bg-gray-100 shadow-inner">
                <img
                  src={crop.image}
                  alt={t[crop.nameKey]}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs font-bold text-sage-800">{t[crop.nameKey]}</p>
              <p className="text-[10px] text-gray-400 italic font-medium">{crop.scientificName}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
