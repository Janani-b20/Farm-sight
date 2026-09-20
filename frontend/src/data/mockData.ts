import { AnalysisResponse, MarketAnalysisResponse, WhatIfResponse, WeatherData, CropId, Language } from '../types';
import paddyImg from '../assets/crops/paddy.jpg';
import cottonImg from '../assets/crops/cotton.jpg';
import groundnutImg from '../assets/crops/groundnut.jpg';

export interface CropOption {
  id: CropId;
  nameKey: 'paddy' | 'cotton' | 'groundnut';
  image: string;
  scientificName: string;
}

export const CROP_OPTIONS: CropOption[] = [
  {
    id: 'paddy',
    nameKey: 'paddy',
    image: paddyImg,
    scientificName: 'Oryza sativa',
  },
  {
    id: 'cotton',
    nameKey: 'cotton',
    image: cottonImg,
    scientificName: 'Gossypium hirsutum',
  },
  {
    id: 'groundnut',
    nameKey: 'groundnut',
    image: groundnutImg,
    scientificName: 'Arachis hypogaea',
  },
];

/**
 * Mock Backend Analysis Responses aligned with FastAPI `AnalysisResponse` schema.
 * Provides localized dynamic responses for Paddy, Cotton, Groundnut, Healthy, and Uncertain states.
 */
