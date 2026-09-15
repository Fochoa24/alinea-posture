import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { setCurrentUser } from './utils/storage';
import PoseDetector from './components/PoseDetector';
import AuthScreen from './components/AuthScreen';
import DarkModeToggle from './components/DarkModeToggle';
import SettingsPanel, { useSettings } from './components/SettingsPanel';
import Achievements from './components/Achievements';
import SessionAnalytics from './components/SessionAnalytics';
import StreakDisplay from './components/StreakDisplay';
import { exportSessionsCSV } from './utils/csvExport';
import './App.css';

export default function App() {
  const { user, loading, error, signInWithEmail, signUpWithEmail, signInWithGoogle, logout } = useAuth();
  const [started, setStarted] = useState(false);
  const [dark, setDark] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [achievementToast, setAchievementToast] = useState(null);
  const { settings, updateSettings } = useSettings();

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    if (user) {
      setCurrentUser(user.uid);
    } else {
      setCurrentUser(null);
    }
  }, [user]);

  const handleNewAchievements = (ids) => {
    if (ids.length > 0) {
      setAchievementToast(ids[0]);
      setTimeout(() => setAchievementToast(null), 4000);
    }
  };

  const handleExportCSV = async () => {
    const count = await exportSessionsCSV();
    if (count === null) alert('No hay sesiones para exportar');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="auth-screen">
          <div className="auth-card">
            <div className="auth-logo">
              <span className="logo-icon">&#x2726;</span>
              <h1>Alinea</h1>
            </div>
            <p className="auth-subtitle">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onSignIn={signInWithEmail}
        onSignUp={signUpWithEmail}
        onGoogle={signInWithGoogle}
        error={error}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">&#x2726;</span>
          <h1>Alinea</h1>
        </div>
        <div className="header-controls">
          <StreakDisplay />
          <button className="toggle-btn" onClick={() => setShowAnalytics(true)} title="Estadisticas">
            {'\u{1F4CA}'}
          </button>
          <button className="toggle-btn" onClick={() => setShowAchievements(true)} title="Logros">
            {'\u{1F3C6}'}
          </button>
          <button className="toggle-btn" onClick={() => setShowSettings(true)} title="Configuracion">
            {'\u{2699}'}
          </button>
          <button className="toggle-btn" onClick={handleExportCSV} title="Exportar CSV">
            {'\u{1F4E5}'}
          </button>
          <button
            className="toggle-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Silenciar' : 'Activar sonido'}
          >
            {soundEnabled ? '\u{1F50A}' : '\u{1F507}'}
          </button>
          <DarkModeToggle dark={dark} onToggle={() => setDark(!dark)} />
          <button className="toggle-btn" onClick={logout} title="Cerrar sesion">
            {'\u{1F6AA}'}
          </button>
        </div>
        <p className="tagline">
          {user.displayName
            ? `Bienvenido de vuelta, ${user.displayName.split(' ')[0]}`
            : user.email
              ? `Bienvenido de vuelta, ${user.email.split('@')[0]}`
              : 'Bienvenido de vuelta'}
        </p>
      </header>

      <main className="app-main">
        {!started ? (
          <div className="welcome-screen">
            <div className="welcome-card">
              <div className="welcome-icon">&#x1F3E0;</div>
              <h2>Cuida tu postura desde tu espacio de trabajo</h2>
              <p>
                Alinea detecta problemas posturales en tiempo real usando tu camara.
                Todo el procesamiento ocurre en tu navegador - ningun dato sale de tu computadora.
              </p>
              <div className="features-grid">
                <div className="feature-item">
                  <span className="feature-icon">&#x1F512;</span>
                  <span>100% Privado</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">&#x26A1;</span>
                  <span>Tiempo real</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">&#x1F4CA;</span>
                  <span>Metricas claras</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">&#x1F3AF;</span>
                  <span>ODS 3 - Salud</span>
                </div>
              </div>
              <button
                className="start-button"
                onClick={() => setStarted(true)}
              >
                Iniciar sesion postural
              </button>
              <p className="privacy-note">
                Necesitamos acceso a tu camara. Los frames nunca se envian a ningun servidor.
              </p>
            </div>
          </div>
        ) : (
          <PoseDetector
            soundEnabled={soundEnabled}
            settings={settings}
            onEndSession={() => setStarted(false)}
            onNewAchievements={handleNewAchievements}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Alinea &middot; Deteccion postural client-side &middot; Alineado al ODS 3 - Salud y Bienestar</p>
      </footer>

      {showSettings && (
        <SettingsPanel settings={settings} onUpdate={updateSettings} onClose={() => setShowSettings(false)} />
      )}
      {showAchievements && <Achievements onClose={() => setShowAchievements(false)} />}
      {showAnalytics && <SessionAnalytics onClose={() => setShowAnalytics(false)} />}

      {achievementToast && (
        <div className="achievement-toast">
          {'\u{1F3C6}'} Nuevo logro desbloqueado!
        </div>
      )}
    </div>
  );
}
