export type AppLanguage = 'en' | 'ta' | 'hi';

export const translations = {
  // =========================================================
  // ENGLISH
  // =========================================================
  en: {
    appTitle: 'FarmSight',
    appSubtitle: 'Smart Farmer Assistant',

    selectLanguage: 'Select Language',
    welcomeHeading: 'Welcome to FarmSight',
    welcomeTagline:
      'Simple, smart crop disease detection & weather-smart decisions for your farm.',
    getStarted: 'Get Started',

    // Navigation
    navHome: 'Home',
    navDiagnose: 'Diagnose',
    navWeather: 'Weather',
    navMarket: 'Market',
    navWhatIf: 'What-If',
    navProfile: 'Profile',

    // =====================================================
    // HOME
    // =====================================================
    checkCropHeroTitle: 'Check My Crop',
    checkCropHeroSubtitle:
      'Take a photo of diseased leaves or stems for instant diagnosis & treatment advice.',
    startScanButton: 'Scan Crop Now',

    weatherTodayTitle: 'Weather Today',
    marketSummaryTitle: 'Market Today',
    whatIfShortcutTitle: 'What-If Timing Simulator',
    todayInsightTitle: "Today's Insight",
    viewDetails: 'View Details',

    recentSampleDataBadge: 'Recent Sample Data',
    weatherUnavailable: 'Weather temporarily unavailable',
    usingDefaultLocation: 'Using default location',
    useMyLocation: 'Use My Location',
    transportUnavailable: 'Transport estimate unavailable',
    approxDistance: 'Approx. Distance',
    estimatedTransportCost: 'Estimated Transport Cost',
    estimatedGrossValue: 'Estimated Gross Value',
    estimatedNetReturn: 'Estimated Net Return',
    insightHighRain: 'Rain is likely. Consider delaying spraying.',
    insightHighWind: 'Strong wind may increase spray drift risk.',
    insightHighHumidity: 'High humidity may increase disease-favourable conditions.',
    insightSuitable: 'Weather conditions may be suitable for field activity.',

    bestOption: 'Best Option',
    recommendationLabel: 'Recommendation',
    harvestQuantityLabel: 'Harvest Quantity (kg)',
    bestPriceMarket: 'Best Price Market',
    netReturnUnavailable: 'Unavailable until transport distance is known',
    marketRatesTitle: 'Market Rates & Transport Return',
    availableMarkets: 'Available Markets',
    yieldProtection: 'Yield Protection',
    costImpact: 'Cost Impact',
    updatingData: 'Updating...',

    // =====================================================
    // CROPS
    // =====================================================
    cropSelectTitle: 'Select Your Crop',

    paddy: 'Paddy',
    cotton: 'Cotton',
    groundnut: 'Groundnut',

    // =====================================================
    // DIAGNOSIS
    // =====================================================
    diagnoseTitle: 'Crop Diagnosis',
    selectCropPrompt: 'Choose crop to diagnose:',

    uploadPrompt:
      'Take or upload a clear photo of the crop leaf',

    cameraButton: 'Camera',
    galleryButton: 'Gallery',
    reselectPhoto: 'Change Photo',

    analyzeButton: 'Analyze Crop Health',

    analyzingState:
      'Analyzing your crop leaf image...',

    analyzingHint:
      'Checking for fungal, bacterial & pest symptoms',

    resultTitle: 'Diagnosis Result',

    healthyStateTitle: 'Crop is Healthy',

    uncertainStateTitle: 'Image is unclear',

    uncertainHint:
      'Please upload a clearer, well-lit image of the affected leaf.',

    whyHappening: 'Why is this happening?',
    whatToDoNow: 'What to do now?',
    treatmentSteps: 'Recommended Treatment',

    weatherWarning: 'Weather Context',

    checkWhatIfCTA:
      'Check Treatment Timing in What-If',

    sourcesTitle: 'Sources',

    // Image instructions
    betterResultsTitle: 'For better results',

    photoTipLeaf:
      'Keep one affected leaf clearly visible',

    photoTipLighting:
      'Use good lighting',

    photoTipSteady:
      'Keep the camera steady',

    photoTipSymptoms:
      'Make symptoms clearly visible',

    photoTipBlur:
      'Avoid very dark or blurry photos',

    photoTipCrop:
      'Select the correct crop first',

    retryPhotoTitle:
      'Try taking another photo:',

    retryMoveCloser:
      'Move closer to the affected leaf',

    retryGoodLight:
      'Take the photo in good daylight',

    retryAvoidBlur:
      'Avoid blurry or dark images',

    retryShowSymptoms:
      'Keep disease symptoms clearly visible',

    // Errors
    invalidImage:
      'Please select a valid image file.',

    imageTooLarge:
      'Image is too large. Please upload an image smaller than 10 MB.',

    analysisFailed:
      "We couldn't analyze this photo. Please try again.",

    serviceUnavailable:
      'FarmSight disease detection is temporarily unavailable. Please try again.',

    // =====================================================
    // WEATHER
    // =====================================================
    weatherTitle: 'Weather Intelligence',

    temperature: 'Temperature',
    humidity: 'Humidity',
    rainProbability: 'Rain Chance',
    windSpeed: 'Wind Speed',

    farmingImpactCard:
      'Farming Impact & Spray Advice',

    // =====================================================
    // WHAT-IF
    // =====================================================
    whatIfTitle: 'What-If Timing Simulator',

    whatIfSubtitle:
      'Simulate the best action before spending money on treatments.',

    optionTreatNow: 'Treat Now',
    optionWait: 'Wait for Better Weather',
    optionBioControl: 'Use Bio-Control',
    optionMonitor: 'Monitor First',

    decisionRecommendation: 'Recommendation',
    decisionRisk: 'Decision Risk',

    yieldImpactNotice:
      'Yield & Cost Estimate Notice',

    calculationNote:
      'Calculations use local weather forecasts and disease propagation rules.',

    // =====================================================
    // MARKET
    // =====================================================
    marketTitle: 'Market Intelligence',

    currentModalPrice: 'Current Modal Price',

    bestNearbyMandi: 'Best Nearby Mandi',

    distance: 'Distance',

    estimatedQuantity:
      'Harvest Quantity (kg)',

    grossRevenue: 'Estimated Revenue',

    transportCost: 'Transport Cost',

    estimatedNetValue:
      'Estimated Net Value',

    netProfitNotice:
      'Net value is calculated after subtracting transport cost from gross market revenue.',

    minPrice: 'Min Price',
    maxPrice: 'Max Price',
    modalPrice: 'Modal Price',
    arrivalDate: 'Arrival Date',
    variety: 'Variety',
    dataSource: 'Data Source',
    fallbackDataBadge: 'Fallback / Recent Sample Data',
    liveMarketData: 'Live Market Data',
    loadingMarketData: 'Fetching market data...',
    errorMarketData: 'Unable to load market data.',
    emptyMarketData: 'No market records found for this crop & location.',
    retryButton: 'Retry',

    // =====================================================
    // RISK / STATUS
    // =====================================================
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    veryHigh: 'Very High',

    normal: 'Normal',
    safe: 'Safe',
    critical: 'Critical',

    riskLow: 'Low Risk',
    riskMedium: 'Moderate Risk',
    riskHigh: 'High Risk',
    riskVeryHigh: 'Very High Risk',

    lowWeatherRisk: 'Low Weather Risk',
    mediumWeatherRisk: 'Medium Weather Risk',
    highWeatherRisk: 'High Weather Risk',
    veryHighWeatherRisk:
      'Very High Weather Risk',

    // =====================================================
    // AUDIO
    // =====================================================
    listenButton: 'Listen',
    stopButton: 'Stop',
    speaking: 'Speaking...',

    voiceUnavailableTa:
      'Tamil voice is not available on this device.',

    // =====================================================
    // PROFILE
    // =====================================================
    profileTitle: 'Profile & Settings',

    profileSubtitle:
      'Customize your farm app preferences',

    languageSettings: 'App Language',

    locationPreference: 'Farm Location',

    preferredCropSetting: 'Main Crop',

    voiceSettings: 'Voice Speed',

    voiceSpeedNormal: 'Normal (1.0x)',
    voiceSpeedSlow: 'Slow (0.8x)',
    voiceSpeedFast: 'Fast (1.2x)',

    aboutFarmSight: 'About FarmSight',

    aboutText:
      'FarmSight is a mobile-first intelligent agriculture companion designed for farmers.',

    appVersionText:
      'Version 2.0 (Farmer Edition)',

    resetDemoState: 'Reset Demo State',

    // =====================================================
    // DYNAMIC UI
    // =====================================================
    aiConfidence: 'AI Confidence',

    financialBreakdown:
      'Financial Breakdown',

    aiCropDiagnosisTag:
      'AI Crop Diagnosis',

    previewResultState:
      'Preview Result State:',

    bestOptionTag:
      'Best Option',

    liveRateTag:
      'Live Rate',

    perQuintal:
      'per quintal',

    awayText:
      'away',

    netProfitTag:
      'Net Profit',

    todaysTemperature:
      "Today's Temperature",

    weatherRiskTag:
      'Weather Risk',

    // GOVERNMENT SUPPORT & ACTION PLAN
    governmentSupportTitle: 'Government Support',
    yourActionPlanTitle: 'Your Action Plan',
    bestDecision: 'Best Decision',
    weatherCheck: 'Weather Check',
    marketDecision: 'Market Decision',
    governmentSupport: 'Government Support',
    eligibility: 'Eligibility',
    requiredDocuments: 'Required Documents',
    whyRecommended: 'Why Recommended',
    checkOfficialPortal: 'Check Official Portal',
    hideDetails: 'Hide Details',
    immediateAction: 'Immediate Action',
    diseaseStatus: 'Disease Status',

    // CAMERA & ACTION PLAN FALLBACK
    actionPlanFallbackCTA: 'Diagnose your crop to generate a personalized action plan.',
    cameraPermissionDeniedMsg: 'Camera permission was denied. You can upload a photo instead.',
    cameraUnavailableMsg: 'Camera is unavailable on this device. You can upload a photo instead.',
    takePhoto: 'Take Photo',
    initializingCamera: 'Starting camera...',
    cancel: 'Cancel',
  },

  // =========================================================
  // TAMIL
  // =========================================================
  ta: {
    appTitle: 'ஃபார்ம்சைட்',
    appSubtitle: 'விவசாயி நண்பன்',

    selectLanguage:
      'மொழியைத் தேர்ந்தெடுக்கவும்',

    welcomeHeading:
      'ஃபார்ம்சைட் பயன்பாட்டிற்கு நல்வரவு',

    welcomeTagline:
      'பயிர் நோய் கண்டறிதல் மற்றும் வானிலைக்கு ஏற்ற எளிய விவசாய வழிகாட்டி.',

    getStarted: 'தொடங்கவும்',

    // Navigation
    navHome: 'முகப்பு',
    navDiagnose: 'ஆய்வு',
    navWeather: 'வானிலை',
    navMarket: 'சந்தை',
    navWhatIf: 'என்ன ஆகும்?',
    navProfile: 'சுயவிவரம்',

    // HOME
    checkCropHeroTitle:
      'பயிரை பரிசோதிக்க',

    checkCropHeroSubtitle:
      'பாதிக்கப்பட்ட இலை அல்லது தண்டை படம் எடுத்து நோய் மற்றும் சிகிச்சையை அறியவும்.',

    startScanButton:
      'பயிரை ஸ்கேன் செய்',

    weatherTodayTitle:
      'இன்றைய வானிலை',

    marketSummaryTitle:
      'இன்றைய சந்தை விலை',

    whatIfShortcutTitle:
      'என்ன ஆகும்? கணக்கீடு',

    todayInsightTitle:
      'இன்றைய சிறப்பு யோசனை',

    viewDetails:
      'விவரங்களை காண்க',

    recentSampleDataBadge: 'சமீபத்திய மாதிரி தரவு',
    weatherUnavailable: 'வானிலை தற்காலிகமாக கிடைக்கவில்லை',
    usingDefaultLocation: 'இயல்புநிலை இருப்பிடம் பயன்படுத்தப்படுகிறது',
    useMyLocation: 'என் இருப்பிடத்தைப் பயன்படுத்து',
    transportUnavailable: 'போக்குவரத்து மதிப்பீடு கிடைக்கவில்லை',
    approxDistance: 'தோராயமான தூரம்',
    estimatedTransportCost: 'மதிப்பிடப்பட்ட போக்குவரத்து செலவு',
    estimatedGrossValue: 'மதிப்பிடப்பட்ட மொத்த வருவாய்',
    estimatedNetReturn: 'மதிப்பிடப்பட்ட நிகர வருவாய்',
    insightHighRain: 'மழை பெய்ய வாய்ப்புள்ளது. தெளிப்பதை ஒத்திவைக்கவும்.',
    insightHighWind: 'பலத்த காற்று தெளிப்பு மருந்து சிதறும் அபாயத்தை அதிகரிக்கும்.',
    insightHighHumidity: 'அதிக ஈரப்பதம் நோய் பரவுவதற்கு சாதகமான சூழலை உருவாக்கும்.',
    insightSuitable: 'வயல் வேலைகளுக்கு வானிலை சாதகமாக இருக்கலாம்.',

    bestOption: 'சிறந்த தேர்வு',
    recommendationLabel: 'பரிந்துரை',
    harvestQuantityLabel: 'அறுவடை அளவு (கிலோ)',
    bestPriceMarket: 'சிறந்த விலை சந்தை',
    netReturnUnavailable: 'போக்குவரத்து தூரம் தெரியும் வரை கிடைக்காது',
    marketRatesTitle: 'மண்டி விலைகள் மற்றும் போக்குவரத்து வருவாய்',
    availableMarkets: 'கிடைக்கக்கூடிய சந்தைகள்',
    yieldProtection: 'மகசூல் பாதுகாப்பு',
    costImpact: 'செலவு தாக்கம்',
    updatingData: 'புதுப்பிக்கிறது...',

    // CROPS
    cropSelectTitle:
      'பயிரைத் தேர்ந்தெடுக்கவும்',

    paddy: 'நெல்',
    cotton: 'பருத்தி',
    groundnut: 'நிலக்கடலை',

    // DIAGNOSIS
    diagnoseTitle:
      'பயிர் நோய் ஆய்வு',

    selectCropPrompt:
      'பரிசோதிக்க வேண்டிய பயிரைத் தேர்ந்தெடுக்கவும்:',

    uploadPrompt:
      'பாதிக்கப்பட்ட இலையின் தெளிவான படத்தை எடுக்கவும்',

    cameraButton: 'கேமரா',
    galleryButton: 'கேலரி',

    reselectPhoto:
      'படத்தை மாற்றுக',

    analyzeButton:
      'பயிரை பரிசோதிக்கவும்',

    analyzingState:
      'பயிர் படம் பரிசோதிக்கப்படுகிறது...',

    analyzingHint:
      'பூஞ்சை, பாக்டீரியா மற்றும் பூச்சி அறிகுறிகள் சரிபார்க்கப்படுகின்றன',

    resultTitle:
      'ஆய்வு முடிவு',

    healthyStateTitle:
      'பயிர் ஆரோக்கியமாக உள்ளது',

    uncertainStateTitle:
      'படம் தெளிவாக இல்லை',

    uncertainHint:
      'நல்ல வெளிச்சத்தில் தெளிவான இலையின் படத்தை மீண்டும் பதிவேற்றவும்.',

    whyHappening:
      'இது ஏன் நடக்கிறது?',

    whatToDoNow:
      'இப்போது என்ன செய்ய வேண்டும்?',

    treatmentSteps:
      'பரிந்துரைக்கப்படும் சிகிச்சை',

    weatherWarning:
      'வானிலை சூழல்',

    checkWhatIfCTA:
      'சிகிச்சை நேரத்தை "என்ன ஆகும்?" பக்கத்தில் சரிபார்க்கவும்',

    sourcesTitle:
      'ஆதாரங்கள்',

    // Image instructions
    betterResultsTitle:
      'சிறந்த முடிவுகளுக்கு',

    photoTipLeaf:
      'ஒரு பாதிக்கப்பட்ட இலை தெளிவாகத் தெரியுமாறு எடுக்கவும்',

    photoTipLighting:
      'நல்ல வெளிச்சத்தைப் பயன்படுத்தவும்',

    photoTipSteady:
      'கேமராவை அசையாமல் பிடிக்கவும்',

    photoTipSymptoms:
      'நோய் அறிகுறிகள் தெளிவாகத் தெரியுமாறு எடுக்கவும்',

    photoTipBlur:
      'மிகவும் இருண்ட அல்லது மங்கலான படங்களைத் தவிர்க்கவும்',

    photoTipCrop:
      'முதலில் சரியான பயிரைத் தேர்ந்தெடுக்கவும்',

    retryPhotoTitle:
      'மற்றொரு படத்தை எடுக்க முயற்சிக்கவும்:',

    retryMoveCloser:
      'பாதிக்கப்பட்ட இலையை நெருக்கமாக படம் எடுக்கவும்',

    retryGoodLight:
      'நல்ல இயற்கை வெளிச்சத்தில் படம் எடுக்கவும்',

    retryAvoidBlur:
      'மங்கலான அல்லது இருண்ட படங்களைத் தவிர்க்கவும்',

    retryShowSymptoms:
      'நோய் அறிகுறிகள் தெளிவாகத் தெரியுமாறு எடுக்கவும்',

    // Errors
    invalidImage:
      'சரியான படக் கோப்பைத் தேர்ந்தெடுக்கவும்.',

    imageTooLarge:
      'படத்தின் அளவு அதிகமாக உள்ளது. 10 MB-க்கும் குறைவான படத்தை பதிவேற்றவும்.',

    analysisFailed:
      'இந்தப் படத்தை ஆய்வு செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',

    serviceUnavailable:
      'ஃபார்ம்சைட் நோய் கண்டறிதல் சேவை தற்போது கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.',

    // WEATHER
    weatherTitle:
      'வானிலை தகவல்',

    temperature:
      'வெப்பநிலை',

    humidity:
      'காற்றின் ஈரப்பதம்',

    rainProbability:
      'மழை வாய்ப்பு',

    windSpeed:
      'காற்றின் வேகம்',

    farmingImpactCard:
      'மருந்து தெளிப்பு மற்றும் விவசாய யோசனை',

    // WHAT-IF
    whatIfTitle:
      'என்ன ஆகும்? கணக்கீடு',

    whatIfSubtitle:
      'மருந்துக்கு பணம் செலவழிப்பதற்கு முன் சிறந்த நேரத்தைத் தேர்ந்தெடுக்கவும்.',

    optionTreatNow:
      'இப்போதே சிகிச்சை செய்',

    optionWait:
      'நல்ல வானிலைக்கு காத்திரு',

    optionBioControl:
      'இயற்கை முறையில் கட்டுப்படுத்து',

    optionMonitor:
      'பயிரை கண்காணிக்கவும்',

    decisionRecommendation:
      'பரிந்துரை',

    decisionRisk:
      'முடிவின் அபாயம்',

    yieldImpactNotice:
      'மகசூல் மற்றும் செலவு மதிப்பீடு',

    calculationNote:
      'கணக்கீடுகள் உள்ளூர் வானிலை முன்னறிவிப்பு மற்றும் நோய் பரவல் விதிகளை அடிப்படையாகக் கொண்டவை.',

    // MARKET
    marketTitle:
      'சந்தை நிலவரம்',

    currentModalPrice:
      'தற்போதைய சந்தை விலை',

    bestNearbyMandi:
      'அருகிலுள்ள சிறந்த சந்தை (மண்டி)',

    distance:
      'தூரம்',

    estimatedQuantity:
      'அறுவடை அளவு (கிலோ)',

    grossRevenue:
      'எதிர்பார்க்கும் வருமானம்',

    transportCost:
      'போக்குவரத்து செலவு',

    estimatedNetValue:
      'நிகர லாப மதிப்பீடு',

    netProfitNotice:
      'நிகர மதிப்பு என்பது மொத்த வருமானத்திலிருந்து போக்குவரத்து செலவைக் கழித்துக் கணக்கிடப்படுகிறது.',

    minPrice: 'குறைந்தபட்ச விலை',
    maxPrice: 'அதிகபட்ச விலை',
    modalPrice: 'சராசரி விலை',
    arrivalDate: 'வந்தடைந்த தேதி',
    variety: 'ரகம்',
    dataSource: 'தரவு ஆதாரம்',
    fallbackDataBadge: 'மாதிரி / சமீபத்திய தரவு',
    liveMarketData: 'நேரலை சந்தைத் தரவு',
    loadingMarketData: 'சந்தைத் தரவு ஏற்றப்படுகிறது...',
    errorMarketData: 'சந்தைத் தரவைப் பெற முடியவில்லை.',
    emptyMarketData: 'இந்த பயிர் மற்றும் இடத்திற்கு சந்தைத் தரவு இல்லை.',
    retryButton: 'மீண்டும் முயற்சி',

    // RISK
    low: 'குறைவு',
    medium: 'மிதமான',
    high: 'அதிகம்',
    veryHigh: 'மிக அதிகம்',

    normal: 'இயல்பு',
    safe: 'பாதுகாப்பானது',
    critical: 'மிகவும் ஆபத்தானது',

    riskLow:
      'குறைந்த அபாயம்',

    riskMedium:
      'மிதமான அபாயம்',

    riskHigh:
      'அதிக அபாயம்',

    riskVeryHigh:
      'மிக அதிக அபாயம்',

    lowWeatherRisk:
      'குறைந்த வானிலை அபாயம்',

    mediumWeatherRisk:
      'மிதமான வானிலை அபாயம்',

    highWeatherRisk:
      'அதிக வானிலை அபாயம்',

    veryHighWeatherRisk:
      'மிக அதிக வானிலை அபாயம்',

    // AUDIO
    listenButton:
      'கேட்க',

    stopButton:
      'நிறுத்து',

    speaking:
      'வாசிக்கிறது...',

    voiceUnavailableTa:
      'இந்த சாதனத்தில் தமிழ் குரல் கிடைக்கவில்லை.',

    // PROFILE
    profileTitle:
      'சுயவிவரம் & அமைப்புகள்',

    profileSubtitle:
      'உங்கள் பயன்பாட்டு விருப்பங்களை மாற்றவும்',

    languageSettings:
      'பயன்பாட்டு மொழி',

    locationPreference:
      'விவசாய இடம்',

    preferredCropSetting:
      'முக்கிய பயிர்',

    voiceSettings:
      'குரல் வேகம்',

    voiceSpeedNormal:
      'இயல்பு (1.0x)',

    voiceSpeedSlow:
      'மெதுவாக (0.8x)',

    voiceSpeedFast:
      'வேகமாக (1.2x)',

    aboutFarmSight:
      'ஃபார்ம்சைட் பற்றி',

    aboutText:
      'ஃபார்ம்சைட் விவசாயிகளுக்கான எளிய, நவீன மற்றும் பயனுள்ள விவசாய பயன்பாடாகும்.',

    appVersionText:
      'பதிப்பு 2.0 (விவசாயி பதிப்பு)',

    resetDemoState:
      'டெமோ நிலையை மீட்டமை',

    // DYNAMIC UI
    aiConfidence:
      'AI துல்லியம்',

    financialBreakdown:
      'நிதி விவரம்',

    aiCropDiagnosisTag:
      'AI பயிர் நோய் ஆய்வு',

    previewResultState:
      'மாதிரி ஆய்வு நிலை:',

    bestOptionTag:
      'சிறந்த தேர்வு',

    liveRateTag:
      'நேரலை விலை',

    perQuintal:
      'குவிண்டாலுக்கு',

    awayText:
      'தொலைவில்',

    netProfitTag:
      'நிகர லாபம்',

    todaysTemperature:
      'இன்றைய வெப்பநிலை',

    weatherRiskTag:
      'வானிலை அபாயம்',

    // GOVERNMENT SUPPORT & ACTION PLAN
    governmentSupportTitle: 'அரசு நலத்திட்ட உதவிகள்',
    yourActionPlanTitle: 'உங்கள் செயல் திட்டம்',
    bestDecision: 'சிறந்த முடிவு',
    weatherCheck: 'வானிலை சரிபார்ப்பு',
    marketDecision: 'சந்தை முடிவு',
    governmentSupport: 'அரசு நலத்திட்டங்கள்',
    eligibility: 'தகுதி',
    requiredDocuments: 'தேவையான ஆவணங்கள்',
    whyRecommended: 'பரிந்துரைக்கப்பட காரணம்',
    checkOfficialPortal: 'அரசு இணையதளத்தைப் பார்க்கவும்',
    hideDetails: 'விவரங்களை மறை',
    immediateAction: 'உடனடி நடவடிக்கை',
    diseaseStatus: 'நோய் நிலை',

    // CAMERA & ACTION PLAN FALLBACK
    actionPlanFallbackCTA: 'உங்கள் பயிருக்கான தனிப்பயனாக்கப்பட்ட செயல் திட்டத்தைப் பெற நோய் ஆய்வு செய்யவும்.',
    cameraPermissionDeniedMsg: 'கேமரா அனுமதி மறுக்கப்பட்டது. பதிலாக புகைப்படத்தை பதிவேற்றலாம்.',
    cameraUnavailableMsg: 'இந்த சாதனத்தில் கேமரா கிடைக்கவில்லை. பதிலாக புகைப்படத்தை பதிவேற்றலாம்.',
    takePhoto: 'படம் எடு',
    initializingCamera: 'கேமரா தொடங்குகிறது...',
    cancel: 'ரத்து',
  },

  // =========================================================
  // HINDI
  // =========================================================
  hi: {
    appTitle: 'फार्मसाइट',
    appSubtitle: 'किसान मित्र ऐप',

    selectLanguage:
      'भाषा चुनें',

    welcomeHeading:
      'फार्मसाइट में आपका स्वागत है',

    welcomeTagline:
      'आपकी फसल के लिए आसान बीमारी जांच और मौसम आधारित सलाह।',

    getStarted:
      'शुरू करें',

    // Navigation
    navHome: 'होम',
    navDiagnose: 'जांच',
    navWeather: 'मौसम',
    navMarket: 'मंडी',
    navWhatIf: 'क्या होगा?',
    navProfile: 'प्रोफाइल',

    // HOME
    checkCropHeroTitle:
      'मेरी फसल की जांच',

    checkCropHeroSubtitle:
      'प्रभावित पत्ते या तने की फोटो खींचें और तुरंत बीमारी व इलाज जानें।',

    startScanButton:
      'फसल स्कैन करें',

    weatherTodayTitle:
      'आज का मौसम',

    marketSummaryTitle:
      'आज का मंडी भाव',

    whatIfShortcutTitle:
      'क्या होगा? सिमुलेटर',

    todayInsightTitle:
      'आज की किसान सलाह',

    viewDetails:
      'विवरण देखें',

    recentSampleDataBadge: 'हाल का नमूना डेटा',
    weatherUnavailable: 'मौसम अस्थायी रूप से उपलब्ध नहीं है',
    usingDefaultLocation: 'डिफ़ॉल्ट स्थान का उपयोग किया जा रहा है',
    useMyLocation: 'मेरे स्थान का उपयोग करें',
    transportUnavailable: 'परिवहन अनुमान उपलब्ध नहीं है',
    approxDistance: 'लगभग दूरी',
    estimatedTransportCost: 'अनुमानित परिवहन लागत',
    estimatedGrossValue: 'अनुमानित सकल मूल्य',
    estimatedNetReturn: 'अनुमानित शुद्ध लाभ',
    insightHighRain: 'बारिश की संभावना है। छिड़काव स्थगित करने पर विचार करें।',
    insightHighWind: 'तेज हवा से छिड़काव के बहने का खतरा बढ़ सकता है।',
    insightHighHumidity: 'उच्च आर्द्रता से रोग के अनुकूल स्थितियां बढ़ सकती हैं।',
    insightSuitable: 'खेत के काम के लिए मौसम की स्थिति अनुकूल हो सकती है।',

    bestOption: 'सबसे अच्छा विकल्प',
    recommendationLabel: 'सलाह',
    harvestQuantityLabel: 'फसल की मात्रा (किग्रा)',
    bestPriceMarket: 'सबसे अच्छा भाव मंडी',
    netReturnUnavailable: 'परिवहन दूरी ज्ञात होने तक उपलब्ध नहीं',
    marketRatesTitle: 'मंडी भाव और परिवहन लाभ',
    availableMarkets: 'उपलब्ध मंडियां',
    yieldProtection: 'पैदावार सुरक्षा',
    costImpact: 'लागत प्रभाव',
    updatingData: 'अद्यतन कर रहा है...',

    // CROPS
    cropSelectTitle:
      'अपनी फसल चुनें',

    paddy: 'धान',
    cotton: 'कपास',
    groundnut: 'मूंगफली',

    // DIAGNOSIS
    diagnoseTitle:
      'फसल बीमारी जांच',

    selectCropPrompt:
      'जांच के लिए फसल चुनें:',

    uploadPrompt:
      'फसल के पत्ते की साफ तस्वीर खींचें या अपलोड करें',

    cameraButton:
      'कैमरा',

    galleryButton:
      'गैलरी',

    reselectPhoto:
      'फोटो बदलें',

    analyzeButton:
      'फसल स्वास्थ्य की जांच करें',

    analyzingState:
      'आपकी फसल की तस्वीर की जांच हो रही है...',

    analyzingHint:
      'फंगस, बैक्टीरिया और कीट के लक्षणों का विश्लेषण किया जा रहा है',

    resultTitle:
      'जांच परिणाम',

    healthyStateTitle:
      'फसल स्वस्थ है',

    uncertainStateTitle:
      'तस्वीर साफ नहीं है',

    uncertainHint:
      'कृपया अच्छी रोशनी में प्रभावित पत्ते की साफ तस्वीर दोबारा अपलोड करें।',

    whyHappening:
      'यह क्यों हो रहा है?',

    whatToDoNow:
      'अब क्या करें?',

    treatmentSteps:
      'सुझाया गया इलाज',

    weatherWarning:
      'मौसम संदर्भ',

    checkWhatIfCTA:
      'इलाज का सही समय "क्या होगा?" में देखें',

    sourcesTitle:
      'स्रोत',

    betterResultsTitle:
      'बेहतर परिणाम के लिए',

    photoTipLeaf:
      'एक प्रभावित पत्ता साफ दिखाई देना चाहिए',

    photoTipLighting:
      'अच्छी रोशनी का उपयोग करें',

    photoTipSteady:
      'कैमरा स्थिर रखें',

    photoTipSymptoms:
      'बीमारी के लक्षण साफ दिखाई दें',

    photoTipBlur:
      'बहुत अंधेरी या धुंधली तस्वीर से बचें',

    photoTipCrop:
      'पहले सही फसल चुनें',

    retryPhotoTitle:
      'एक और फोटो लेने की कोशिश करें:',

    retryMoveCloser:
      'प्रभावित पत्ते के पास से फोटो लें',

    retryGoodLight:
      'अच्छी रोशनी में फोटो लें',

    retryAvoidBlur:
      'धुंधली या अंधेरी तस्वीर से बचें',

    retryShowSymptoms:
      'बीमारी के लक्षण साफ दिखाई दें',

    invalidImage:
      'कृपया सही चित्र फ़ाइल चुनें।',

    imageTooLarge:
      'चित्र बहुत बड़ा है। कृपया 10 MB से कम का चित्र अपलोड करें।',

    analysisFailed:
      'इस तस्वीर का विश्लेषण नहीं हो सका। कृपया फिर से कोशिश करें।',

    serviceUnavailable:
      'फार्मसाइट बीमारी पहचान सेवा अभी उपलब्ध नहीं है। कृपया फिर से कोशिश करें।',

    // WEATHER
    weatherTitle:
      'मौसम की जानकारी',

    temperature:
      'तापमान',

    humidity:
      'हवा में नमी',

    rainProbability:
      'बारिश की संभावना',

    windSpeed:
      'हवा की गति',

    farmingImpactCard:
      'छिड़काव और खेती की सलाह',

    // WHAT-IF
    whatIfTitle:
      'क्या होगा? निर्णय सिमुलेटर',

    whatIfSubtitle:
      'दवाई पर पैसा खर्च करने से पहले सही समय और तरीका चुनें।',

    optionTreatNow:
      'अभी इलाज करें',

    optionWait:
      'बेहतर मौसम का इंतजार करें',

    optionBioControl:
      'जैविक नियंत्रण का उपयोग करें',

    optionMonitor:
      'पहले निगरानी करें',

    decisionRecommendation:
      'सुझाव',

    decisionRisk:
      'निर्णय का जोखिम',

    yieldImpactNotice:
      'उपज और लागत अनुमान सूचना',

    calculationNote:
      'गणनाएँ स्थानीय मौसम पूर्वानुमान और रोग प्रसार नियमों पर आधारित हैं।',

    // MARKET
    marketTitle:
      'मंडी भाव व बिक्री सलाह',

    currentModalPrice:
      'वर्तमान मॉडल भाव',

    bestNearbyMandi:
      'निकटतम सबसे अच्छी मंडी',

    distance:
      'दूरी',

    estimatedQuantity:
      'फसल मात्रा (किग्रा)',

    grossRevenue:
      'अनुमानित कुल आय',

    transportCost:
      'परिवहन खर्च',

    estimatedNetValue:
      'अनुमानित शुद्ध आय',

    netProfitNotice:
      'शुद्ध आय की गणना कुल मंडी आय में से परिवहन खर्च घटाकर की जाती है।',

    minPrice: 'न्यूनतम मूल्य',
    maxPrice: 'अधिकतम मूल्य',
    modalPrice: 'मॉडल मूल्य',
    arrivalDate: 'आवक तिथि',
    variety: 'किस्म',
    dataSource: 'डेटा स्रोत',
    fallbackDataBadge: 'सैंपल / हालिया डेटा',
    liveMarketData: 'लाइव मंडी भाव',
    loadingMarketData: 'मंडी भाव लोड हो रहा है...',
    errorMarketData: 'मंडी भाव प्राप्त नहीं हो सका।',
    emptyMarketData: 'इस फसल और स्थान के लिए कोई मंडी भाव नहीं मिला।',
    retryButton: 'पुनः प्रयास',

    // RISK
    low: 'कम',
    medium: 'मध्यम',
    high: 'उच्च',
    veryHigh: 'बहुत उच्च',

    normal: 'सामान्य',
    safe: 'सुरक्षित',
    critical: 'गंभीर',

    riskLow:
      'कम जोखिम',

    riskMedium:
      'मध्यम जोखिम',

    riskHigh:
      'उच्च जोखिम',

    riskVeryHigh:
      'बहुत उच्च जोखिम',

    lowWeatherRisk:
      'कम मौसम जोखिम',

    mediumWeatherRisk:
      'मध्यम मौसम जोखिम',

    highWeatherRisk:
      'उच्च मौसम जोखिम',

    veryHighWeatherRisk:
      'बहुत उच्च मौसम जोखिम',

    // AUDIO
    listenButton:
      'सुनें',

    stopButton:
      'रोकें',

    speaking:
      'बोल रहा है...',

    voiceUnavailableTa:
      'इस डिवाइस पर तमिल आवाज़ उपलब्ध नहीं है।',

    // PROFILE
    profileTitle:
      'प्रोफाइल और सेटिंग्स',

    profileSubtitle:
      'अपनी फ़सल ऐप प्राथमिकताओं को बदलें',

    languageSettings:
      'ऐप की भाषा',

    locationPreference:
      'खेत का स्थान',

    preferredCropSetting:
      'मुख्य फसल',

    voiceSettings:
      'आवाज़ की गति',

    voiceSpeedNormal:
      'सामान्य (1.0x)',

    voiceSpeedSlow:
      'धीमी (0.8x)',

    voiceSpeedFast:
      'तेज़ (1.2x)',

    aboutFarmSight:
      'फार्मसाइट के बारे में',

    aboutText:
      'फार्मसाइट किसानों के लिए बनाया गया एक सरल और आधुनिक कृषि सहायक ऐप है।',

    appVersionText:
      'संस्करण 2.0 (किसान संस्करण)',

    resetDemoState:
      'डेमो रीसेट करें',

    // DYNAMIC UI
    aiConfidence:
      'AI सटीकता',

    financialBreakdown:
      'वित्तीय विवरण',

    aiCropDiagnosisTag:
      'AI फसल जांच',

    previewResultState:
      'नमूना जांच स्थिति:',

    bestOptionTag:
      'सर्वोत्तम विकल्प',

    liveRateTag:
      'लाइव भाव',

    perQuintal:
      'प्रति क्विंटल',

    awayText:
      'दूर',

    netProfitTag:
      'शुद्ध लाभ',

    todaysTemperature:
      'आज का तापमान',

    weatherRiskTag:
      'मौसम जोखिम',

    // GOVERNMENT SUPPORT & ACTION PLAN
    governmentSupportTitle: 'सरकारी सहायता',
    yourActionPlanTitle: 'आपकी कार्य योजना',
    bestDecision: 'सर्वश्रेष्ठ निर्णय',
    weatherCheck: 'मौसम जांच',
    marketDecision: 'बाजार का निर्णय',
    governmentSupport: 'सरकारी योजनाएं',
    eligibility: 'पात्रता',
    requiredDocuments: 'आवश्यक दस्तावेज',
    whyRecommended: 'क्यों अनुशंसित',
    checkOfficialPortal: 'आधिकारिक पोर्टल देखें',
    hideDetails: 'विवरण छिपाएं',
    immediateAction: 'तत्काल कार्रवाई',
    diseaseStatus: 'रोग की स्थिति',

    // CAMERA & ACTION PLAN FALLBACK
    actionPlanFallbackCTA: 'अपनी फसल की जांच करें और व्यक्तिगत कार्य योजना प्राप्त करें।',
    cameraPermissionDeniedMsg: 'कैमरा अनुमति अस्वीकृत कर दी गई। आप इसके बजाय फोटो अपलोड कर सकते हैं।',
    cameraUnavailableMsg: 'इस डिवाइस पर कैमरा उपलब्ध नहीं है। आप इसके बजाय फोटो अपलोड कर सकते हैं।',
    takePhoto: 'फोटो लें',
    initializingCamera: 'कैमरा शुरू हो रहा है...',
    cancel: 'रद्द करें',
  },
} as const;


