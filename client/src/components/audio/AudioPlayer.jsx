import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  Settings,
  Loader2,
  AlertCircle,
  Volume1
} from 'lucide-react';

const AudioPlayer = ({ 
  blogId, 
  blogTitle, 
  initialAudioUrl = null,
  onAudioGenerated 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    voice: 'en-US-Neural2-F',
    speed: 1.0,
    pitch: 1.0
  });
  
  const audioRef = useRef(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);
      audioRef.current.addEventListener('error', handleError);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
      }
    };
  }, []);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleError = () => {
    setError('Failed to load audio');
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const generateTTS = async () => {
    if (!isAuthenticated) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/blogs/${blogId}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(voiceSettings)
      });

      if (response.ok) {
        const data = await response.json();
        setAudioUrl(data.audioUrl);
        if (onAudioGenerated) {
          onAudioGenerated(data.audioUrl);
        }
      } else {
        setError('Failed to generate audio');
      }
    } catch (error) {
      console.error('Error generating TTS:', error);
      setError('Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${blogTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const voiceOptions = [
    { value: 'en-US-Neural2-F', label: 'Emma (Female)' },
    { value: 'en-US-Neural2-M', label: 'John (Male)' },
    { value: 'en-US-Neural2-A', label: 'Sarah (Female)' },
    { value: 'en-US-Neural2-D', label: 'Mike (Male)' },
    { value: 'en-US-Neural2-E', label: 'Lisa (Female)' },
    { value: 'en-US-Neural2-G', label: 'David (Male)' }
  ];

  if (!isAuthenticated) {
    return (
      <div className="backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl p-3 text-center">
        <Volume2 className="w-6 h-6 text-text-secondary mx-auto mb-2" />
        <p className="text-text-secondary text-sm">Sign in to listen to this post</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl overflow-hidden relative">
      {/* Glassmorphism backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 dark:from-black/5 dark:to-black/10"></div>
      
      {/* Compact Header - Always Visible */}
      <div className="relative flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-medium text-text-primary">Listen to this post</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-all duration-200"
            title="Audio Settings"
          >
            <Settings className="w-4 h-4 text-text-secondary" />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-all duration-200"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg 
              className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="relative border-t border-white/10 dark:border-white/5 p-4 space-y-4">
          {/* Download Button */}
          {audioUrl && (
            <div className="flex justify-end">
              <button
                onClick={downloadAudio}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          )}

          {/* Voice Settings */}
          {showSettings && (
            <div className="backdrop-blur-md bg-white/5 dark:bg-black/10 border border-white/10 dark:border-white/5 rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Voice
                  </label>
                  <select
                    value={voiceSettings.voice}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
                    className="w-full px-3 py-2 border border-white/20 dark:border-white/10 rounded-lg bg-white/10 dark:bg-black/20 text-text-primary backdrop-blur-sm"
                  >
                    {voiceOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Speed: {voiceSettings.speed}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={voiceSettings.speed}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Pitch: {voiceSettings.pitch}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={voiceSettings.pitch}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
              
              {!audioUrl && (
                <Button
                  onClick={generateTTS}
                  disabled={isGenerating}
                  loading={isGenerating}
                  className="w-full backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/30"
                >
                  {isGenerating ? 'Generating Audio...' : 'Generate Audio'}
                </Button>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg backdrop-blur-md">
              <AlertCircle className="w-4 h-4 text-error" />
              <span className="text-sm text-error">{error}</span>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl ? (
            <div className="space-y-3">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div 
                  className="w-full h-2 bg-white/10 dark:bg-black/20 rounded-full cursor-pointer relative backdrop-blur-sm"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full bg-primary-500 rounded-full transition-all duration-100"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={togglePlayPause}
                    size="sm"
                    variant="outline"
                    className="w-10 h-10 p-0 backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/30"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="p-1 hover:bg-white/20 dark:hover:bg-white/10 rounded transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-text-secondary" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="w-4 h-4 text-text-secondary" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-text-secondary" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Volume2 className="w-12 h-12 text-text-secondary mx-auto mb-3" />
              <p className="text-text-secondary mb-4">
                Generate audio version of this post
              </p>
              <Button
                onClick={generateTTS}
                disabled={isGenerating}
                loading={isGenerating}
                className="backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/30"
              >
                {isGenerating ? 'Generating...' : 'Generate Audio'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Subtle border glow */}
      <div className="absolute inset-0 rounded-xl border border-white/30 dark:border-white/20 pointer-events-none"></div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default AudioPlayer; 