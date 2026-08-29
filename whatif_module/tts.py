from gtts import gTTS
import os

def speak_tamil_advice(tamil_text: str, output_filename: str = "farmer_advice.mp3") -> str:
    """
    Converts pure Tamil explanation text into an audio MP3 file and plays it.
    Returns the file path on success, or empty string on failure.
    """
    try:
        # Markdown asterisks and bullets clean-up for natural audio
        clean_text = tamil_text.replace("*", "").replace("•", "").strip()

        # Generate speech in Tamil
        tts = gTTS(text=clean_text, lang='ta', slow=False)
        tts.save(output_filename)
        print(f"\n[Audio Success]: '{output_filename}' generated successfully!")

        # Automatically play the audio file on Windows
        os.system(f'start {output_filename}')
        
        return output_filename

    except Exception as e:
        print(f"\n[TTS Error]: {e}\n")
        return ""