export const MOCK_DIAGNOSIS_RESPONSES: Record<CropId, Record<Language, AnalysisResponse>> = {
  paddy: {
    en: {
      status: 'disease_detected',
      crop: 'paddy',
      disease: 'Blast Disease (Magnaporthe oryzae)',
      confidence: 96.4,
      why_this_happening: [
        'High air humidity (over 85%) and recent light rainfall.',
        'Excess nitrogen fertilizer application.',
        'Spore spread carried by light morning wind.',
      ],
      what_to_do_now: [
        'Avoid applying any additional nitrogen fertilizer immediately.',
        'Ensure proper field water drainage during cloudy periods.',
        'Inspect surrounding tiller leaves for spindly spindle-shaped lesions.',
      ],
      treatment: [
        'Spray Tricyclazole 75% WP @ 0.6 g/L of water OR Carbendazim 50% WP @ 1 g/L.',
        'Perform foliar spray during early morning or late afternoon when wind is low.',
        'Repeat spray after 10-12 days if rainy conditions persist.',
      ],
      weather_warning: 'High humidity forecasted for the next 48 hours will accelerate spore germination.',
      sources: [
        { title: 'TNAU Agritech Portal - Rice Blast Management', url: 'https://agritech.tnau.ac.in' },
        { title: 'ICAR-NRRI Paddy Advisory', url: 'https://icar-nrri.in' },
      ],
      show_whatif: true,
    },
    ta: {
      status: 'disease_detected',
      crop: 'paddy',
      disease: 'நெல் குலை நோய் (Paddy Leaf Blast)',
      confidence: 96.4,
      why_this_happening: [
        'அதிக காற்றின் ஈரப்பதம் (85% மேல்) மற்றும் தொடர் மேகமூட்டம்.',
        'தேவைக்கு அதிகமாக தழைச்சத்து (நைட்ரஜன்) உரம் இடுதல்.',
        'காலை நேரக் காற்றில் நோய் வித்திகள் பரவுதல்.',
      ],
      what_to_do_now: [
        'உடனடியாக நைட்ரஜன் உரம் இடுவதை நிறுத்தவும்.',
        'வயலில் நீர் தேங்காமல் சீரான வடிகால் வசதி செய்ய வேண்டும்.',
        'பாதிக்கப்பட்ட இலைகளை அகற்றி வயலுக்கு வெளியே அழிக்கவும்.',
      ],
      treatment: [
        'டிரைசைக்ளசோல் 75% WP மருந்தை ஒரு லிட்டர் தண்ணீருக்கு 0.6 கிராம் என்ற அளவில் தெளிக்கவும்.',
        'காலை 7-10 மணிக்குள் அல்லது மாலை வேளையில் தெளிக்க வேண்டும்.',
        'மழை தொடர்ந்தால் 10-12 நாட்கள் கழித்து மீண்டும் தெளிக்கவும்.',
      ],
      weather_warning: 'அடுத்த 48 மணிநேரத்திற்கு மழை மற்றும் ஈரப்பதம் தொடரும் என்பதால் வித்திகள் வேகமாக்கப்படும்.',
      sources: [
        { title: 'தமிழ்நாடு வேளாண்மைப் பல்கலைக்கழக வழிகாட்டி', url: 'https://agritech.tnau.ac.in' },
      ],
      show_whatif: true,
    },
    hi: {
      status: 'disease_detected',
      crop: 'paddy',
      disease: 'धान का झुलसा रोग (Paddy Blast)',
      confidence: 96.4,
      why_this_happening: [
        'हवा में अत्यधिक नमी (85% से अधिक) और हल्की बारिश।',
        'नाइट्रोजन उर्वरक का अत्यधिक उपयोग।',
        'सुबह की हवा से रोग के बीजाणुओं का प्रसार।',
      ],
      what_to_do_now: [
        'तुरंत नाइट्रोजन खाद देना बंद करें।',
        'खेत में पानी का सही जल निकासी प्रबंधन सुनिश्चित करें।',
        'रोगग्रस्त पत्तियों की निगरानी करें।',
      ],
      treatment: [
        'ट्राइसाइक्लाज़ोल 75% WP की 0.6 ग्राम प्रति लीटर पानी में मिलाकर छिड़काव करें।',
        'सुबह या देर शाम के समय छिड़काव करें।',
        'बारिश रहने पर 10-12 दिनों के बाद दोबारा छिड़काव करें।',
      ],
      weather_warning: 'अगले 48 घंटों में उच्च आर्द्रता से बीमारी बढ़ने की संभावना है।',
      sources: [
        { title: 'भाकृअनुप - राष्ट्रीय चावल अनुसंधान संस्थान', url: 'https://icar-nrri.in' },
      ],
      show_whatif: true,
    },
  },
  cotton: {
    en: {
      status: 'disease_detected',
      crop: 'cotton',
      disease: 'Bacterial Blight (Xanthomonas citri)',
      confidence: 93.8,
      why_this_happening: [
        'Frequent rain splashes transferring bacteria between leaves.',
        'Warm temperatures with high humidity.',
      ],
      what_to_do_now: [
        'Avoid overhead sprinkler irrigation.',
        'Remove heavily infected lower leaves and burn them safely.',
      ],
      treatment: [
        'Spray Copper Oxychloride 50% WP @ 2.5 g/L + Streptocycline @ 0.1 g/L.',
        'Apply on both upper and lower leaf surfaces.',
      ],
      weather_warning: 'Expected rain tomorrow may wash away unabsorbed foliar sprays.',
      sources: [{ title: 'CICR Nagpur Cotton Advisory', url: 'https://cicr.org.in' }],
      show_whatif: true,
    },
    ta: {
      status: 'disease_detected',
      crop: 'cotton',
      disease: 'பருத்தி பாக்டீரியல் கருகல் நோய் (Bacterial Blight)',
      confidence: 93.8,
      why_this_happening: [
        'மழைத் துளிகள் மூலம் பாக்டீரியா இலைகளுக்கு பரவுவது.',
        'வெப்பமான காலநிலை மற்றும் அதிக ஈரப்பதம்.',
      ],
      what_to_do_now: [
        'மேல் தெளிப்பு நீர்ப்பாசனத்தைத் தவிர்க்கவும்.',
        'கடும் பாதிப்புற்ற இலைகளை அகற்றி எரிக்கவும்.',
      ],
      treatment: [
        'கப்பர் ஆக்சிகுளோரைடு 2.5 கிராம் + ஸ்ட்ரெப்டோசைக்ளின் 0.1 கிராம் ஒரு லிட்டர் தண்ணீரில் கலந்து தெளிக்கவும்.',
      ],
      weather_warning: 'நாளை மழை பெய்யக்கூடும் என்பதால் தெளித்த மருந்து அடித்துச் செல்லப்படலாம்.',
      sources: [{ title: 'பருத்தி ஆராய்ச்சி நிறுவனம்', url: 'https://cicr.org.in' }],
      show_whatif: true,
    },
    hi: {
      status: 'disease_detected',
      crop: 'cotton',
      disease: 'कपास का जीवाणु झुलसा (Bacterial Blight)',
      confidence: 93.8,
      why_this_happening: [
        'बारिश की बूंदों से जीवाणुओं का फैलाव।',
        'गर्म वातावरण और हवा में नमी।',
      ],
      what_to_do_now: [
        'ऊपर से पानी का छिड़काव न करें।',
        'संक्रमित पत्तियों को निकालकर नष्ट करें।',
      ],
      treatment: [
        'कॉपर ऑक्सीक्लोराइड 2.5 ग्राम + स्ट्रेप्टोसाइक्लिन 0.1 ग्राम प्रति लीटर पानी में मिलाकर छिड़काव करें।',
      ],
      weather_warning: 'कल बारिश की संभावना से छिड़काव प्रभावित हो सकता है।',
      sources: [{ title: 'केंद्रीय कपास अनुसंधान संस्थान', url: 'https://cicr.org.in' }],
      show_whatif: true,
    },
  },
  groundnut: {
    en: {
      status: 'disease_detected',
      crop: 'groundnut',
      disease: 'Tikka Leaf Spot (Cercospora arachidicola)',
      confidence: 91.2,
      why_this_happening: [
        'Extended leaf wetness due to heavy dew.',
        'Continuous monocropping without rotation.',
      ],
      what_to_do_now: [
        'Maintain proper crop spacing to enhance airflow.',
        'Remove weeds surrounding the field borders.',
      ],
      treatment: [
        'Spray Mancozeb 75% WP @ 2 g/L OR Hexaconazole 5% EC @ 1 ml/L.',
      ],
      weather_warning: 'Morning fog will increase leaf wetness duration.',
      sources: [{ title: 'ICAR Directorate of Groundnut Research', url: 'https://dgr.icar.gov.in' }],
      show_whatif: true,
    },
    ta: {
      status: 'disease_detected',
      crop: 'groundnut',
      disease: 'நிலக்கடலை டிக்கா இலைப்புள்ளி நோய் (Tikka Leaf Spot)',
      confidence: 91.2,
      why_this_happening: [
        'பனியின் காரணமாக இலைகளில் நீண்ட நேரம் நீர் தங்குவது.',
        'தொடர்ச்சியாக ஒரே பயிர் சாகுபடி செய்வது.',
      ],
      what_to_do_now: [
        'பயிர்களுக்கு இடையே நல்ல காற்று ஓட்டம் இருக்க இடைவெளி பராமரிக்கவும்.',
        'வயலைச் சுற்றியுள்ள களைகளை அகற்றவும்.',
      ],
      treatment: [
        'மேன்கோசெப் 75% WP 2 கிராம் அல்லது ஹெக்சாகோனசோல் 1 மில்லி ஒரு லிட்டர் தண்ணீரில் தெளிக்கவும்.',
      ],
      weather_warning: 'அதிகாலை பனிமூட்டம் இலை ஈரப்பதத்தை அதிகரிக்கும்.',
      sources: [{ title: 'நிலக்கடலை ஆராய்ச்சி மையம்', url: 'https://dgr.icar.gov.in' }],
      show_whatif: true,
    },
    hi: {
      status: 'disease_detected',
      crop: 'groundnut',
      disease: 'मूंगफली का टिक्का रोग (Tikka Leaf Spot)',
      confidence: 91.2,
      why_this_happening: [
        'ओस के कारण पत्तियों पर लंबे समय तक नमी बने रहना।',
      ],
      what_to_do_now: [
        'फसल के बीच हवा के आवागमन के लिए जगह रखें।',
        'खरपतवार हटाएं।',
      ],
      treatment: [
        'मैनकोज़ेब 2 ग्राम या हेक्साकोनाज़ोल 1 मिली प्रति लीटर पानी में मिलाकर छिड़कें।',
      ],
      weather_warning: 'सुबह का कोहरा पत्तियों पर नमी बढ़ाएगा।',
      sources: [{ title: 'मूंगफली अनुसंधान निदेशालय', url: 'https://dgr.icar.gov.in' }],
      show_whatif: true,
    },
  },
};

