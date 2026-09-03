import { CropId, Language } from '../types';

const cropNames: Record<
  Language,
  Record<CropId, string>
> = {
  en: {
    paddy: 'Paddy',
    cotton: 'Cotton',
    groundnut: 'Groundnut',
  },

  ta: {
    paddy: 'நெல்',
    cotton: 'பருத்தி',
    groundnut: 'நிலக்கடலை',
  },

  hi: {
    paddy: 'धान',
    cotton: 'कपास',
    groundnut: 'मूंगफली',
  },
};

export const getCropName = (
  crop: CropId,
  language: Language
): string => {
  return (
    cropNames[language]?.[crop] ||
    cropNames.en[crop] ||
    crop
  );
};