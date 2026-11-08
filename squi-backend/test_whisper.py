
import whisper

print("Loading Whisper model...")

model = whisper.load_model("base")

print("Whisper is ready!")

result = model.transcribe(
    "./test_audio.webm",
    fp16=False
)

print("\nRecognized speech:")
print(result["text"])

print("\nDetected language:")
print(result["language"])
