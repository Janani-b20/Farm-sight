import React, { useState } from 'react';
import { 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  FileText, 
  ShieldAlert, 
  CloudSun, 
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  predictDisease, 
  analyzePrediction, 
  PredictionResult, 
  AnalysisResponse 
} from '../services/diseaseApi';

interface CropDoctorProps {
  onNavigateToWhatIf?: (crop: string, disease: string, confidence: number) => void;
}

const AVAILABLE_CROPS = [
  { id: 'paddy', name: 'Paddy (Rice)', icon: '🌾' },
  { id: 'cotton', name: 'Cotton', icon: '☁️' },
  { id: 'groundnut', name: 'Groundnut (Peanut)', icon: '🥜' },
];

export default function CropDoctor({ onNavigateToWhatIf }: CropDoctorProps) {
  const [selectedCrop, setSelectedCrop] = useState<string>('paddy');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [predictResult, setPredictResult] = useState<PredictionResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Reset previous results
      setPredictResult(null);
      setAnalysisResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPredictResult(null);
      setAnalysisResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please upload a crop leaf image before running diagnosis.');
      return;
    }

    setLoading(true);
    setError(null);
    setPredictResult(null);
    setAnalysisResult(null);

    try {
      // 1. Call POST /api/disease/predict
      const predRes = await predictDisease(selectedCrop, selectedFile);
      setPredictResult(predRes);

      const diseaseLower = predRes.disease.toLowerCase();

      // 2. Check for uncertain prediction -> stop
      if (diseaseLower === 'uncertain' || diseaseLower === 'low_confidence') {
        setLoading(false);
        return;
      }

      // 3. Check for healthy prediction -> stop
      if (['normal', 'healthy', 'no_disease', 'none'].includes(diseaseLower)) {
        setLoading(false);
        return;
      }

      // 4. Disease detected -> Call POST /api/analyze
      const analysisRes = await analyzePrediction({
        crop: predRes.crop,
        disease: predRes.disease,
        confidence: predRes.confidence,
        message: predRes.message,
      });

      setAnalysisResult(analysisRes);

    } catch (err: any) {
      setError(err.message || 'Failed to complete crop diagnosis.');
    } finally {
      setLoading(false);
    }
  };

  const formatDiseaseName = (name: string) => {
    if (!name) return '';
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div className="p-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold tracking-tight">Crop Doctor - Visual Disease Diagnosis</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Select your crop, upload a clear photo of the leaf or leaf region, and receive instant AI diagnosis with RAG-backed treatment guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Input Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Crop Selector Card */}
          <div className="p-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-4">
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              1. Select Crop Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {AVAILABLE_CROPS.map((crop) => (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => setSelectedCrop(crop.id)}
                  className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 ${
                    selectedCrop === crop.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-brand-500 font-semibold shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <span className="text-2xl">{crop.icon}</span>
                  <span className="text-xs">{crop.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload Card */}
          <div className="p-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-4">
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              2. Upload Crop Leaf Image
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-6 text-center transition-colors cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/30"
              onClick={() => document.getElementById('crop-image-input')?.click()}
            >
              <input
                id="crop-image-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              
              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Uploaded Leaf Preview"
                    className="max-h-56 mx-auto rounded-lg object-cover shadow-sm border border-zinc-200 dark:border-zinc-700"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {selectedFile?.name} ({(selectedFile!.size / 1024).toFixed(1)} KB)
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-brand-500 font-medium">
                    <RefreshCw className="w-3.5 h-3.5" /> Click to change image
                  </span>
                </div>
              ) : (
                <div className="py-6 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-brand-500 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      Drag & drop image here or click to browse
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Supports JPEG, PNG, WEBP
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              disabled={loading || !selectedFile}
              onClick={handleAnalyze}
              className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                loading || !selectedFile
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                  : 'bg-brand-500 hover:bg-brand-600 text-white dark:text-zinc-950 shadow-sm'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Crop Leaf Image...</span>
                </>
              ) : (
                <>
                  <span>Run Disease Diagnosis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Prediction & Diagnosis Results */}
        <div className="lg:col-span-7 space-y-6">
          {!predictResult && !loading && (
            <div className="p-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm text-center max-w-lg mx-auto space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 flex items-center justify-center">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-200">
                Awaiting Crop Image
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Select your crop type on the left, upload a leaf sample image, and click "Run Disease Diagnosis" to process model predictions.
              </p>
            </div>
          )}

          {loading && (
            <div className="p-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm text-center max-w-lg mx-auto space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" />
              <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-200">
                Running Neural Network Inference
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Evaluating model features and checking confidence thresholds...
              </p>
            </div>
          )}

          {/* Results Rendered when Predict completes */}
          {predictResult && !loading && (
            <div className="space-y-6">
              {/* Prediction Summary Header Card */}
              <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                    Crop & Model Diagnosis
                  </span>
                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
                    {formatDiseaseName(predictResult.disease)}
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Crop: <strong className="capitalize text-zinc-700 dark:text-zinc-300">{predictResult.crop}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium block">
                    Confidence Score
                  </span>
                  <div className={`text-2xl font-bold ${
                    predictResult.disease.toLowerCase() === 'uncertain'
                      ? 'text-amber-500'
                      : predictResult.disease.toLowerCase() === 'normal' || predictResult.disease.toLowerCase() === 'healthy'
                      ? 'text-emerald-500'
                      : 'text-brand-500'
                  }`}>
                    {predictResult.confidence.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Case 1: UNCERTAIN PREDICTION */}
              {(predictResult.disease.toLowerCase() === 'uncertain' || predictResult.disease.toLowerCase() === 'low_confidence') && (
                <div className="p-6 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-3">
                  <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <h3 className="font-bold text-base">Prediction Uncertain</h3>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {predictResult.message || 'The model confidence is below the safety threshold. Please upload a clearer, well-lit photo of the affected crop leaf.'}
                  </p>
                  <div className="pt-2 text-xs text-amber-700 dark:text-amber-300 font-medium">
                    Analysis stopped. Please provide a higher quality leaf close-up to proceed.
                  </div>
                </div>
              )}

              {/* Case 2: HEALTHY / NORMAL CROP */}
              {['normal', 'healthy', 'no_disease', 'none'].includes(predictResult.disease.toLowerCase()) && (
                <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-3">
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-brand-500">
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                    <h3 className="font-bold text-base">Healthy Crop Detected</h3>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    Great news! Your {predictResult.crop} crop shows no visible symptoms of disease. Continue standard irrigation and crop maintenance schedules.
                  </p>
                  <div className="pt-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    No disease treatment or What-If simulation required.
                  </div>
                </div>
              )}

              {/* Case 3: DISEASE DETECTED -> Detailed Analysis Cards */}
              {analysisResult && (
                <div className="space-y-6">
                  {/* Weather Warning Card (if present) */}
                  {analysisResult.weather_warning && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-sm text-amber-700 dark:text-amber-300">
                      <CloudSun className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <span className="font-semibold block mb-0.5">Weather Context Notice</span>
                        <p className="text-xs leading-relaxed">{analysisResult.weather_warning}</p>
                      </div>
                    </div>
                  )}

                  {/* Disease Explanation */}
                  {analysisResult.why_this_happening && analysisResult.why_this_happening.length > 0 && (
                    <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
                        <Info className="w-4 h-4 text-blue-500" />
                        <span>Why Is This Happening?</span>
                      </div>
                      <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300 pl-5 list-disc leading-relaxed">
                        {analysisResult.why_this_happening.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Immediate Action Steps */}
                  {analysisResult.what_to_do_now && analysisResult.what_to_do_now.length > 0 && (
                    <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        <span>What To Do Now</span>
                      </div>
                      <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300 pl-5 list-disc leading-relaxed">
                        {analysisResult.what_to_do_now.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Treatment Plan */}
                  {analysisResult.treatment && analysisResult.treatment.length > 0 && (
                    <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span>Recommended Treatment Plan</span>
                      </div>
                      <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300 pl-5 list-disc leading-relaxed">
                        {analysisResult.treatment.map((tr, idx) => (
                          <li key={idx}>{tr}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sources / References */}
                  {analysisResult.sources && analysisResult.sources.length > 0 && (
                    <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs uppercase tracking-wider">
                        <span>Agronomic Sources</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 transition-colors"
                          >
                            <span>{src.title}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trigger What-If Simulation Button */}
                  {analysisResult.show_whatif && onNavigateToWhatIf && (
                    <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl shadow-sm flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                          Evaluate Treatment Timing Risk
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Simulate treatment outcomes based on live micro-climate weather forecasts.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateToWhatIf(predictResult.crop, predictResult.disease, predictResult.confidence)}
                        className="px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white dark:text-zinc-950 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Test Action in What-If</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
