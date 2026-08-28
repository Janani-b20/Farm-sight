from gtts import gTTS
import os

def speak_tamil_advice(tamil_text, output_filename="farmer_advice.mp3"):
    """
    Converts pure Tamil explanation text into an audio MP3 file and plays it.
    """
    try:
        # Markdown asterisks and bullets clean-up for natural audio
        clean_text = tamil_text.replace('*', '').replace('•', '').strip()
        
        # Generate speech in Tamil
        tts = gTTS(text=clean_text, lang='ta', slow=False)
        tts.save(output_filename)
        print(f"\n[Audio Success]: '{output_filename}' generated successfully!")
        
        # Automatically play the audio file on Windows
        os.system(f"start {output_filename}")
        
    except Exception as e:
        print(f"\n[TTS Error]: {e}\n")