// =============================================================
// GEOGRAPHIC DISPLAY LOCALIZATION
// =============================================================
//
// IMPORTANT:
//
// This is ONLY a fallback translation table.
//
// When live GPS is connected:
//
// coordinates
//    ↓
// reverse-geocoding API
//    ↓
// request city/state in current app language if supported
//    ↓
// this table is used only as fallback.
//
// Backend location IDs / coordinates must NOT be translated.
// =============================================================

export const GEOGRAPHIC_LOCALIZATION: Record<
  string,
  Record<AppLanguage, string>
> = {
  // STATES
  'Tamil Nadu': {
    en: 'Tamil Nadu',
    ta: 'தமிழ்நாடு',
    hi: 'तमिलनाडु',
  },

  // CITIES
  Madurai: {
    en: 'Madurai',
    ta: 'மதுரை',
    hi: 'मदुरै',
  },

  Thanjavur: {
    en: 'Thanjavur',
    ta: 'தஞ்சாவூர்',
    hi: 'तंजावुर',
  },

  Dindigul: {
    en: 'Dindigul',
    ta: 'திண்டுக்கல்',
    hi: 'डिंडीगुल',
  },

  Coimbatore: {
    en: 'Coimbatore',
    ta: 'கோயம்புத்தூர்',
    hi: 'कोयंबटूर',
  },

  Virudhunagar: {
    en: 'Virudhunagar',
    ta: 'விருதுநகர்',
    hi: 'विरुधुनगर',
  },

  Villupuram: {
    en: 'Villupuram',
    ta: 'விழுப்புரம்',
    hi: 'विल्लुपुरम',
  },

  Salem: {
    en: 'Salem',
    ta: 'சேலம்',
    hi: 'सेलम',
  },

  Chennai: {
    en: 'Chennai',
    ta: 'சென்னை',
    hi: 'चेन्नई',
  },

  Kanchipuram: {
    en: 'Kanchipuram',
    ta: 'காஞ்சிபுரம்',
    hi: 'कांचीपुरम',
  },

  Tiruchirappalli: {
    en: 'Tiruchirappalli',
    ta: 'திருச்சிராப்பள்ளி',
    hi: 'तिरुचिरापल्ली',
  },

  Tirunelveli: {
    en: 'Tirunelveli',
    ta: 'திருநெல்வேலி',
    hi: 'तिरुनेलवेली',
  },

  Kumbakonam: {
    en: 'Kumbakonam',
    ta: 'கும்பகோணம்',
    hi: 'कुंभकोणम',
  },

  Nagapattinam: {
    en: 'Nagapattinam',
    ta: 'நாகப்பட்டினம்',
    hi: 'नागपट्टिनम',
  },

  Srirangam: {
    en: 'Srirangam',
    ta: 'ஸ்ரீரங்கம்',
    hi: 'श्रीरंगम',
  },

  Trichy: {
    en: 'Trichy',
    ta: 'திருச்சி',
    hi: 'तिरुचिरापल्ली',
  },

  Tiruvarur: {
    en: 'Tiruvarur',
    ta: 'திருவாரூர்',
    hi: 'तिरुவாரूर',
  },

  'Current Location': {
    en: 'Current Location',
    ta: 'தற்போதைய இருப்பிடம்',
    hi: 'वर्तमान स्थान',
  },

  Erode: {
    en: 'Erode',
    ta: 'ஈரோடு',
    hi: 'इरोड',
  },

  // MARKETS
  'Madurai Mandi': {
    en: 'Madurai Mandi',
    ta: 'மதுரை மண்டி',
    hi: 'मदुरै मंडी',
  },

  'Dindigul Market': {
    en: 'Dindigul Market',
    ta: 'திண்டுக்கல் சந்தை',
    hi: 'डिंडीगुल बाज़ार',
  },

  'Thanjavur Grain Market': {
    en: 'Thanjavur Grain Market',
    ta: 'தஞ்சாவூர் தானிய சந்தை',
    hi: 'तंजावुर अनाज मंडी',
  },

  'Rajapalayam Cotton Market': {
    en: 'Rajapalayam Cotton Market',
    ta: 'ராஜபாளையம் பருத்தி சந்தை',
    hi: 'राजापलायम कपास मंडी',
  },

  'Coimbatore Mandi': {
    en: 'Coimbatore Mandi',
    ta: 'கோயம்புத்தூர் மண்டி',
    hi: 'कोयंबटूर मंडी',
  },

  'Pollachi Oilseed Mandi': {
    en: 'Pollachi Oilseed Mandi',
    ta: 'பொள்ளாச்சி எண்ணெய் வித்து சந்தை',
    hi: 'पोल्लाची तिलहन मंडी',
  },

  'Tindivanam Market': {
    en: 'Tindivanam Market',
    ta: 'திண்டிவனம் சந்தை',
    hi: 'तिंडीवनम बाज़ार',
  },
};


