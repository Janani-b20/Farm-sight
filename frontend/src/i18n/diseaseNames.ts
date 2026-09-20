import { Language } from '../types';

/*
  FarmSight disease display-name localization.

  IMPORTANT:
  - Backend/model disease IDs remain in English.
  - Only farmer-facing display names are translated.
  - This prevents translations from breaking API/model logic.
*/

const diseaseNames: Record<
  string,
  Record<Language, string>
> = {
  // =====================================================
  // PADDY
  // =====================================================

  bacterial_leaf_blight: {
    en: 'Bacterial Leaf Blight',
    ta: 'பாக்டீரியா இலைக் கருகல் நோய்',
    hi: 'बैक्टीरियल लीफ ब्लाइट',
  },

  bacterial_leaf_streak: {
    en: 'Bacterial Leaf Streak',
    ta: 'பாக்டீரியா இலைக் கோடு நோய்',
    hi: 'बैक्टीरियल लीफ स्ट्रीक',
  },

  bacterial_panicle_blight: {
    en: 'Bacterial Panicle Blight',
    ta: 'பாக்டீரியா கதிர் கருகல் நோய்',
    hi: 'बैक्टीरियल पैनिकल ब्लाइट',
  },

  blast: {
    en: 'Blast',
    ta: 'நெல் குலை நோய்',
    hi: 'ब्लास्ट रोग',
  },

  brown_spot: {
    en: 'Brown Spot',
    ta: 'பழுப்பு இலைப்புள்ளி நோய்',
    hi: 'भूरा धब्बा रोग',
  },

  dead_heart: {
    en: 'Dead Heart',
    ta: 'குருத்து உலர்தல் பாதிப்பு',
    hi: 'डेड हार्ट',
  },

  downy_mildew: {
    en: 'Downy Mildew',
    ta: 'டவுனி மில்டியூ நோய்',
    hi: 'डाउनी मिल्ड्यू',
  },

  hispa: {
    en: 'Hispa',
    ta: 'ஹிஸ்பா பூச்சி தாக்குதல்',
    hi: 'हिस्पा कीट प्रकोप',
  },

  tungro: {
    en: 'Tungro',
    ta: 'துங்ரோ நோய்',
    hi: 'टंग्रो रोग',
  },

  // =====================================================
  // COTTON
  // =====================================================

  alternaria_leaf_spot: {
    en: 'Alternaria Leaf Spot',
    ta: 'ஆல்டர்னேரியா இலைப்புள்ளி நோய்',
    hi: 'अल्टरनेरिया पत्ती धब्बा',
  },

  bacterial_blight: {
    en: 'Bacterial Blight',
    ta: 'பாக்டீரியா கருகல் நோய்',
    hi: 'बैक्टीरियल ब्लाइट',
  },

  fusarium_wilt: {
    en: 'Fusarium Wilt',
    ta: 'ஃப்யூசேரியம் வாடல் நோய்',
    hi: 'फ्यूजेरियम विल्ट',
  },

  verticillium_wilt: {
    en: 'Verticillium Wilt',
    ta: 'வெர்டிசில்லியம் வாடல் நோய்',
    hi: 'वर्टिसिलियम विल्ट',
  },

  // =====================================================
  // GROUNDNUT
  // =====================================================

  early_leaf_spot: {
    en: 'Early Leaf Spot',
    ta: 'ஆரம்ப இலைப்புள்ளி நோய்',
    hi: 'प्रारंभिक पत्ती धब्बा',
  },

  late_leaf_spot: {
    en: 'Late Leaf Spot',
    ta: 'தாமத இலைப்புள்ளி நோய்',
    hi: 'देर से पत्ती धब्बा',
  },

  rust: {
    en: 'Rust',
    ta: 'துரு நோய்',
    hi: 'रतुआ रोग',
  },

  nutrition_deficiency: {
    en: 'Nutrition Deficiency',
    ta: 'ஊட்டச்சத்து குறைபாடு',
    hi: 'पोषक तत्वों की कमी',
  },

  // =====================================================
  // HEALTHY / NORMAL
  // =====================================================

  normal: {
    en: 'Healthy Crop',
    ta: 'ஆரோக்கியமான பயிர்',
    hi: 'स्वस्थ फसल',
  },

  healthy: {
    en: 'Healthy Crop',
    ta: 'ஆரோக்கியமான பயிர்',
    hi: 'स्वस्थ फसल',
  },

  healthy_leaf: {
    en: 'Healthy Leaf',
    ta: 'ஆரோக்கியமான இலை',
    hi: 'स्वस्थ पत्ती',
  },

  // =====================================================
  // UNCERTAIN
  // =====================================================

  uncertain: {
    en: 'Uncertain',
    ta: 'தெளிவாக கண்டறிய முடியவில்லை',
    hi: 'स्पष्ट रूप से पहचान नहीं हो सकी',
  },
};


/*
  Converts whatever disease ID comes from the backend
  into a stable lookup key.

  Examples:

  "rust_1"             -> "rust"
  "Healthy Leaf"       -> "healthy_leaf"
  "bacterial_blight"   -> "bacterial_blight"
  "Early Leaf Spot"    -> "early_leaf_spot"
*/
const normalizeDiseaseKey = (
  disease: string
): string => {
  return disease
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_1$/, '');
};


/*
  Returns the farmer-facing disease name.

  If a new/unmapped disease is returned in the future,
  FarmSight will safely display a readable English version
  instead of crashing.
*/
export const getDiseaseName = (
  disease: string | undefined | null,
  language: Language
): string => {
  if (!disease) {
    return '';
  }

  const key = normalizeDiseaseKey(disease);

  const translation = diseaseNames[key];

  if (translation) {
    return translation[language];
  }

  // Safe fallback for unknown/new backend labels
  return disease
    .replace(/_1$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};