export const MOCK_HEALTHY_RESPONSE: Record<Language, AnalysisResponse> = {
  en: {
    status: 'normal',
    analysis: 'The uploaded crop leaf shows no signs of fungal or bacterial infection. Leaves are lush green with healthy vein structure.',
    crop: 'paddy',
    confidence: 98.9,
    show_whatif: false,
  },
  ta: {
    status: 'normal',
    analysis: 'பதிவேற்றப்பட்ட பயிர் இலையில் எந்தவித நோய்த்தொற்று அறிகுறிகளும் இல்லை. இலைகள் ஆரோக்கியமான பச்சை நிறத்தில் உள்ளன.',
    crop: 'paddy',
    confidence: 98.9,
    show_whatif: false,
  },
  hi: {
    status: 'normal',
    analysis: 'अपलोड की गई पत्ती पूरी तरह से स्वस्थ दिखाई दे रही है। इसमें किसी भी प्रकार का रोग नहीं पाया गया है।',
    crop: 'paddy',
    confidence: 98.9,
    show_whatif: false,
  },
};

export const MOCK_UNCERTAIN_RESPONSE: Record<Language, AnalysisResponse> = {
  en: {
    status: 'uncertain',
    analysis: 'Image resolution or lighting is unclear. Unable to determine disease presence with high confidence.',
    show_whatif: false,
  },
  ta: {
    status: 'uncertain',
    analysis: 'படம் தெளிவாக இல்லை அல்லது வெளிச்சம் குறைவாக உள்ளது. நோய் பாதிப்பைத் துல்லியமாகக் கணக்கிட முடியவில்லை.',
    show_whatif: false,
  },
  hi: {
    status: 'uncertain',
    analysis: 'तस्वीर स्पष्ट नहीं है। कृपया अच्छी रोशनी में प्रभावित पत्ते की तस्वीर फिर से खींचें।',
    show_whatif: false,
  },
};

