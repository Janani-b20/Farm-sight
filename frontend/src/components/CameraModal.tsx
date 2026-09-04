import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n/translations';

interface CameraModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, previewUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  language,
  isOpen,
  onClose,
  onCapture,
}) => {
  const t = translations[language];
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    setIsInitializing(true);
    setCameraError(null);

    // 1. Environment check (Secure Context: HTTPS or localhost)
    const isSecureContext =
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!isSecureContext) {
      console.log('[Camera] environment check failed - insecure context:', window.location.protocol, window.location.hostname);
      const secureMsg =
        language === 'ta'
          ? 'கேமராவைப் பயன்படுத்த பாதுகாப்பான இணைப்பு (HTTPS) தேவை. புகைப்படத்தை பதிவேற்றலாம்.'
          : language === 'hi'
          ? 'कैमरा का उपयोग करने के लिए सुरक्षित कनेक्शन (HTTPS) आवश्यक है। आप फोटो अपलोड कर सकते हैं।'
          : 'Camera access requires a secure connection (HTTPS). Please upload a photo instead.';
      setCameraError(secureMsg);
      setIsInitializing(false);
      return;
    }

    // 2. MediaDevices check
    console.log('[Camera] navigator.mediaDevices:', navigator.mediaDevices);
    console.log('[Camera] navigator.mediaDevices?.getUserMedia:', navigator.mediaDevices?.getUserMedia);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('[Camera] mediaDevices or getUserMedia is undefined');
      setCameraError('Camera access is not supported in this browser/context. Please upload a photo.');
      setIsInitializing(false);
      return;
    }

    let stream: MediaStream | null = null;
    console.log('[Camera] camera permission request start - facingMode:', mode);

    try {
      // 3. Try preferred facingMode constraint first
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      console.log('[Camera] camera stream success (facingMode):', stream);
    } catch (firstErr: any) {
      console.warn('[Camera] facingMode request failed:', firstErr?.name, firstErr?.message);

      // Fallback constraint retry for desktop webcams that reject facingMode
      if (firstErr.name !== 'NotAllowedError' && firstErr.name !== 'PermissionDeniedError') {
        try {
          console.log('[Camera] retrying with basic constraint { video: true, audio: false }');
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          console.log('[Camera] camera stream success (fallback constraint):', stream);
        } catch (retryErr: any) {
          console.error('[Camera] error', retryErr?.name, retryErr?.message);
          throw retryErr;
        }
      } else {
        console.error('[Camera] error', firstErr?.name, firstErr?.message);
        throw firstErr;
      }
    }

    // 4. Device check: confirm at least one videoinput device exists
    try {
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('[Camera] enumerated devices:', devices);
        const hasVideoInput = devices.some((d) => d.kind === 'videoinput');
        if (!hasVideoInput) {
          console.warn('[Camera] no videoinput device found');
          if (stream) {
            stream.getTracks().forEach((t) => t.stop());
          }
          setCameraError(t.cameraUnavailableMsg || 'Camera is unavailable on this device. You can upload a photo instead.');
          setIsInitializing(false);
          return;
        }
      }
    } catch (enumErr: any) {
      console.warn('[Camera] enumerateDevices check error:', enumErr);
    }

    // 5. Attach stream to video element
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
      } catch (playErr: any) {
        console.warn('[Camera] video play error:', playErr);
      }
    }
    setIsInitializing(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `crop_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);

      stopCamera();
      onCapture(file, previewUrl);
      onClose();
    }, 'image/jpeg', 0.92);
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1D2A20] text-white rounded-3xl w-full max-w-lg overflow-hidden border border-sage-500/30 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm md:text-base text-white">{t.takePhoto}</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-sage-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative flex-1 bg-black min-h-[320px] flex items-center justify-center overflow-hidden">
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1D2A20]">
              <p className="text-sm font-medium text-sage-200 animate-pulse">{t.initializingCamera || 'Starting camera...'}</p>
            </div>
          )}

          {cameraError ? (
            <div className="p-6 text-center space-y-4 max-w-xs">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm text-sage-100 font-medium leading-relaxed">{cameraError}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Controls Footer */}
        <div className="p-4 bg-[#1D2A20] border-t border-white/10 flex items-center justify-around">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
          >
            {t.cancel || 'Cancel'}
          </button>

          {!cameraError && (
            <>
              <button
                type="button"
                onClick={handleCapture}
                disabled={isInitializing}
                className="w-16 h-16 rounded-full bg-white text-[#2F5436] flex items-center justify-center shadow-lg active:scale-95 transition-all border-4 border-[#2F5436] font-bold"
              >
                <div className="w-10 h-10 rounded-full bg-[#2F5436] text-white flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
              </button>

              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Switch Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
