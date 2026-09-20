import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations } from '../i18n/translations';

interface VoiceButtonProps {
  textToSpeak: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'compact';
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  textToSpeak,
  className = '',
  variant = 'primary',
}) => {
  const { language, isSpeaking, activeSpeakingText, speakText, stopSpeech } = useApp();
  const t = translations[language];

  const isCurrentActive = isSpeaking && activeSpeakingText === textToSpeak;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentActive) {
      stopSpeech();
    } else {
      speakText(textToSpeak);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        type="button"
        aria-label={isCurrentActive ? t.stopButton : t.listenButton}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 ${
          isCurrentActive
            ? 'bg-[#D99A45] text-white border border-amber-500 ring-2 ring-amber-300 animate-pulse'
            : 'bg-[#2F5436] hover:bg-[#234029] text-white border border-sage-700'
        } ${className}`}
      >
        {isCurrentActive ? (
          <>
            <VolumeX className="w-4 h-4 text-white shrink-0" />
            <span>{t.stopButton}</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 text-white shrink-0" />
            <span>{t.listenButton}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`relative group flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 shadow-md active:scale-95 min-h-[48px] ${
        isCurrentActive
          ? 'bg-[#D99A45] text-white ring-2 ring-amber-300'
          : 'bg-[#2F5436] hover:bg-[#234029] text-white ring-2 ring-[#2F5436]/20'
      } ${className}`}
    >
      {isCurrentActive ? (
        <>
          <VolumeX className="w-5 h-5 shrink-0" />
          <span>{t.stopButton}</span>
          {/* Animated sound waves */}
          <div className="flex items-center gap-1 ml-1 h-4">
            <span className="w-1 bg-white rounded-full animate-wave-1"></span>
            <span className="w-1 bg-white rounded-full animate-wave-2"></span>
            <span className="w-1 bg-white rounded-full animate-wave-3"></span>
            <span className="w-1 bg-white rounded-full animate-wave-4"></span>
          </div>
        </>
      ) : (
        <>
          <Volume2 className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
          <span>{t.listenButton}</span>
        </>
      )}
    </button>
  );
};
