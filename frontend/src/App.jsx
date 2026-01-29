import { useState } from 'react';
import { AlbumSearch } from './components/AlbumSearch';
import { AlbumConfirm } from './components/AlbumConfirm';
import { DurationSelect } from './components/DurationSelect';
import { LoadingScreen } from './components/LoadingScreen';
import { ProcessingView } from './components/ProcessingView';
import { Library } from './components/Library';
import { LibraryPlayer } from './components/LibraryPlayer';
import { PlaylistList } from './components/PlaylistList';
import { PlaylistView } from './components/PlaylistView';
import { PlaylistPlayer } from './components/PlaylistPlayer';
import LiquidEther from './components/LiquidEther';
import { api } from './lib/api';

function App() {
  const [screen, setScreen] = useState('search'); // search, confirm, duration, loading, processing, library, library-player, playlist-list, playlist-view, playlist-player
  const [selectedMbid, setSelectedMbid] = useState(null);
  const [albumData, setAlbumData] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [durationType, setDurationType] = useState(null);
  const [selectedLibraryMontage, setSelectedLibraryMontage] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

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
      alert('Failed to start montage creation. Please try again.');
      setScreen('duration'); // Go back to duration selection on error
    }
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

  const handleAutoPlay = (montage) => {
    setSelectedLibraryMontage(montage);
    // Stay on library-player screen
  };

  const handleBackToLibrary = () => {
    setSelectedLibraryMontage(null);
    setScreen('library');
  };

  const handleLibraryMontageDeleted = () => {
    setSelectedLibraryMontage(null);
    setScreen('library');
  };

  const handleGoToPlaylists = () => {
    setScreen('playlist-list');
  };

  const handleSelectPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    setScreen('playlist-view');
  };

  const handlePlayPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    setScreen('playlist-player');
  };

  const handleBackToPlaylistList = () => {
    setSelectedPlaylist(null);
    setScreen('playlist-list');
  };

  const handleBackToPlaylistView = () => {
    setScreen('playlist-view');
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

      {/* Navigation buttons - only show on search screen */}
      {screen === 'search' && (
        <div className="fixed top-4 right-4 flex items-center gap-3" style={{ zIndex: 100 }}>
          <button
            onClick={handleGoToLibrary}
            className="px-4 py-2 bg-dark-surface backdrop-blur-md text-gray-400 hover:text-white border border-white/10 rounded-lg hover:border-white/30 transition-colors"
          >
            My Library
          </button>
          <button
            onClick={handleGoToPlaylists}
            className="px-4 py-2 bg-dark-surface backdrop-blur-md text-gray-400 hover:text-white border border-white/10 rounded-lg hover:border-white/30 transition-colors"
          >
            Playlists
          </button>
        </div>
      )}

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
            onBack={() => setScreen('confirm')}
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
            onGoToLibrary={handleGoToLibrary}
          />
        )}

        {screen === 'library' && (
          <Library
            onSelectMontage={handleSelectLibraryMontage}
            onBack={() => setScreen('search')}
          />
        )}

        {screen === 'library-player' && selectedLibraryMontage && (
          <LibraryPlayer
            montage={selectedLibraryMontage}
            onBack={handleBackToLibrary}
            onDelete={handleLibraryMontageDeleted}
            onAutoPlay={handleAutoPlay}
          />
        )}

        {screen === 'playlist-list' && (
          <PlaylistList
            onSelectPlaylist={handleSelectPlaylist}
            onBack={() => setScreen('search')}
          />
        )}

        {screen === 'playlist-view' && selectedPlaylist && (
          <PlaylistView
            playlistId={selectedPlaylist.id}
            onBack={handleBackToPlaylistList}
            onPlay={handlePlayPlaylist}
          />
        )}

        {screen === 'playlist-player' && selectedPlaylist && (
          <PlaylistPlayer
            playlist={selectedPlaylist}
            onBack={handleBackToPlaylistView}
          />
        )}
      </div>
    </div>
  );
}

export default App;
