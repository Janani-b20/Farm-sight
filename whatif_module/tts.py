"""
FarmSight - Multilingual Text-to-Speech Engine
Supports: Tamil (ta), English (en), Hindi (hi)
"""
import os
import subprocess
from gtts import gTTS

def text_to_speech(text: str, output_path: str = "advice.mp3", language: str = "ta", auto_play: bool = True) -> str:
    """
    Converts plain advisory text to audio in specified language ('ta', 'en', 'hi').
    Uses Windows native media player for zero-dependency playback.
    """
    try:
        lang = language.lower() if language.lower() in ["ta", "en", "hi"] else "ta"
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(output_path)

        if auto_play and os.path.exists(output_path):
            try:
                # Windows built-in media player playback (No third-party packages required)
                os.startfile(output_path)
            except Exception as play_err:
                print(f"[Audio Notice] Local playback device skipped: {play_err}")

        return output_path
    except Exception as e:
        print(f"[Error] TTS Synthesis failed: {e}")
        return ""