// =============================================================
// LOCALIZE ONE PLACE NAME
// =============================================================

export const getLocalizedPlace = (
  text: string,
  lang: AppLanguage
): string => {
  if (!text) {
    return '';
  }

  const cleanText = text.trim();

  const mapped =
    GEOGRAPHIC_LOCALIZATION[cleanText];

  if (mapped) {
    return mapped[lang];
  }

  // Unknown place:
  // Do NOT make up a translation.
  return cleanText;
};


// =============================================================
// LOCALIZE CITY, STATE STYLE LOCATIONS
// =============================================================
//
// Example:
//
// "Madurai, Tamil Nadu"
//       ↓
// Tamil
//       ↓
// "மதுரை, தமிழ்நாடு"
//
// This is better than manually storing every
// city + state combination.
// =============================================================

export const getLocalizedDisplay = (
  text: string,
  lang: AppLanguage
): string => {
  if (!text) {
    return '';
  }

  const exact =
    GEOGRAPHIC_LOCALIZATION[text.trim()];

  if (exact) {
    return exact[lang];
  }

  /*
    Handles:
    Madurai, Tamil Nadu
    Salem, Tamil Nadu
    Dindigul, Tamil Nadu
  */

  if (text.includes(',')) {
    return text
      .split(',')
      .map((part) =>
        getLocalizedPlace(part.trim(), lang)
      )
      .join(', ');
  }

  return getLocalizedPlace(text, lang);
};


