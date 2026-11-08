
import { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Bluetooth,
  Wifi,
  Circle,
  AudioLines,
  Play,
  Heart,
} from "lucide-react";
import squiImg from "./assets/squi.png";

import "./App.css";

function App() {
  const [status, setStatus] = useState("idle");
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState("");
  const  [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const startInProgressRef = useRef(false);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!audioURL) return;

    return () => URL.revokeObjectURL(audioURL);
  }, [audioURL]);

  const transcribeAudio = async (audioBlob) => {
    if(!audioBlob){
      alert("No audio to transcribe");
      return;
    }

    setIsTranscribing(true);
    setTranscript("");

    try {
      // prepare audio for upload
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      // send audio to fastAPI
      const response = await fetch("http://127.0.0.1:8000/transcribe", {
        method: "POST",
        body: formData
      });

      if(!response.ok){
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      setTranscript(data.transcript);
      console.log("Transcription result:", data.transcript);
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Failed to transcribe audio. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  }

  async function startRecording() {
    if (startInProgressRef.current || mediaRecorderRef.current?.state === "recording") {
      return;
    }

    startInProgressRef.current = true;
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        clearInterval(timerRef.current);

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType,
        });

        setAudioBlob(blob);

        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setStatus("recorded");

        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        transcribeAudio(blob);
      };

      recorder.start();

      setRecordingTime(0);
      setStatus("recording");

      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );

        setRecordingTime(elapsed);
      }, 250);

    } catch (error) {
      console.error("Microphone error:", error);
      setStatus("idle");
      alert("Please allow microphone access to talk to your squirrel.");
    } finally {
      startInProgressRef.current = false;
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }

    clearInterval(timerRef.current);
  }

  const isRecording = status === "recording";

  return (
    <div className="app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={19} />
          </div>
          <span>Kemiri Kenari</span>
        </div>

        <div className="connection">
          <span className="connection-dot" />
          <span>ESP32-S3 learning</span>
        </div>
      </header>

      <main className="main-content">

        <section className="welcome">
          <p className="eyebrow">HELLO CUPPY</p>
          <h1>A little moment<br />with <span>Squiwing</span></h1>
          <p className="welcome-text">
            Squiwing lope you.
          </p>
        </section>

        <section className="pet-card glass-card">

          <div className="pet-card-top">
            <div className="pet-label">
              <span className="live-dot" />
              SQUI
            </div>

            <button className="icon-button" aria-label="Favorite">
              <Heart size={18} />
            </button>
          </div>

          <div className="pet-display">
            <div className={`squirrel-glow ${isRecording ? "active" : ""}`} />

            <div className={`squirrel-character ${isRecording ? "listening" : ""}`}>
              <img src={squiImg} alt="Squi" width={150} />
            </div>

            {isRecording && (
              <div className="listening-label">
                <AudioLines size={15} />
                Listening
              </div>
            )}
          </div>

          <div className="pet-message">
            <h2>
              {isRecording
                ? "Squi is listening to you.."
                : status === "recorded"
                ? isTranscribing ? "🐿️ Squi is trying to understand..." 
                : `You said: ${transcript}`
                : "Hello, len len."}
            </h2>

            <p>
              {isRecording
                ? "Tell me what's on your mind..."
                : status === "recorded"
                ? "Squi is happy to hear you out!"
                : "What would you like to tell me today?"}
            </p>
          </div>

          <div className="waveform">
            {Array.from({ length: 29 }).map((_, index) => (
              <span
                key={index}
                className={isRecording ? "wave-active" : ""}
                style={{
                  "--bar-height": `${12 + Math.abs(Math.sin(index * 0.7)) * 24}px`,
                  "--delay": `${index * 0.035}s`,
                }}
              />
            ))}
          </div>

          <div className="recording-time">
            {String(Math.floor(recordingTime / 60)).padStart(2, "0")}
            :
            {String(recordingTime % 60).padStart(2, "0")}
          </div>

          <div className="record-controls">
            {!isRecording ? (
              <button
                className="mic-button"
                onClick={startRecording}
                disabled={status === "requesting"}
              >
                <Mic size={21} />
                <span>{status === "requesting" ? "Connecting..." : "Start talking"}</span>
              </button>
            ) : (
              <button
                className="mic-button recording-button"
                onClick={stopRecording}
              >
                <MicOff size={21} />
                <span>Finish recording</span>
              </button>
            )}
          </div>

          <p className="record-hint">
            {isRecording
              ? "Tap when you're finished speaking"
              : "Tap the button to start a conversation"}
          </p>

          {audioURL && (
            <div className="audio-result">
              <div className="audio-result-icon">
                <Volume2 size={19} />
              </div>

              <div className="audio-result-info">
                <strong>Your recording</strong>
                <span>Listen to what you said</span>
              </div>

              <audio controls src={audioURL} />
            </div>
          )}
        </section>

        <section className="bottom-info">
          <div className="info-card glass-card">
            <div className="info-icon">
              <Wifi size={19} />
            </div>
            <div>
              <strong>Wi-Fi</strong>
              <span>Ready to connect</span>
            </div>
          </div>

          <div className="info-card glass-card">
            <div className="info-icon">
              <Bluetooth size={19} />
            </div>
            <div>
              <strong>ESP32-S3</strong>
              <span>Not connected</span>
            </div>
          </div>
        </section>

        <footer>
          <Sparkles size={13} />
          Made with a little love
        </footer>

      </main>
    </div>
  );
}

export default App;