/**
 * Weather Intelligence mock data.
 */
export const MOCK_WEATHER_DATA: Record<Language, WeatherData> = {
  en: {
    temperature: 29,
    humidity: 82,
    rainProbability: 65,
    windSpeed: 14,
    condition: 'Light Rain & Overcast',
    farmingImpact: 'High humidity & rain probability mean spraying chemicals today is risky. Chemicals may wash away within 3 hours.',
    weatherRisk: 'Medium',
  },
  ta: {
    temperature: 29,
    humidity: 82,
    rainProbability: 65,
    windSpeed: 14,
    condition: 'ஹல்சா மழை & மேகமூட்டம்',
    farmingImpact: 'அதிக ஈரப்பதம் மற்றும் 65% மழை வாய்ப்பு உள்ளதால் இன்று மருந்து தெளிப்பது பலனளிக்காது. மழை நீரால் மருந்து அடித்துச் செல்லப்படலாம்.',
    weatherRisk: 'Medium',
  },
  hi: {
    temperature: 29,
    humidity: 82,
    rainProbability: 65,
    windSpeed: 14,
    condition: 'हल्की बारिश और बादल',
    farmingImpact: 'हवा में नमी और 65% बारिश की संभावना के कारण आज दवा का छिड़काव जोखिम भरा है। बारिश में दवा बह सकती है।',
    weatherRisk: 'Medium',
  },
};

/**
 * What-If Simulation Mock Responses aligned with `whatif_module/service.py`.
 */