// =============================================================
// RISK LOCALIZATION HELPERS
// =============================================================

export const getRiskLabel = (
  risk: string,
  lang: AppLanguage
): string => {
  const t = translations[lang];

  const normalized = risk
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'low':
    case 'low_risk':
      return t.riskLow;

    case 'medium':
    case 'moderate':
    case 'medium_risk':
    case 'moderate_risk':
      return t.riskMedium;

    case 'high':
    case 'high_risk':
      return t.riskHigh;

    case 'very_high':
    case 'very_high_risk':
    case 'critical':
      return t.riskVeryHigh;

    default:
      return risk;
  }
};


// =============================================================
// WEATHER RISK LOCALIZATION
// =============================================================

export const getWeatherRiskLabel = (
  risk: string,
  lang: AppLanguage
): string => {
  const t = translations[lang];

  const normalized = risk
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'low':
    case 'low_risk':
      return t.lowWeatherRisk;

    case 'medium':
    case 'moderate':
    case 'medium_risk':
    case 'moderate_risk':
      return t.mediumWeatherRisk;

    case 'high':
    case 'high_risk':
      return t.highWeatherRisk;

    case 'very_high':
    case 'very_high_risk':
    case 'critical':
      return t.veryHighWeatherRisk;

    default:
      return risk;
  }
};