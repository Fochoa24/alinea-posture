import { useEffect, useRef, useCallback, useState } from 'react';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { usePostureDetection } from '../hooks/usePostureDetection';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { useEyeRest } from '../hooks/useEyeRest';
import { usePomodoro } from '../hooks/usePomodoro';
import { useStreak } from '../hooks/useStreak';
import { playPostureAlert, playStretchChime, playEyeRestChime, playPomodoroChime } from '../utils/sounds';
import { saveSession, saveAchievements, getAchievements } from '../utils/storage';
import { checkAchievements } from '../components/Achievements';
import PostureAlert from './PostureAlert';
import SessionTimer from './SessionTimer';
import PostureHistory from './PostureHistory';
import EyeRestReminder, { EyeRestAlert } from './EyeRestReminder';
import StretchReminder from './StretchReminder';
import SessionSummary from './SessionSummary';
import SoundToggle from './SoundToggle';
import PomodoroTimer from './PomodoroTimer';
import MeetingMode from './MeetingMode';
import WarmLightFilter from './WarmLightFilter';

const COLORS = {
  good: '#2d6a4f',
  bad: '#e76f51',
  no_person: '#6b7280',
};

export default function PoseDetector({ soundEnabled, settings, onEndSession, onNewAchievements }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { initializePose, startCamera, stopCamera } = useMediaPipe();
  const { postureState, stats, processResults, resetStats } = usePostureDetection();
  const { elapsed, stretchReminder, dismissStretch, start: startTimer, stop: stopTimer } = useSessionTimer();
  const { eyeReminder, eyeCountdown, dismissEye, start: startEye, stop: stopEye } = useEyeRest();
  const { streak, updateStreak } = useStreak();

  const pomodoroCBs = useRef({
    onBreak: () => { if (soundEnabled) playPomodoroChime(); },
    onWork: () => { if (soundEnabled) playPomodoroChime(); },
  });
  const { phase, countdown, cycles, active: pomodoroActive, start: startPomo, pause: pausePomo, reset: resetPomo } =
    usePomodoro(settings, () => pomodoroCBs.current.onBreak(), () => pomodoroCBs.current.onWork());

  const animationRef = useRef(null);
  const landmarksRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [sound, setSound] = useState(soundEnabled);
  const [meetingMode, setMeetingMode] = useState(false);
  const lastPostureRef = useRef(null);
  const lastSoundTimeRef = useRef(0);

  const isAlertSuppressed = meetingMode;

  const drawOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const landmarks = landmarksRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks) {
      animationRef.current = requestAnimationFrame(drawOnCanvas);
      return;
    }
    const lineWidth = 2;
    const radius = 4;
    const connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 23], [12, 24], [23, 24],
      [23, 25], [24, 26], [25, 27], [26, 28],
      [27, 29], [28, 30], [29, 31], [30, 32],
    ];
    const color = COLORS[postureState] || COLORS.good;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = color;
    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
        ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
        ctx.stroke();
      }
    });
    landmarks.forEach((lm) => {
      if (lm) {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, radius, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
    animationRef.current = requestAnimationFrame(drawOnCanvas);
  }, [postureState]);

  const handleResults = useCallback((results) => {
    const landmarks = processResults(results);
    landmarksRef.current = landmarks;
  }, [processResults]);

  useEffect(() => {
    const init = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      canvas.width = 640;
      canvas.height = 480;
      initializePose(handleResults);
      try {
        await startCamera(video, handleResults);
        animationRef.current = requestAnimationFrame(drawOnCanvas);
        startTimer();
        startEye();
      } catch (err) {
        console.error('Error al acceder a la camara:', err);
      }
    };
    init();
    return () => {
      stopCamera();
      stopTimer();
      stopEye();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(drawOnCanvas);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [drawOnCanvas]);

  useEffect(() => {
    if (postureState !== 'no_person' && postureState !== lastPostureRef.current) {
      setHistory(prev => [...prev.slice(-119), postureState]);
      lastPostureRef.current = postureState;
    }
  }, [postureState]);

  useEffect(() => {
    if (postureState === 'bad' && sound && !isAlertSuppressed) {
      const now = Date.now();
      if (now - lastSoundTimeRef.current > 10000) {
        playPostureAlert();
        lastSoundTimeRef.current = now;
      }
    }
  }, [postureState, sound, meetingMode]);

  useEffect(() => {
    if (stretchReminder && sound && !isAlertSuppressed) playStretchChime();
  }, [stretchReminder, sound, meetingMode]);

  useEffect(() => {
    if (eyeReminder && sound && !isAlertSuppressed) playEyeRestChime();
  }, [eyeReminder, sound, meetingMode]);

  const handleEndSession = async () => {
    stopCamera();
    stopTimer();
    stopEye();
    pausePomo();

    const sessionData = {
      ...stats,
      elapsed,
      pomodoroCycles: cycles,
      goodPostureTime: stats.goodPostureTime,
      badPostureTime: stats.badPostureTime,
    };
    await saveSession(sessionData);

    const newStreak = await updateStreak();
    const existingAchievements = await getAchievements();
    const { newAchievements } = checkAchievements(sessionData, newStreak.days, existingAchievements);
    if (newAchievements.length > 0) {
      await saveAchievements([...existingAchievements, ...newAchievements]);
      if (onNewAchievements) onNewAchievements(newAchievements);
    }

    setShowSummary(true);
  };

  const handleRestart = () => {
    resetStats();
    setHistory([]);
    setShowSummary(false);
    lastPostureRef.current = null;
    resetPomo();
    const init = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      canvas.width = 640;
      canvas.height = 480;
      initializePose(handleResults);
      try {
        await startCamera(video, handleResults);
        animationRef.current = requestAnimationFrame(drawOnCanvas);
        startTimer();
        startEye();
      } catch (err) {}
    };
    init();
  };

  if (showSummary) {
    return (
      <SessionSummary
        stats={stats}
        elapsed={elapsed}
        onRestart={handleRestart}
        onClose={onEndSession}
      />
    );
  }

  return (
    <div className="pose-detector">
      <div className="detector-top-bar">
        <SessionTimer elapsed={elapsed} />
        <div className="top-bar-controls">
          <MeetingMode active={meetingMode} onToggle={() => setMeetingMode(!meetingMode)} />
          <SoundToggle enabled={sound} onToggle={() => setSound(!sound)} />
        </div>
      </div>

      <div className="video-container">
        <video
          ref={videoRef}
          className={`video-input ${settings.warmLight ? 'warm-light' : ''}`}
          autoPlay
          playsInline
          muted
        />
        <WarmLightFilter active={settings.warmLight} />
        <canvas
          ref={canvasRef}
          className="pose-canvas"
          width={640}
          height={480}
        />
        {meetingMode && <div className="meeting-badge">{'\u{1F4BB}'} Modo reunion</div>}
        <PostureAlert state={meetingMode ? 'good' : postureState} onReset={resetStats} />
      </div>

      <EyeRestReminder countdown={eyeCountdown} />

      <PomodoroTimer
        phase={phase}
        countdown={countdown}
        cycles={cycles}
        active={pomodoroActive}
        onStart={startPomo}
        onPause={pausePomo}
        onReset={resetPomo}
        settings={settings}
      />

      <div className="stats-panel">
        <div className="stat-card">
          <span className="stat-label">Postura actual</span>
          <span className={`stat-value status-${postureState}`}>
            {postureState === 'good' && 'Buena'}
            {postureState === 'bad' && 'Mejora tu postura'}
            {postureState === 'no_person' && 'Sin deteccion'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cabeza adelantada</span>
          <span className="stat-value">{stats.headForwardCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Desbalance hombros</span>
          <span className="stat-value">{stats.shoulderImbalanceCount}</span>
        </div>
      </div>

      <PostureHistory history={history} />

      <button className="end-session-btn" onClick={handleEndSession}>
        Finalizar sesion
      </button>

      {stretchReminder && !meetingMode && <StretchReminder onDismiss={dismissStretch} />}
      {eyeReminder && !meetingMode && <EyeRestAlert onDismiss={dismissEye} />}
    </div>
  );
}
