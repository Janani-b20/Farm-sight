import React, { useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../i18n/translations';
import { CropSelectionScreen } from './CropSelectionScreen';
import { VoiceButton } from '../VoiceButton';
import { CropId } from '../../types';
import { getDiseaseName } from '../../i18n/diseaseNames';
import { CROP_OPTIONS } from '../../data/mockData';

export const DiagnoseScreen: React.FC = () => {
  const {
    language,
    selectedCrop,
    setSelectedCrop,
    diagnosisState,
    triggerDiagnosis,
    resetDiagnosis,
    setActiveTab,
  } = useApp();

  const t = translations[language];
  const displayedDisease = getDiseaseName(
  diagnosisState.result?.disease,
  language
);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Only allow image files
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    // Max upload size: 10 MB
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(
        'Image is too large. Please upload an image smaller than 10 MB.'
      );
      event.target.value = '';
      return;
    }

    // Local preview of uploaded image
    const imagePreview = URL.createObjectURL(file);

    await triggerDiagnosis(
      selectedCrop,
      file,
      imagePreview
    );

    // Allows user to choose the same image again if needed
    event.target.value = '';
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleRetake = () => {
    resetDiagnosis();
  };

  const handleNavigateWhatIf = () => {
    setActiveTab('whatif');
  };

  return (
    <div className="space-y-6 pb-24 pt-2 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-[#1D2A20] tracking-tight">
          {t.diagnoseTitle}
        </h2>

        <p className="text-sm text-[#3F4A42] font-medium mt-0.5">
          {t.uploadPrompt}
        </p>
      </div>

      {/* STEP 1: Crop Selection + Photo Upload */}
      {diagnosisState.step === 'select_crop' && (
        <div className="space-y-6">
          <CropSelectionScreen
            onSelectCrop={(crop: CropId) =>
              setSelectedCrop(crop)
            }
          />

          <div className="bg-white rounded-3xl p-6 md:p-8 border border-sage-200 shadow-card text-center space-y-5 max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#E7EFE3] border-2 border-dashed border-[#416A47] flex items-center justify-center text-[#2F5436]">
              <Camera className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#1D2A20]">
                {t.uploadPrompt}
              </h3>

              <p className="text-xs text-[#3F4A42] mt-1">
                {t.analyzingHint}
              </p>
            </div>

            {/* Real hidden file inputs */}

            {/* Camera */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelected}
              className="hidden"
            />

            {/* Gallery */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelected}
              className="hidden"
            />

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCameraClick}
                type="button"
                className="w-full bg-[#2F5436] hover:bg-[#234029] text-white font-bold text-sm py-4 px-5 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-98 min-h-[48px]"
              >
                <Camera className="w-5 h-5 text-white" />

                <span>{t.cameraButton}</span>
              </button>

              <button
                onClick={handleGalleryClick}
                type="button"
                className="w-full bg-[#E7EFE3] hover:bg-sage-200 text-[#1D2A20] font-bold text-sm py-4 px-5 rounded-2xl border border-sage-300 flex items-center justify-center gap-2 active:scale-98 min-h-[48px]"
              >
                <ImageIcon className="w-5 h-5 text-[#2F5436]" />

                <span>{t.galleryButton}</span>
              </button>
            </div>

            {/* Helpful Image Instructions */}
            <div className="bg-sage-50 rounded-2xl p-4 border border-sage-200 text-left">
              <p className="text-xs font-bold text-[#1D2A20] mb-2">
                {t.betterResultsTitle}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#3F4A42]">
                <p>✓ {t.photoTipLeaf}</p>
                <p>✓ {t.photoTipLighting}</p>
                <p>✓ {t.photoTipSteady}</p>
                <p>✓ {t.photoTipSymptoms}</p>
                <p>✓ {t.photoTipBlur}</p>
                <p>✓ {t.photoTipCrop}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ANALYZING */}
      {diagnosisState.step === 'analyzing' && (
        <div className="bg-white rounded-3xl p-8 border border-sage-200 shadow-card text-center space-y-6 max-w-lg mx-auto">
          <div className="relative w-40 h-40 mx-auto rounded-3xl overflow-hidden border-4 border-sage-200 shadow-inner">
            {diagnosisState.imageUri && (
              <img
                src={diagnosisState.imageUri}
                alt="Analyzing crop leaf"
                className="w-full h-full object-cover"
              />
            )}

            <div className="absolute inset-0 bg-[#2F5436]/25 animate-pulse flex items-center justify-center">
              <div className="w-full h-1 bg-[#416A47] shadow-lg animate-bounce" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#1D2A20]">
              {t.analyzingState}
            </h3>

            <p className="text-xs text-[#3F4A42] mt-1 font-medium">
              {t.analyzingHint}
            </p>
          </div>

          <div className="w-full bg-sage-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-[#2F5436] h-full w-3/4 animate-pulse rounded-full" />
          </div>
        </div>
      )}

      {/* STEP 3: RESULT */}
      {diagnosisState.step === 'result' &&
        diagnosisState.result && (
          <div className="space-y-4">
            {/* Uploaded image header */}
            <div className="bg-white rounded-2xl p-4 border border-sage-200 flex items-center justify-between shadow-card">
              <div className="flex items-center gap-3">
                {diagnosisState.imageUri && (
                  <img
                    src={diagnosisState.imageUri}
                    alt="Uploaded crop"
                    className="w-14 h-14 rounded-xl object-cover border border-sage-200 shadow-inner"
                  />
                )}

                <div>
                  <span className="text-sm font-bold text-[#1D2A20]">
                    {t[
                    CROP_OPTIONS.find((crop) => crop.id === selectedCrop)?.nameKey || selectedCrop
                    ]}
                   </span>

                  <p className="text-xs text-[#6F786F]">
                    {t.resultTitle}
                  </p>
                </div>
              </div>

              <button
                onClick={handleRetake}
                type="button"
                className="px-4 py-2 rounded-xl bg-sage-100 text-[#1D2A20] hover:bg-sage-200 font-bold text-xs flex items-center gap-1.5 border border-sage-200"
              >
                <RotateCcw className="w-4 h-4 text-[#2F5436]" />

                <span>{t.reselectPhoto}</span>
              </button>
            </div>

            {/* ============================= */}
            {/* DISEASE DETECTED */}
            {/* ============================= */}

            {diagnosisState.result.status ===
              'disease_detected' && (
              <div className="bg-white rounded-3xl border border-rose-200 shadow-card overflow-hidden">
                {/* Result Header */}
                <div className="bg-rose-50 p-6 border-b border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-[#C85B57] text-xs font-bold border border-rose-200">
                        <AlertTriangle className="w-4 h-4" />

                        <span>{t.riskHigh}</span>
                      </div>

                      {diagnosisState.result
                        .confidence !== undefined && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#1D2A20] text-xs font-bold border border-sage-300 shadow-xs">
                          <span>
                            {t.aiConfidence}:{' '}
                            {
                              diagnosisState.result
                                .confidence
                            }
                            %
                          </span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-2xl font-black text-[#1D2A20] mt-2.5">
                     {displayedDisease}
                    </h3>
                  </div>

                  <VoiceButton
                    variant="primary"
                    textToSpeak={`${displayedDisease}. ${
                    diagnosisState.result.treatment?.join('. ') || ''
                    }`}
                  />
                </div>

                {/* Disease Intelligence */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[#1D2A20]">
                  {/* LEFT COLUMN */}
                  <div className="space-y-4">
                    {diagnosisState.result
                      .why_this_happening &&
                      diagnosisState.result
                        .why_this_happening.length >
                        0 && (
                        <div className="bg-sage-50/70 p-4 rounded-2xl border border-sage-200">
                          <h4 className="font-bold text-[#1D2A20] text-xs uppercase tracking-wider mb-2">
                            {t.whyHappening}
                          </h4>

                          <ul className="space-y-1.5 pl-4 list-disc text-[#3F4A42]">
                            {diagnosisState.result.why_this_happening.map(
                              (item, idx) => (
                                <li key={idx}>
                                  {item}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {diagnosisState.result
                      .what_to_do_now &&
                      diagnosisState.result
                        .what_to_do_now.length >
                        0 && (
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                          <h4 className="font-bold text-[#1D2A20] text-xs uppercase tracking-wider mb-2">
                            {t.whatToDoNow}
                          </h4>

                          <ul className="space-y-1.5 pl-4 list-disc text-[#1D2A20]">
                            {diagnosisState.result.what_to_do_now.map(
                              (item, idx) => (
                                <li key={idx}>
                                  {item}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="space-y-4">
                    {diagnosisState.result
                      .treatment &&
                      diagnosisState.result
                        .treatment.length >
                        0 && (
                        <div>
                          <h4 className="font-bold text-[#1D2A20] text-xs uppercase tracking-wider mb-2">
                            {t.treatmentSteps}
                          </h4>

                          <div className="bg-[#E7EFE3] p-4 rounded-2xl border border-sage-300 space-y-2">
                            {diagnosisState.result.treatment.map(
                              (item, idx) => (
                                <p
                                  key={idx}
                                  className="font-semibold text-[#1D2A20] text-xs md:text-sm"
                                >
                                  {idx + 1}. {item}
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {diagnosisState.result
                      .weather_warning && (
                      <div className="text-xs text-[#1D2A20] bg-amber-50 p-3 rounded-2xl border border-amber-200">
                        <strong>
                          {t.weatherWarning}:
                        </strong>{' '}
                        {
                          diagnosisState.result
                            .weather_warning
                        }
                      </div>
                    )}

                    {/* Sources */}
                    {diagnosisState.result
                      .sources &&
                      diagnosisState.result.sources
                        .length > 0 && (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-xs font-bold text-[#6F786F] mb-1">
                            {t.sourcesTitle}
                          </p>

                          {diagnosisState.result.sources.map(
                            (src, index) => (
                              <a
                                key={index}
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#2F5436] hover:underline flex items-center gap-1 font-semibold"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />

                                <span>
                                  {src.title}
                                </span>
                              </a>
                            )
                          )}
                        </div>
                      )}
                  </div>
                </div>

                {/* What-If CTA */}
                <div className="p-6 bg-sage-50 border-t border-sage-200">
                  <button
                    onClick={
                      handleNavigateWhatIf
                    }
                    type="button"
                    className="w-full max-w-lg mx-auto bg-[#2F5436] hover:bg-[#234029] text-white font-bold py-4 px-6 rounded-2xl shadow-md flex items-center justify-center gap-3 active:scale-98 text-base transition-all min-h-[52px]"
                  >
                    <span>
                      {t.checkWhatIfCTA}
                    </span>

                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================= */}
            {/* HEALTHY RESULT */}
            {/* ============================= */}

            {diagnosisState.result.status ===
              'normal' && (
              <div className="bg-white rounded-3xl border border-emerald-200 shadow-card p-8 text-center space-y-5 max-w-2xl mx-auto">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-[#E7EFE3] text-[#2F5436] flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10" />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="px-3.5 py-1 rounded-full bg-[#E7EFE3] text-[#2F5436] text-xs font-bold border border-sage-300">
                    {t.riskLow}
                  </span>

                  {diagnosisState.result
                    .confidence !== undefined && (
                    <span className="px-3.5 py-1 rounded-full bg-white text-[#1D2A20] text-xs font-bold border border-sage-300 shadow-xs">
                      {t.aiConfidence}:{' '}
                      {
                        diagnosisState.result
                          .confidence
                      }
                      %
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-[#1D2A20] mt-3">
                    {t.healthyStateTitle}
                  </h3>

                  <p className="text-sm text-[#3F4A42] mt-2 leading-relaxed">
                    {
                      diagnosisState.result
                        .analysis
                    }
                  </p>
                </div>

                <VoiceButton
                  className="w-full max-w-xs mx-auto"
                  textToSpeak={`${t.healthyStateTitle}. ${diagnosisState.result.analysis}`}
                />
              </div>
            )}

            {/* ============================= */}
            {/* UNCERTAIN RESULT */}
            {/* ============================= */}

            {diagnosisState.result.status ===
              'uncertain' && (
              <div className="bg-white rounded-3xl border border-amber-200 shadow-card p-8 text-center space-y-5 max-w-2xl mx-auto">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 text-[#D99A45] flex items-center justify-center">
                  <HelpCircle className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-[#1D2A20]">
                    {t.uncertainStateTitle}
                  </h3>

                  {diagnosisState.result
                    .confidence !== undefined &&
                    diagnosisState.result
                      .confidence > 0 && (
                      <p className="text-xs font-bold text-[#D99A45] mt-2">
                        {t.aiConfidence}:{' '}
                        {
                          diagnosisState.result
                            .confidence
                        }
                        %
                      </p>
                    )}

                  <p className="text-sm text-[#3F4A42] mt-3 leading-relaxed">
                    {
                      diagnosisState.result
                        .analysis
                    }
                  </p>
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-left">
                  <p className="text-xs font-bold text-[#1D2A20] mb-2">
                    {t.retryPhotoTitle}
                  </p>

                  <div className="space-y-1 text-xs text-[#3F4A42]">
                    <p>✓ {t.photoTipLeaf}</p>
                    <p>✓ {t.photoTipLighting}</p>
                    <p>✓ {t.photoTipBlur}</p>
                    <p>✓ {t.photoTipSymptoms}</p>
                  </div>
                </div>

                <button
                  onClick={handleRetake}
                  type="button"
                  className="w-full max-w-xs mx-auto bg-[#D99A45] hover:bg-amber-600 text-white font-bold py-3.5 px-5 rounded-2xl shadow-md flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <RotateCcw className="w-5 h-5" />

                  <span>
                    {t.uncertainHint}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
};