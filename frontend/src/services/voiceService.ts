import { Language } from '../types';

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export interface ITTSProvider {
  speak(text: string, lang: Language, options?: TTSOptions): void;
  stop(): void;
  isSpeaking(): boolean;
}

/**
 * Enhanced Browser SpeechSynthesis Provider.
 * Safely searches for regional voices (ta-IN, hi-IN, en-IN) and listens for `onvoiceschanged`.
 *
 * CRITICAL DIRECTIVE:
 * Never fall back to an English voice to pronounce Tamil text.
 * If no native Tamil voice is found on the device, return an explicit error state.
 */
class BrowserTTSProvider implements ITTSProvider {
  private speaking = false;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.populateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.populateVoices();
        };
      }
    }
  }

  private populateVoices(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices() || [];
    }
  }

  private findVoice(lang: Language): SpeechSynthesisVoice | null {
    this.populateVoices();
    const voices = this.cachedVoices;

    if (!voices || voices.length === 0) return null;

    if (lang === 'ta') {
      // Look strictly for a Tamil voice (ta-IN, ta_IN, or lang starting with ta)
      const taVoice = voices.find((v) => {
        const vLang = (v.lang || '').toLowerCase().replace('_', '-');
        return vLang === 'ta-in' || vLang.startsWith('ta');
      });
      return taVoice || null;
    }

    if (lang === 'hi') {
      const hiVoice = voices.find((v) => {
        const vLang = (v.lang || '').toLowerCase().replace('_', '-');
        return vLang === 'hi-in' || vLang.startsWith('hi');
      });
      return hiVoice || null;
    }

    // Default English: prefer en-IN, then any en voice
    const enInVoice = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      return vLang === 'en-in';
    });
    if (enInVoice) return enInVoice;

    const enVoice = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      return vLang.startsWith('en');
    });
    return enVoice || null;
  }

  private getLangCode(lang: Language): string {
    switch (lang) {
      case 'ta':
        return 'ta-IN';
      case 'hi':
        return 'hi-IN';
      default:
        return 'en-IN';
    }
  }

  speak(text: string, lang: Language, options?: TTSOptions): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis is not supported in this browser.');
      if (options?.onError) options.onError('Speech synthesis not supported');
      return;
    }

    this.stop();

    if (!text || text.trim() === '') return;

    const matchedVoice = this.findVoice(lang);

    // CRITICAL REQUIREMENT: For Tamil, if no Tamil voice exists on the browser/device,
    // do NOT fall back to an English voice to pronounce Tamil text.
    if (lang === 'ta' && !matchedVoice) {
      console.warn('Tamil voice unavailable on this browser/device.');
      if (options?.onError) {
        options.onError('Tamil voice unavailable on this device');
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.getLangCode(lang);
    utterance.rate = options?.rate || 0.95;
    utterance.pitch = options?.pitch || 1.0;

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      this.speaking = true;
    };

    utterance.onend = () => {
      this.speaking = false;
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      this.speaking = false;
      if (options?.onError) options.onError(e);
    };

    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.speaking = false;
  }

  isSpeaking(): boolean {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking;
    }
    return this.speaking;
  }
}

// Active singleton instance
let activeProvider: ITTSProvider = new BrowserTTSProvider();

export const setTTSProvider = (provider: ITTSProvider) => {
  activeProvider = provider;
};

export const getTTSProvider = (): ITTSProvider => {
  return activeProvider;
};
