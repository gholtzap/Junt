import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { AlbumSearch } from './components/AlbumSearch';
import { AlbumConfirm } from './components/AlbumConfirm';
import { DurationSelect } from './components/DurationSelect';
import { LoadingScreen } from './components/LoadingScreen';
import { ProcessingView } from './components/ProcessingView';
import { Library } from './components/Library';
import { LibraryPlayer } from './components/LibraryPlayer';
import LiquidEther from './components/LiquidEther';
import { api } from './lib/api';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [authScreen, setAuthScreen] = useState('login'); // login, register
  const [screen, setScreen] = useState('search'); // search, confirm, duration, loading, processing, library, library-player, auth
  const [selectedMbid, setSelectedMbid] = useState(null);
  const [albumData, setAlbumData] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [durationType, setDurationType] = useState(null);
  const [selectedLibraryMontage, setSelectedLibraryMontage] = useState(null);

  const isAnonymous = !user;

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  // Show auth screen if explicitly navigated to it
  if (screen === 'auth') {
    if (authScreen === 'login') {
      return <Login onSwitchToRegister={() => setAuthScreen('register')} />;
    }
    return <Register onSwitchToLogin={() => setAuthScreen('login')} />;
  }

  const handleSelectAlbum = async (mbid) => {
    setSelectedMbid(mbid);
    setScreen('confirm');
  };

  const handleConfirmAlbum = () => {
    setScreen('duration');
  };

  const handleSelectDuration = async (duration) => {
    setScreen('loading'); // Show loading immediately
    setDurationType(duration); // Save duration type for later

    try {
      const response = await api.createMontage(selectedMbid, duration);
      setJobId(response.job_id);

      // Get album data for display
      const album = await api.getAlbumDetails(selectedMbid);
      setAlbumData(album);

      setScreen('processing');
    } catch (error) {
      console.error('Failed to create montage:', error);

      // Handle rate limit for anonymous users
      if (error.status === 429) {
        if (confirm(error.message + '\n\nWould you like to sign up now?')) {
          setAuthScreen('register');
          setScreen('auth');
        } else {
          setScreen('search');
        }
      } else {
        alert('Failed to start montage creation. Please try again.');
        setScreen('duration'); // Go back to duration selection on error
      }
    }
  };

  const handleUpgradeClick = () => {
    setAuthScreen('register');
    setScreen('auth');
  };

  const handleReset = () => {
    setScreen('search');
    setSelectedMbid(null);
    setAlbumData(null);
    setJobId(null);
    setDurationType(null);
  };

  const handleGoToLibrary = () => {
    setScreen('library');
  };

  const handleSelectLibraryMontage = (montage) => {
    setSelectedLibraryMontage(montage);
    setScreen('library-player');
  };

  const handleBackToLibrary = () => {
    setSelectedLibraryMontage(null);
    setScreen('library');
  };

  const handleLibraryMontageDeleted = () => {
    setSelectedLibraryMontage(null);
    setScreen('library');
  };

  return (
    <div className="min-h-screen">
      {/* Animated background */}
      <LiquidEther
        mouseForce={20}
        cursorSize={100}
        isViscous={false}
        viscous={30}
        colors={["#5227FF","#FF9FFC","#B19EEF"]}
        autoDemo
        autoSpeed={0.5}
        autoIntensity={2.2}
        isBounce={false}
        resolution={0.5}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      />

      {/* User info and action buttons */}
      <div className="fixed top-4 right-4 flex items-center gap-4" style={{ zIndex: 100 }}>
        {isAnonymous ? (
          <>
            <div className="text-orange-400 text-sm font-medium">
              🎵 Trial Mode
            </div>
            <button
              onClick={() => {
                setAuthScreen('login');
                setScreen('auth');
              }}
              className="px-4 py-2 bg-dark-surface backdrop-blur-md text-gray-400 hover:text-white border border-white/10 rounded-lg hover:border-white/30 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => {
                setAuthScreen('register');
                setScreen('auth');
              }}
              className="px-4 py-2 accent-bg text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Sign Up Free
            </button>
          </>
        ) : (
          <>
            <div className="text-gray-400 text-sm">
              Welcome, {user.username}
            </div>
            <button
              onClick={handleGoToLibrary}
              className="px-4 py-2 bg-dark-surface backdrop-blur-md text-gray-400 hover:text-white border border-white/10 rounded-lg hover:border-white/30 transition-colors"
            >
              My Library
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-dark-surface backdrop-blur-md text-gray-400 hover:text-white border border-white/10 rounded-lg hover:border-white/30 transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {screen === 'search' && (
          <AlbumSearch onSelectAlbum={handleSelectAlbum} />
        )}

        {screen === 'confirm' && (
          <AlbumConfirm
            mbid={selectedMbid}
            onConfirm={handleConfirmAlbum}
            onBack={() => setScreen('search')}
          />
        )}

        {screen === 'duration' && (
          <DurationSelect
            onSelect={handleSelectDuration}
            trackCount={albumData?.tracks?.length || 10}
          />
        )}

        {screen === 'loading' && (
          <LoadingScreen message="Starting montage creation..." />
        )}

        {screen === 'processing' && (
          <ProcessingView
            jobId={jobId}
            albumData={albumData}
            durationType={durationType}
            onReset={handleReset}
            onUpgradeClick={handleUpgradeClick}
          />
        )}

        {screen === 'library' && !isAnonymous && (
          <Library
            onSelectMontage={handleSelectLibraryMontage}
            onBack={() => setScreen('search')}
          />
        )}

        {screen === 'library-player' && selectedLibraryMontage && !isAnonymous && (
          <LibraryPlayer
            montage={selectedLibraryMontage}
            onBack={handleBackToLibrary}
            onDelete={handleLibraryMontageDeleted}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
