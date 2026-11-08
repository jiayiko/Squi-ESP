
import os
import tempfile

import whisper
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow your React development server to call FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper once when the backend starts
print("Loading Whisper...")
model = whisper.load_model("base")
print("Whisper is ready!")


@app.get("/")
def home():
    return {"message": "Squirrel backend is running!"}


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # Read uploaded audio bytes
    audio_data = await file.read()

    if not audio_data:
        raise HTTPException(
            status_code=400,
            detail="Audio file is empty"
        )

    # Preserve the uploaded file's extension
    suffix = os.path.splitext(file.filename or "")[1] or ".webm"
    temp_path = None

    try:
        # Save audio to a temporary file
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:
            temp_file.write(audio_data)
            temp_path = temp_file.name

        # Run Whisper speech recognition
        result = model.transcribe(
            temp_path,
            fp16=False,
            task="transcribe"
        )

        return {
            "transcript": result["text"].strip(),
            "language": result["language"]
        }

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