export const MOCK_WHATIF_SCENARIOS: Record<string, Record<Language, WhatIfResponse>> = {
  treat_now: {
    en: {
      status: 'success',
      simulation: {
        recommended_action: 'Treat Now (Foliar Spray)',
        decision_risk: 'High',
        weather_context: 'Light rain expected in 3 hours (65% chance).',
        estimated_yield_loss_reduction: '40% protection',
        cost_impact: 'High risk of product waste due to rain wash-off (~₹1,200 loss).',
      },
      advisory_text: 'Spraying immediately carries high rain wash-off risk. 65% chance of rainfall within 3 hours will diminish chemical efficacy.',
      show_whatif: true,
    },
    ta: {
      status: 'success',
      simulation: {
        recommended_action: 'இப்போதே மருந்து தெளித்தல்',
        decision_risk: 'High',
        weather_context: 'அடுத்த 3 மணிநேரத்தில் 65% மழை பெய்ய வாய்ப்புள்ளது.',
        estimated_yield_loss_reduction: '40% பாதுகாப்பு மட்டுமே',
        cost_impact: 'மழையால் மருந்து வீணாகக் கூடும் (சுமார் ₹1,200 இழப்பு).',
      },
      advisory_text: 'இப்போது மருந்து தெளிப்பது அதிக அபாயகரமானது. 3 மணி நேரத்தில் மழை பெய்தால் தெளித்த மருந்து வீணாகிவிடும்.',
      show_whatif: true,
    },
    hi: {
      status: 'success',
      simulation: {
        recommended_action: 'अभी छिड़काव करें',
        decision_risk: 'High',
        weather_context: 'अगले 3 घंटों में 65% बारिश की संभावना।',
        estimated_yield_loss_reduction: '40% सुरक्षा',
        cost_impact: 'बारिश के कारण दवा बह जाने का जोखिम (~₹1,200 का नुकसान)।',
      },
      advisory_text: 'अभी छिड़काव करना जोखिम भरा है। अगले 3 घंटों में बारिश की संभावना दवा के असर को कम कर सकती है।',
      show_whatif: true,
    },
  },
  wait_weather: {
    en: {
      status: 'success',
      simulation: {
        recommended_action: 'Wait for Clear Weather (Recommended)',
        decision_risk: 'Low',
        weather_context: 'Clear sunny sky expected in 24 hours with wind under 8 km/h.',
        estimated_yield_loss_reduction: '85% protection',
        cost_impact: 'Optimal efficacy. Saves input cost and maximizes absorption.',
      },
      advisory_text: 'Waiting 24 hours for clear weather will maximize spray absorption and prevent rain wash-off.',
      show_whatif: true,
    },
    ta: {
      status: 'success',
      simulation: {
        recommended_action: 'வானிலை சீராகும் வரை காத்திருக்கவும் (பரிந்துரைக்கப்படுகிறது)',
        decision_risk: 'Low',
        weather_context: 'நாளை தெளிவான வெயிலும் குறைந்த காற்றும் (8 கி.மீ/மணி) இருக்கும்.',
        estimated_yield_loss_reduction: '85% வரை பாதுகாப்பு',
        cost_impact: 'மருந்து முழுமையாக பயிரால் உறிஞ்சப்படும். பண வீணடிப்பு தவிர்க்கப்படும்.',
      },
      advisory_text: '24 மணிநேரம் காத்திருந்து தெளிவான வானிலையில் மருந்து தெளிப்பது 85% வரை நோயைக் கட்டுப்படுத்தும்.',
      show_whatif: true,
    },
    hi: {
      status: 'success',
      simulation: {
        recommended_action: 'मौसम साफ होने का इंतजार करें (अनुशंसित)',
        decision_risk: 'Low',
        weather_context: '24 घंटे बाद धूप और शांत हवा (8 किमी/घंटा) की संभावना।',
        estimated_yield_loss_reduction: '85% सुरक्षा',
        cost_impact: 'दवा का पूरा असर होगा और पैसे की बचत होगी।',
      },
      advisory_text: '24 घंटे बाद साफ मौसम में छिड़काव करना सबसे अच्छा निर्णय है। इससे दवा का पूरा असर मिलेगा।',
      show_whatif: true,
    },
  },
  bio_control: {
    en: {
      status: 'success',
      simulation: {
        recommended_action: 'Apply Bio-Control (Pseudomonas fluorescens)',
        decision_risk: 'Medium',
        weather_context: 'Humid conditions favor bio-agent spore survival.',
        estimated_yield_loss_reduction: '65% protection',
        cost_impact: 'Eco-friendly and low cost (~₹400 per acre).',
      },
      advisory_text: 'Bio-control treatment benefits from humid weather and prevents chemical residue in soil.',
      show_whatif: true,
    },
    ta: {
      status: 'success',
      simulation: {
        recommended_action: 'உயிரியல் கட்டுப்பாடு (சூடோமோனாஸ் தெளித்தல்)',
        decision_risk: 'Medium',
        weather_context: 'ஈரப்பதமான வானிலை உயிரியல் நுண்ணுயிரிகளுக்கு ஏற்றது.',
        estimated_yield_loss_reduction: '65% பாதுகாப்பு',
        cost_impact: 'குறைந்த செலவு மற்றும் சுற்றுக்சூழல் பாதுகாப்பு (ஏக்கருக்கு ₹400).',
      },
      advisory_text: 'ஈரப்பதமான வானிலையில் சூடோமோனாஸ் தெளிப்பது இயற்கையான முறையில் நோயைக் கட்டுப்படுத்தும்.',
      show_whatif: true,
    },
    hi: {
      status: 'success',
      simulation: {
        recommended_action: 'जैविक नियंत्रण (स्यूडोमोनास का उपयोग)',
        decision_risk: 'Medium',
        weather_context: 'नमी वाला मौसम जैविक एजेंट के लिए उपयुक्त है।',
        estimated_yield_loss_reduction: '65% सुरक्षा',
        cost_impact: 'पर्यावरण के अनुकूल और कम लागत (₹400 प्रति एकड़)।',
      },
      advisory_text: 'जैविक उपचार से मिट्टी की उर्वरता बनी रहती है और बीमारी पर प्रभावी नियंत्रण होता है।',
      show_whatif: true,
    },
  },
  monitor_first: {
    en: {
      status: 'success',
      simulation: {
        recommended_action: 'Monitor Field Daily for 48h',
        decision_risk: 'Medium',
        weather_context: 'Temperature fluctuation may suppress fungal spread naturally.',
        estimated_yield_loss_reduction: '50% protection',
        cost_impact: 'Zero immediate cost.',
      },
      advisory_text: 'If lesion count is low, monitoring for 2 days allows natural temperature increases to restrict pathogen spread.',
      show_whatif: true,
    },
    ta: {
      status: 'success',
      simulation: {
        recommended_action: '48 மணிநேரம் பயிரை மட்டும் கண்காணிக்கவும்',
        decision_risk: 'Medium',
        weather_context: 'வெப்பநிலை உயர்வு நோய்ப் பரவலை இயற்கையாகவே குறைக்கும்.',
        estimated_yield_loss_reduction: '50% பாதுகாப்பு',
        cost_impact: 'உடனடி செலவு எதுவும் இல்லை.',
      },
      advisory_text: 'பாதிப்பு குறைவாக இருந்தால் 2 நாட்கள் கண்காணிப்பது சிறந்தது. வெப்பநிலை உயரும்போது நோய் கட்டுப்படும்.',
      show_whatif: true,
    },
    hi: {
      status: 'success',
      simulation: {
        recommended_action: '48 घंटे तक निगरानी करें',
        decision_risk: 'Medium',
        weather_context: 'तापमान बढ़ने से बीमारी का फैलाव प्राकृतिक रूप से रुक सकता है।',
        estimated_yield_loss_reduction: '50% सुरक्षा',
        cost_impact: 'कोई तत्काल लागत नहीं।',
      },
      advisory_text: 'यदि लक्षण कम हैं तो 2 दिन निगरानी करें। बढ़ते तापमान से बीमारी खुद रुक सकती है।',
      show_whatif: true,
    },
  },
};

