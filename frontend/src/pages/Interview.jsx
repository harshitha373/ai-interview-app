import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import * as blazeface from '@tensorflow-models/blazeface';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import "./Interview.css";
import Editor from "@monaco-editor/react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [questionCount, setQuestionCount] = useState(1);
  const [transcript, setTranscript] = useState("");
  const transcriptRef = useRef("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalTimeLeft, setTotalTimeLeft] = useState(2700); // 45 minutes for 20 questions
  const recognitionRef = useRef(null);
  const hasStartedRef = useRef(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [endStatus, setEndStatus] = useState("");
  const isEndingRef = useRef(false);
  const [isCodingMode, setIsCodingMode] = useState(false);
  const isCodingModeRef = useRef(false);
  useEffect(() => {
    isCodingModeRef.current = isCodingMode;
  }, [isCodingMode]);
  const [code, setCode] = useState("// Write your solution here\n\nfunction solution() {\n  console.log('Hello from Shnoor AI Sandbox!');\n  return true;\n}");
  const [interviewType, setInterviewType] = useState("Technical");
  const [interviewerPersona, setInterviewerPersona] = useState("Technical Specialist");


  const proctorIntervalRef = useRef(null);
  const globalTimerRef = useRef(null);
  const localModelIntervalRef = useRef(null);
  const audioMonitorIntervalRef = useRef(null);
  const snapshotIntervalRef = useRef(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [proctoringStatus, setProctoringStatus] = useState("Initializing...");
  const [isFlagged, setIsFlagged] = useState(false);
  const isFlaggedRef = useRef(false);
  const isRecordingRef = useRef(false);
  const lastVoiceViolationRef = useRef(0);
  const [notification, setNotification] = useState("");
  const [faceCount, setFaceCount] = useState(0);
  const multiFaceCounterRef = useRef(0);
  const noFaceCounterRef = useRef(0);
  const cheatingCounterRef = useRef(0);
  const isAiSpeakingRef = useRef(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const isProcessingRef = useRef(false);
  const voiceGraceRef = useRef(false);
  const mobileCounterRef = useRef(0);
  const lastLogTimeRef = useRef(0);
  const lastViolationTypeRef = useRef(null);
  const baselineRef = useRef(null);
  const calibrationFramesRef = useRef(0);
  const lastTabSwitchRef = useRef(0);
  const socketRef = useRef(null);
  const preloadedModelsRef = useRef(null);

  const messagesEndRef = useRef(null);
  const loadingRef = useRef(loading);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let timer;
    if (isRecording && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRecording) {
      stopRecording();
    }
    return () => clearInterval(timer);
  }, [isRecording, timeLeft]);

  // Re-attach stream whenever video element might change (e.g., entering coding mode)
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCodingMode, interviewStarted]);

  // Global Session Timer (Reliable Version)
  const startGlobalTimer = () => {
    if (globalTimerRef.current) return; // Prevent double start
    const timerId = setInterval(() => {
      setTotalTimeLeft(prev => {
        // Only decrement if not loading (AI thinking)
        if (loadingRef.current) return prev;

        if (prev <= 1) {
          clearInterval(timerId);
          handleEndSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    globalTimerRef.current = timerId;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    isRecordingRef.current = false;
    voiceGraceRef.current = true;
    setTimeout(() => { voiceGraceRef.current = false; }, 3000); // Increased to 3s to allow candidate to settle
  };

  // 1. Initial Page Load (Auth & Tab Switching)
  useEffect(() => {
    isEndingRef.current = false;
    setIsEnding(false);

    // Preload ML models in background to prevent UI freeze during start
    Promise.all([blazeface.load(), cocoSsd.load()])
      .then(([faceModel, objectModel]) => {
        preloadedModelsRef.current = { faceModel, objectModel };
        console.log("Models preloaded successfully in background");
      })
      .catch(err => console.error("Background model preload failed", err));

    try {
      const userStr = localStorage.getItem("user");
      if (userStr && userStr !== "undefined") {
        setUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error("Failed to parse user");
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && interviewStarted) {
        const now = Date.now();
        if (now - lastTabSwitchRef.current > 10000) { // 10s debounce for tab switching
          lastTabSwitchRef.current = now;
          axios.post(`${API_BASE}/api/interview/${id}/flag`, {
            reason: "Candidate switched tab/window",
            type: "tab_switch"
          }).catch(err => console.error("Error logging tab switch:", err));
          setNotification("WARNING: Tab switching detected!");
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      isEndingRef.current = true;
      stopCameraAndSpeech();
    };
  }, [id, interviewStarted]);

  // 2. Start Interview Sequence
  const startInterview = async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    setInterviewStarted(true);

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/interview/${id}/start`);
      const firstQ = res.data.question;
      const type = res.data.interviewType || "Technical";
      const persona = res.data.persona || (type === "HR" ? "Senior HR Director" : "Technical Specialist");

      setInterviewType(type);
      setInterviewerPersona(persona);
      setMessages([{ role: 'ai', content: firstQ }]);
      if (res.data.type === 'CODING' && type !== 'HR') setIsCodingMode(true);
      speakText(firstQ);
      setupProctoring();
      startGlobalTimer();
    } catch (err) {
      console.error(err);
      alert("Error starting interview");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceViolation = () => {
    const now = Date.now();
    if (now - lastVoiceViolationRef.current > 4000) { // Increased debounce to 4 seconds to avoid spam
      lastVoiceViolationRef.current = now;
      const context = isAiSpeaking ? "while AI was speaking" : loading ? "while AI was thinking" : "while mic was off";
      const reason = `Voice detected ${context}`;

      console.log(`[VOICE] Logging Violation: ${reason}`);
      axios.post(`${API_BASE}/api/interview/${id}/flag`, {
        reason,
        type: "voice"
      }).catch(err => console.error("Error logging voice violation:", err));
      setNotification(`WARNING: ${reason}`);
      setTimeout(() => setNotification(""), 4000);
    }
  };

  const setupProctoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8' : 'video/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorder.start(1000);

      setProctoringStatus("Connecting...");
      socketRef.current = io(API_BASE);
      socketRef.current.on("violation", (data) => {
        if (data.type === 'voice') handleVoiceViolation();
        else setNotification(`WARNING: ${data.reason}`);
      });

      proctorIntervalRef.current = setInterval(() => {
        if (videoRef.current && canvasRef.current && !isEndingRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          canvas.width = 160;
          canvas.height = 120;
          context.drawImage(videoRef.current, 0, 0, 160, 120);
          socketRef.current.emit("proctor-frame", {
            image: canvas.toDataURL('image/jpeg', 0.2), // Reduced quality for faster socket transport
            interviewId: id
          });
        }
      }, 1000);

      console.log("Initializing Proctoring Engine...");
      const startMonitoring = (faceModel, objectModel) => {
        console.log("Proctoring Models Active");
        setProctoringStatus("Monitoring Active");
        localModelIntervalRef.current = setInterval(() => {
          if (!isEndingRef.current) {
            detectProctoring(faceModel, objectModel).catch(err => console.error("Proctoring Loop Error:", err));
          }
        }, 500); // 500ms for precise 5-second detection window (10 frames)
      };

      if (preloadedModelsRef.current) {
        startMonitoring(preloadedModelsRef.current.faceModel, preloadedModelsRef.current.objectModel);
      } else {
        Promise.all([blazeface.load(), cocoSsd.load()]).then(([faceModel, objectModel]) => {
          preloadedModelsRef.current = { faceModel, objectModel };
          startMonitoring(faceModel, objectModel);
        }).catch(err => {
          console.error("Model Loading Failed:", err);
          setProctoringStatus("AI Error - Please Refresh");
        });
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      audioMonitorIntervalRef.current = setInterval(() => {
        if (isEndingRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        // Human vocal range is typically 300Hz to 3400Hz.
        // With fftSize 2048, bin size is ~23Hz. 
        // Bins 13 to 150 roughly cover 300Hz - 3500Hz.
        let voiceEnergy = 0;
        let voicePeak = 0;
        let count = 0;

        for (let i = 13; i < 150; i++) {
          if (dataArray[i] > voicePeak) voicePeak = dataArray[i];
          voiceEnergy += dataArray[i];
          count++;
        }

        const avgVoiceEnergy = voiceEnergy / count;

        // Detect human voice while ignoring background noise:
        // Raised thresholds (100 peak, 45 avg) to avoid false alerts from ambient noise
        if (voicePeak > 100 && avgVoiceEnergy > 45 &&
          !isRecordingRef.current &&
          !isAiSpeakingRef.current &&
          !voiceGraceRef.current) {
          handleVoiceViolation();
        }
      }, 500);

      snapshotIntervalRef.current = setInterval(() => {
        if (videoRef.current && canvasRef.current && !isEndingRef.current) {
          const canvas = canvasRef.current;
          canvas.width = 320;
          canvas.height = 240;
          canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 320, 240);
          axios.post(`${API_BASE}/api/interview/${id}/snapshot`, { image: canvas.toDataURL('image/jpeg', 0.5) })
            .catch(err => console.warn("[SNAPSHOT] Failed to save frame:", err.message));
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      setProctoringStatus("Camera Error");
      setIsFlagged(true);
    }
  };

  const detectProctoring = async (faceModel, objectModel) => {
    const startTime = Date.now();
    try {
      if (!videoRef.current || videoRef.current.readyState < 2 || isEndingRef.current) return;

      // 1. Face Detection (Fast)
      const facesRaw = await faceModel.estimateFaces(videoRef.current, false);
      let faces = facesRaw.filter(f => {
        const prob = Array.isArray(f.probability) ? f.probability[0] : f.probability;
        return prob > 0.50; // Lowered to 0.50 to handle glasses/glare reflections
      });

      setFaceCount(faces.length);

      // 2. Object Detection (Sensitivity increased for mobile)
      const objects = await objectModel.detect(videoRef.current, 10, 0.15);
      const hasPhone = objects.some(obj => ["cell phone", "telephone", "remote", "book", "laptop", "tablet", "electronic device"].includes(obj.class));

      let statusMsg = "Monitoring Active";
      let flagged = false;
      let vType = null;

      // --- LOGIC CHECKS ---

      if (hasPhone) {
        mobileCounterRef.current++;
        if (mobileCounterRef.current >= 1) { // Immediate detection for phones
          statusMsg = "Phone/Device Detected";
          vType = "mobile";
          flagged = true;
        }
      } else {
        // Delayed reset: only reset if not detected for 2 consecutive active frames
        if (mobileCounterRef.current > 0) {
          mobileCounterRef.current--;
        }
      }

      if (faces.length > 1) {
        multiFaceCounterRef.current++;
        if (multiFaceCounterRef.current >= 6) { // Increased to 6 (3s) to prevent false alerts from brief background movement
          statusMsg = "Multiple faces detected!";
          vType = "multi_face";
          flagged = true;
        }
      } else {
        multiFaceCounterRef.current = 0;
      }

      if (!flagged && faces.length === 0) {
        noFaceCounterRef.current++;
        if (noFaceCounterRef.current >= 10) { // Increased to 10 consecutive frames (5s) to allow for blinking, adjusting glasses, and glare drops
          statusMsg = "No face detected!";
          vType = "no_face";
          flagged = true;
        }
      } else if (faces.length === 1) {
        noFaceCounterRef.current = 0;

        // 3. Eye Movement Tracking (Sensitivity Optimized)
        if (!flagged && !isCodingModeRef.current) { // Bypass eye movement checks during the coding sandbox to prevent false positives when typing
          const landmarks = faces[0].landmarks;
          const rEye = landmarks[0];
          const lEye = landmarks[1];
          const nose = landmarks[2];

          const eyeDist = Math.sqrt(Math.pow(rEye[0] - lEye[0], 2) + Math.pow(rEye[1] - lEye[1], 2));
          const eyeCenter = [(rEye[0] + lEye[0]) / 2, (rEye[1] + lEye[1]) / 2];
          const hOffset = Math.abs(nose[0] - eyeCenter[0]) / (eyeDist || 1);
          const vOffset = (nose[1] - eyeCenter[1]) / (eyeDist || 1); // Remove Math.abs to track UP vs DOWN
          const distToLeftEye = Math.abs(nose[0] - lEye[0]);
          const distToRightEye = Math.abs(nose[0] - rEye[0]);
          const symmetryRatio = distToLeftEye / (distToRightEye || 1);

          // --- SMART CALIBRATION ---
          // Use first 15 detected frames to find candidate's natural "center"
          if (calibrationFramesRef.current < 15) {
            if (!baselineRef.current) baselineRef.current = [0, 0, 0, 0];
            baselineRef.current[0] += hOffset / 15;
            baselineRef.current[1] += vOffset / 15;
            baselineRef.current[2] += symmetryRatio / 15;
            baselineRef.current[3] += eyeDist / 15;
            calibrationFramesRef.current++;
          }

          const b = baselineRef.current || [0.08, 0.4, 1.0, 50];

          // --- STABILITY CHECK (Blink Prevention) ---
          // If eye distance is zero or extremely small, it's a blink/glitch. Skip frame.
          const isUnstable = eyeDist < 10;

          if (!isUnstable) {
            const hDiff = Math.abs(hOffset - b[0]);
            const vDiff = vOffset - b[1];
            const sDiff = Math.abs(symmetryRatio - b[2]);

            // Enhanced sensitivity thresholds
            const isLookingAway = hDiff > 0.07 || vDiff < -0.06 || vDiff > 0.15 || sDiff > 0.5;

            if (isLookingAway) {
              cheatingCounterRef.current++;
              // Trigger faster (2.5s instead of 3.5s)
              if (cheatingCounterRef.current >= 8) { // Relaxed to 8 frames (4 seconds) to prevent false alerts
                statusMsg = "Suspicious eye movement!";
                vType = "cheating";
                flagged = true;
              }
            } else {
              // Reset counter if they look back to center
              cheatingCounterRef.current = 0;
            }
          } else {
            // If unstable (blink), we just pause the counter (don't increment, don't reset)
            // This allows the 5-second timer to be "blink-safe"
          }
        }
      } else if (faces.length > 1) {
        noFaceCounterRef.current = 0;
      }

      setProctoringStatus(statusMsg);
      setIsFlagged(flagged);

      const now = Date.now();
      const timeSinceLastLog = now - lastLogTimeRef.current;

      if (flagged && (vType !== lastViolationTypeRef.current || timeSinceLastLog > 8000)) {
        console.log(`[PROCTOR] Violation Triggered: ${vType} - ${statusMsg}`);
        lastLogTimeRef.current = now;
        lastViolationTypeRef.current = vType;

        axios.post(`${API_BASE}/api/interview/${id}/flag`, {
          reason: statusMsg,
          type: vType
        }).catch(err => console.error("Flag sync error:", err));

        setNotification(`ALERT: ${statusMsg}`);
        setTimeout(() => setNotification(""), 5000);
      } else if (!flagged) {
        lastViolationTypeRef.current = null;
      }

      const duration = Date.now() - startTime;
      if (duration > 500) {
        console.warn(`[PROCTOR] Loop latency: ${duration}ms (Threshold: 700ms)`);
      }
    } catch (err) {
      console.error("Critical error in proctoring loop:", err);
    }
  };

  const speakText = (text) => {
    if (isEndingRef.current) return;
    setIsAiSpeaking(true);
    isAiSpeakingRef.current = true;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
        voiceGraceRef.current = true; // Grace period before mic starts
        setTimeout(() => {
          if (!isEndingRef.current) toggleRecording(true);
          setTimeout(() => { voiceGraceRef.current = false; }, 800); // Shortened grace
        }, 600);
      };
      utterance.onerror = () => {
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
      };
      window.speechSynthesis.speak(utterance);
      // Safety timeout in case onend never fires (browser bug)
      setTimeout(() => {
        if (isAiSpeakingRef.current) {
          setIsAiSpeaking(false);
          isAiSpeakingRef.current = false;
          toggleRecording(true);
        }
      }, (text.length * 100) + 2000);
    } else {
      setIsAiSpeaking(false);
      isAiSpeakingRef.current = false;
      if (!isEndingRef.current) toggleRecording(true);
    }
  };

  const uploadVideo = () => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.onstop = async () => {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: mediaRecorderRef.current.mimeType });
            const formData = new FormData();
            formData.append('video', blob, `interview_${id}.webm`);
            await axios.post(`${API_BASE}/api/interview/${id}/video`, formData).catch(() => { });
          }
          resolve();
        };
        mediaRecorderRef.current.stop();
      } else resolve();
    });
  };

  const stopCameraAndSpeech = () => {
    [proctorIntervalRef, globalTimerRef, localModelIntervalRef, audioMonitorIntervalRef, snapshotIntervalRef].forEach(ref => {
      if (ref.current) clearInterval(ref.current);
      ref.current = null;
    });

    // Explicitly stop all tracks in the persistent stream ref
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleEndSession = async () => {
    if (window.confirm("End interview and save results?")) {
      isEndingRef.current = true;
      setIsEnding(true);
      setLoading(true);

      // 1. Stop everything immediately to save resources
      stopCameraAndSpeech();

      // 2. Trigger background evaluation
      axios.post(`${API_BASE}/api/interview/${id}/finish`).catch(err => {
        console.error("Evaluation trigger error:", err);
      });

      // 3. Handle Video Upload
      setEndStatus("Saving video recording... (This may take a moment)");

      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          await new Promise((resolve) => {
            mediaRecorderRef.current.onstop = async () => {
              if (recordedChunksRef.current.length > 0) {
                const blob = new Blob(recordedChunksRef.current, { type: mediaRecorderRef.current.mimeType });
                const formData = new FormData();
                formData.append('video', blob, `interview_${id}.webm`);

                setEndStatus("Uploading video to secure vault...");
                await axios.post(`${API_BASE}/api/interview/${id}/video`, formData).catch(err => console.error("Video upload failed:", err));
              }
              resolve();
            };
            mediaRecorderRef.current.stop();
          });
        }
      } catch (err) {
        console.error("Finalization error:", err);
      }

      setLoading(false);
      setEndStatus("");
      setShowFeedback(true); // Show feedback modal instead of redirecting
    }
  };

  const submitFeedback = async () => {
    setSubmittingFeedback(true);
    try {
      await axios.post(`${API_BASE}/api/interview/${id}/feedback`, {
        userId: user?.id || null,
        rating: feedbackRating,
        feedbackText: feedbackText
      });
      navigate("/candidate");
    } catch (err) {
      console.error("Feedback submission error:", err);
      // Fallback: still navigate to dashboard so candidate isn't stuck
      navigate("/candidate");
    }
  };

  const [language, setLanguage] = useState("javascript");

  const handleSendVoiceAnswer = async (spokenText) => {
    if (!spokenText.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: spokenText }]);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/interview/${id}/answer`, { answer: spokenText });

      const aiReply = res.data.nextQuestion;
      if (!aiReply) throw new Error("Empty AI response");

      if (!isEndingRef.current) {
        const isCoding = res.data.type === 'CODING' && interviewType !== 'HR';
        console.log(`[UI] Received response. Type: ${res.data.type}, IsCoding: ${isCoding}`);

        // Dynamically toggle coding mode based on the current question type
        if (isCoding) {
          setIsCodingMode(true);
          setLanguage(res.data.language || "javascript");
        } else {
          setIsCodingMode(false);
        }

        setMessages(prev => [...prev, { role: 'ai', content: aiReply }]);
        speakText(aiReply);
        setQuestionCount(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      setNotification("AI connection issue. Restarting microphone...");
      setTimeout(() => toggleRecording(true), 1500); // Fail-safe: restart mic if AI hangs
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    // Treat code as answer
    const codeAnswer = `[SUBMITTED CODE]\n\n${code}`;
    handleSendVoiceAnswer(codeAnswer);
  };

  const toggleRecording = (forceStart = false) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return setNotification("Speech recognition not supported.");
    if (isRecording && !forceStart) return stopRecording();
    if (isRecording && forceStart) return;

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      isRecordingRef.current = true;
      setTranscript("");
      transcriptRef.current = "";
      setTimeLeft(60);
    };

    recognition.onresult = (e) => {
      let cur = "";
      for (let i = e.resultIndex; i < e.results.length; ++i) cur += e.results[i][0].transcript;
      setTranscript(cur);
      transcriptRef.current = cur;
    };

    recognition.onend = () => {
      setIsRecording(false);
      isRecordingRef.current = false;
      // Start a brief 3s grace period after candidate stops talking
      voiceGraceRef.current = true;
      setTimeout(() => { voiceGraceRef.current = false; }, 3000);

      if (transcriptRef.current.trim().length > 0 && !isAiSpeakingRef.current && !loading) {
        handleSendVoiceAnswer(transcriptRef.current);
        setTranscript("");
        transcriptRef.current = "";
      }
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.start();
  };

  const finishInterviewSilently = async () => {
    isEndingRef.current = true;
    setIsEnding(true);
    setLoading(true);
    await uploadVideo();
    stopCameraAndSpeech();
    await axios.post(`${API_BASE}/api/interview/${id}/finish`).catch(() => { });
    navigate("/candidate");
  };

  return (
    <div className="interview-page">
      {notification && <div className="custom-toast animate-fade">⚠️ {notification}</div>}
      <header className="interview-header">
        <div className="header-brand">
          <div className="global-logo-container" style={{ height: '42px', width: '42px', marginRight: '12px' }}>
            <img src="/shnoor_logo.png" alt="Shnoor AI" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ color: 'var(--int-text)' }}>{isCodingMode ? "Coding Challenge" : "Live Interview Session"}</h1>
        </div>
        <div className="proctoring-status-container">
          <div className="status-badge-hud" style={{ background: totalTimeLeft < 300 ? '#fee2e2' : '#f1f5f9', color: totalTimeLeft < 300 ? '#ef4444' : '#0f172a' }}>
            <IconClock />
            <span style={{ fontWeight: 800 }}>{formatTime(totalTimeLeft)}</span>
          </div>
          <div className="status-badge-hud">
            <div className={`status-dot ${isFlagged ? 'warning' : (proctoringStatus === 'Monitoring Active' ? 'active' : '')}`}></div>
            <span>{proctoringStatus}</span>
          </div>
          <button className="btn-finish" onClick={handleEndSession}>End Interview</button>
        </div>
      </header>

      {!interviewStarted && (
        <div className="loading-overlay" style={{ background: 'var(--int-bg)', zIndex: 2000 }}>
          <div className="global-logo-container" style={{ padding: '12px', borderRadius: '16px', marginBottom: '32px', width: '104px', height: '104px' }}>
            <img src="/shnoor_logo.png" alt="Shnoor AI" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ color: 'var(--int-text)', fontSize: '2.5rem', fontWeight: '900', marginBottom: '8px' }}>Ready to start?</h2>
          <p style={{ color: 'var(--int-muted)', fontSize: '1.1rem', marginBottom: '40px' }}>AI will ask questions via voice.</p>
          <button className="btn-mic-main" style={{ width: 'auto', padding: '0 40px', borderRadius: '14px', height: '56px', fontSize: '1.1rem', fontWeight: '800', background: 'var(--int-primary)' }} onClick={() => {
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
            startInterview();
          }}>Start Interview Now</button>
        </div>
      )}

      <div className={`interview-body ${isCodingMode ? 'coding-mode' : ''}`}>
        {!isCodingMode && (
          <div className="video-section">
            <div className="camera-card">
              <video ref={videoRef} autoPlay playsInline muted />
              <div className="hud-overlay">
                <div className={`hud-badge ${isFlagged ? 'danger' : ''}`}>
                  {isFlagged ? <>{proctoringStatus}</> : <>👤 Active ({faceCount} {faceCount === 1 ? 'Face' : 'Faces'})</>}
                </div>
              </div>
            </div>
            <div className="progress-hud">
              <div className="progress-header"><span>Assessment Progress</span><span>Question {questionCount} of 20</span></div>
              <div className="progress-bar-container"><div className="progress-bar-inner" style={{ width: `${(questionCount / 20) * 100}%` }}></div></div>
            </div>
          </div>
        )}

        <div className="ai-section">
          <div className="ai-card">
            {isCodingMode && (
              <div className="camera-card-mini">
                <video ref={videoRef} autoPlay playsInline muted />
                <div className="hud-overlay-mini">
                  <div className={`hud-badge ${isFlagged ? 'danger' : ''}`} style={{ fontSize: '10px', padding: '4px 8px' }}>
                    {isFlagged ? proctoringStatus : '👤 Active'}
                  </div>
                </div>
              </div>
            )}
            <div className="ai-header">
              <div className="ai-avatar"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg></div>
              <div className="ai-info"><h2>Solaris AI Interviewer</h2><p>{interviewerPersona}</p></div>
            </div>
            <div className="chat-history">
              {messages.map((m, i) => <div key={i} className={`message-bubble ${m.role === 'ai' ? 'message-ai' : 'message-user'}`}>{m.content}</div>)}
              {loading && <div className="message-bubble message-ai" style={{ fontStyle: 'italic', opacity: 0.7 }}>AI is analyzing...</div>}
              <div ref={messagesEndRef} />
            </div>
            {!isCodingMode && (
              <div className="interaction-bar">
                <div className={`interaction-status ${isRecording ? 'active' : isAiSpeaking || loading ? 'disabled' : ''}`}>{isRecording ? `Timer: ${timeLeft}s | Listening...` : isAiSpeaking ? "Mic Disabled - AI Speaking..." : loading ? "Mic Disabled - AI Thinking..." : "Mic will auto-start."}</div>
                <button className={`btn-mic-main ${isRecording ? 'recording' : ''}`} onClick={isRecording ? stopRecording : toggleRecording} disabled={loading}>
                  {isRecording ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>}
                </button>
                {transcript && isRecording && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{transcript}"</div>}
              </div>
            )}
          </div>
        </div>

        {isCodingMode && (
          <section className="coding-section">
            <div className="editor-header-bar">
              <div className="editor-lang-selector">
                <label>Language:</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="lang-dropdown"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="sql">SQL</option>
                  <option value="csharp">C#</option>
                  <option value="php">PHP</option>
                </select>
              </div>
              <span className="editor-title">Solution Sandbox</span>
            </div>
            <div className="editor-container">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v)}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  padding: { top: 16 }
                }}
              />
            </div>
            <div className="editor-footer" style={{ height: 'auto', padding: '16px' }}>
              <div className="editor-actions" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                <button className="btn-run" style={{ background: '#10b981', width: '100%', padding: '12px' }} onClick={submitCode} disabled={loading}>
                  {loading ? "Submitting..." : "Submit Solution"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {isEnding && !showFeedback && (
        <div className="loading-overlay">
          <div className="spinner-modern"></div>
          <h2>Finalizing Session</h2>
          <p>{endStatus}</p>
        </div>
      )}

      {showFeedback && (
        <div className="loading-overlay" style={{ background: 'rgba(255, 255, 255, 0.98)', zIndex: 3000 }}>
          <div className="feedback-modal animate-fade">
            <div className="feedback-header">
              <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Interview Completed! 🎓</h2>
              <p style={{ color: 'var(--text-muted)' }}>We'd love to hear about your experience with Solaris AI.</p>
            </div>

            <div className="feedback-stars" style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '32px 0' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="star-btn"
                  style={{
                    fontSize: '2.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: feedbackRating >= star ? '#F59E0B' : '#E2E8F0',
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                  onClick={() => setFeedbackRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            {/* Removed qualitative feedback textarea as requested */}

            <button
              className="btn-mic-main"
              style={{ width: '100%', borderRadius: '12px' }}
              onClick={submitFeedback}
              disabled={submittingFeedback || feedbackRating === 0}
            >
              {submittingFeedback ? "Saving Feedback..." : "Submit & Finish"}
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default Interview;