/**
 * Market Intelligence mock data aligned with backend `/api/market` & `/api/transport`.
 */
export interface MandiOption {
  name: string;
  district: string;
  distanceKm: number;
  modalPrice: number; // ₹/quintal
  transportRatePerKmKg: number; // ₹/km/kg
}

export const MANDI_OPTIONS: Record<CropId, MandiOption[]> = {
  paddy: [
    { name: 'Madurai Mandi', district: 'Madurai', distanceKm: 18, modalPrice: 2450, transportRatePerKmKg: 0.08 },
    { name: 'Dindigul Market', district: 'Dindigul', distanceKm: 42, modalPrice: 2620, transportRatePerKmKg: 0.07 },
    { name: 'Thanjavur Grain Market', district: 'Thanjavur', distanceKm: 95, modalPrice: 2750, transportRatePerKmKg: 0.06 },
  ],
  cotton: [
    { name: 'Rajapalayam Cotton Market', district: 'Virudhunagar', distanceKm: 35, modalPrice: 7100, transportRatePerKmKg: 0.09 },
    { name: 'Coimbatore Mandi', district: 'Coimbatore', distanceKm: 110, modalPrice: 7450, transportRatePerKmKg: 0.07 },
  ],
  groundnut: [
    { name: 'Pollachi Oilseed Mandi', district: 'Coimbatore', distanceKm: 55, modalPrice: 6500, transportRatePerKmKg: 0.08 },
    { name: 'Tindivanam Market', district: 'Villupuram', distanceKm: 140, modalPrice: 6850, transportRatePerKmKg: 0.06 },
  ],
};

export const calculateMarketMetrics = (
  crop: CropId,
  mandiIndex: number,
  quantityKg: number
): MarketAnalysisResponse => {
  const options = MANDI_OPTIONS[crop] || MANDI_OPTIONS.paddy;
  const selectedMandi = options[mandiIndex] || options[0];

  const quintals = quantityKg / 100;
  const grossRevenue = Math.round(quintals * selectedMandi.modalPrice);
  const transportCost = Math.round(selectedMandi.distanceKm * quantityKg * selectedMandi.transportRatePerKmKg);
  const estimatedNetValue = grossRevenue - transportCost;

  return {
    commodity: crop,
    state: 'Tamil Nadu',
    district: selectedMandi.district,
    market: selectedMandi.name,
    modal_price: selectedMandi.modalPrice,
    best_mandi: selectedMandi.name,
    distance_km: selectedMandi.distanceKm,
    quantity_kg: quantityKg,
    gross_revenue: grossRevenue,
    transport_cost: transportCost,
    estimated_net_value: estimatedNetValue,
  };
};
