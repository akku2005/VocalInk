import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import api from '../../services/api';
import { useContext } from 'react';
import { AudioContext } from '../../context/AudioContext';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  Settings,
  Loader2,
  AlertCircle,
  Volume1,
  ChevronDown,
  Mic2
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
    pitch: 1.0,
    language: 'en'
  });
  const { addTrack } = useContext(AudioContext);
  const [voices, setVoices] = useState([]);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesError, setVoicesError] = useState(null);
  
  const audioRef = useRef(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    const handleError = (event) => {
      const errorCode = audio?.error?.code;
      const errorMessages = {
        1: 'Audio loading aborted',
        2: 'Network error loading audio',
        3: 'Audio decoding failed',
        4: 'Audio format not supported'
      };
      const errorMsg = errorMessages[errorCode] || 'Failed to load audio';
      console.error('Audio error:', { errorCode, errorMsg, audioUrl });
      setError(errorMsg);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', () => {});
      audio.removeEventListener('play', () => {});
      audio.removeEventListener('pause', () => {});
    };
  }, [audioUrl]);

  // Handle initial audio URL from props
  useEffect(() => {
    if (initialAudioUrl) {
      let finalUrl = initialAudioUrl;
      
      // If URL is relative, make it absolute using the API base URL
      if (finalUrl && !finalUrl.startsWith('http')) {
        const apiBaseUrl = api.defaults.baseURL || 'http://localhost:3000/api';
        const serverBaseUrl = apiBaseUrl.replace('/api', '');
        finalUrl = `${serverBaseUrl}${finalUrl}`;
      }
      
      console.log('Loading cached audio URL:', { initialAudioUrl, finalUrl });
      setAudioUrl(finalUrl);
    }
  }, [initialAudioUrl]);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        setVoicesLoading(true);
        setVoicesError(null);
        const res = await api.get(`/tts/voices`, { params: { provider: 'elevenlabs' } });
        const list = res?.data?.voices || res?.data || [];
        setVoices(list);
        if (list.length > 0) {
          setVoiceSettings(prev => ({ ...prev, voice: list[0].id }));
        }
      } catch (e) {
        setVoicesError('Failed to load voices');
      } finally {
        setVoicesLoading(false);
      }
    };
    loadVoices();
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
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleError = (event) => {
    const errorCode = audioRef.current?.error?.code;
    const errorMessages = {
      1: 'Audio loading aborted',
      2: 'Network error loading audio',
      3: 'Audio decoding failed',
      4: 'Audio format not supported'
    };
    const errorMsg = errorMessages[errorCode] || 'Failed to load audio';
    console.error('Audio error:', { errorCode, errorMsg, audioUrl, event });
    setError(errorMsg);
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
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    
    // Resume playing if it was playing
    if (isPlaying) {
      audioRef.current.play().catch(err => console.error('Play error:', err));
    }
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
      const response = await api.post(`/blogs/${blogId}/tts`, {
        provider: 'elevenlabs',
        voiceId: voiceSettings.voice,
        language: voiceSettings.language,
        stability: 0.62,
        similarityBoost: 0.55,
        style: 0.2,
        useSpeakerBoost: true
      });
      if (response?.data?.success) {
        const payload = response.data.result || response.data;
        const audioUrl = payload?.url || payload?.ttsUrl || payload?.audioUrl;
        const segments = payload?.segments || [];
        
        // Log for debugging
        console.log('TTS Response:', { payload, audioUrl, segments });
        
        if (segments.length > 0) {
          segments.forEach(seg => {
            addTrack({ url: seg.url, title: blogTitle, blogId, provider: payload.provider || 'gtts', language: voiceSettings.language });
          });
        }
        
        // Ensure URL is absolute or relative to backend API
        let finalUrl = audioUrl || segments[0]?.url || null;
        
        // If URL is relative, make it absolute using the API base URL
        if (finalUrl && !finalUrl.startsWith('http')) {
          // Get the API base URL from the api service
          const apiBaseUrl = api.defaults.baseURL || 'http://localhost:3000/api';
          // Remove /api from the end to get the server base URL
          const serverBaseUrl = apiBaseUrl.replace('/api', '');
          finalUrl = `${serverBaseUrl}${finalUrl}`;
        }
        
        console.log('Final audio URL:', finalUrl);
        console.log('Audio URL details:', { 
          originalUrl: audioUrl,
          finalUrl,
          apiBaseUrl: api.defaults.baseURL,
          isRelative: audioUrl && !audioUrl.startsWith('http')
        });
        
        setAudioUrl(finalUrl);
        if (onAudioGenerated) onAudioGenerated(finalUrl);
      } else {
        setError(response?.data?.message || 'Failed to generate audio');
      }
    } catch (error) {
      console.error('Error generating TTS:', error);
      setError(error?.response?.data?.message || 'Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAudio = async () => {
    if (!audioUrl) return;
    
    try {
      // Use fetch to download with proper headers
      const response = await fetch(audioUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      // Check if response is actually audio
      const contentType = response.headers.get('content-type');
      console.log('Download content-type:', contentType);
      
      if (!contentType || !contentType.includes('audio')) {
        console.error('Invalid content type:', contentType);
        const text = await response.text();
        console.error('Response body:', text.substring(0, 200));
        throw new Error('Server returned invalid audio format');
      }
      
      const blob = await response.blob();
      
      // Create download link
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${blogTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(blobUrl);
      console.log('Download completed successfully');
    } catch (error) {
      console.error('Download error:', error);
      setError(`Download failed: ${error.message}`);
    }
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
  const effectiveVoiceOptions = voices.length > 0 ? voices.map(v => ({ value: v.id, label: v.name, previewUrl: v.previewUrl })) : voiceOptions;
  const languageOptionsUI = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
    { value: 'hi', label: 'Hindi' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="relative rounded-2xl overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-primary/50 to-primary opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500"></div>
        
        {/* Neomorphism background */}
        <div className="relative rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/80 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl dark:shadow-2xl/50 p-6 text-center">
          <Mic2 className="w-8 h-8 text-text-secondary mx-auto mb-3 opacity-60" />
          <p className="text-text-secondary text-sm font-medium">Sign in to listen to this post</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden group">
      {/* Continuously running animated glow border */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary/50 to-primary blur-2xl opacity-20 dark:opacity-30 animate-[spin_8s_linear_infinite]"></div>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 via-transparent to-primary/40 blur-lg opacity-40 dark:opacity-50 animate-[spin_10s_linear_infinite]"></div>
      
      {/* Main neomorphism container */}
      <div className="relative rounded-2xl bg-gradient-to-br from-white/95 to-white/85 dark:from-slate-900/90 dark:to-slate-800/70 backdrop-blur-2xl border border-primary/10 dark:border-white/10 shadow-lg dark:shadow-2xl dark:shadow-2xl/50 overflow-hidden">
        
        {/* Header with VocalInk branding */}
        <div className="flex items-center justify-between p-5 border-b border-white/20 dark:border-white/5 bg-gradient-to-r from-white/50 to-transparent dark:from-white/5 dark:to-transparent">
          <div className="flex items-center gap-4">
            {/* VocalInk Logo Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-all"></div>
              <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <Mic2 className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-text-primary">VocalInk</h3>
              <p className="text-xs text-text-secondary font-medium">AI Voice Narration</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {audioUrl && (
              <button
                onClick={downloadAudio}
                className="p-2.5 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-primary/20 dark:hover:bg-primary/20 text-text-secondary hover:text-primary transition-all duration-300 shadow-md hover:shadow-lg"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                showSettings 
                  ? 'bg-primary/20 dark:bg-primary/20 text-primary' 
                  : 'bg-gray-200 dark:bg-white/10 hover:bg-primary/20 dark:hover:bg-primary/20 text-text-secondary hover:text-primary'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2.5 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-primary/20 dark:hover:bg-primary/20 text-text-secondary hover:text-primary transition-all duration-300 shadow-md hover:shadow-lg"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        {isExpanded && (
          <div className="p-6 space-y-5">
            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-error/10 dark:bg-error/5 border border-error/30 rounded-xl backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                <span className="text-sm text-error font-medium">{error}</span>
              </div>
            )}

            {/* Audio Player */}
            {audioUrl ? (
              <div className="space-y-5">
                {/* Progress Bar with smooth animation */}
                <div className="space-y-2.5">
                  <div 
                    className="relative w-full h-3 bg-gray-300 dark:bg-white/10 rounded-full cursor-pointer hover:h-4 transition-all shadow-inner overflow-hidden group/progress"
                    onClick={handleSeek}
                  >
                    {/* Background track - light gray */}
                    <div className="absolute inset-0 bg-gray-200 dark:bg-white/8 rounded-full"></div>
                    
                    {/* Played portion - smooth fill animation */}
                    <div 
                      className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full shadow-lg shadow-primary/50 group-hover/progress:shadow-primary/70 relative flex items-center justify-end pr-1"
                      style={{ 
                        width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                        transition: 'width 0.1s linear'
                      }}
                    >
                      {/* Glowing dot at end of progress */}
                      {duration && currentTime > 0 && (
                        <div className="w-4 h-4 bg-white rounded-full shadow-lg shadow-primary/80 opacity-100 group-hover/progress:opacity-100 transition-opacity flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-text-secondary font-semibold">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Play Button with glow */}
                    <button
                      onClick={togglePlayPause}
                      className="relative p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/50 active:scale-95"
                    >
                      <div className="absolute inset-0 rounded-xl bg-primary opacity-0 group-hover:opacity-20 blur-lg transition-all"></div>
                      {isPlaying ? <Pause className="w-5 h-5 relative" /> : <Play className="w-5 h-5 ml-0.5 relative" />}
                    </button>
                    
                    {/* Volume Control */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-200 dark:bg-white/10 backdrop-blur-sm shadow-md">
                      <button
                        onClick={toggleMute}
                        className="p-1.5 hover:bg-primary/20 rounded-lg transition-all"
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
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer accent-primary"
                        style={{
                          background: `linear-gradient(to right, rgb(var(--color-primary)) 0%, rgb(var(--color-primary)) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) 100%)`
                        }}
                      />
                    </div>
                  </div>

                  {/* Language Selector */}
                  <select
                    value={voiceSettings.language}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, language: e.target.value }))}
                    className="px-4 py-2 text-sm font-medium rounded-xl bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/10 text-text-primary hover:bg-gray-300 dark:hover:bg-white/20 transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    {languageOptionsUI.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-full blur-lg opacity-40 animate-pulse"></div>
                  <div className="relative rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Mic2 className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <p className="text-text-primary font-bold mb-2 text-lg">Generate Audio</p>
                <p className="text-text-secondary text-sm mb-6 font-medium">
                  Create an AI-narrated version of this post
                </p>
                <Button
                  onClick={generateTTS}
                  disabled={isGenerating}
                  loading={isGenerating}
                  variant="primary"
                  size="md"
                  className="shadow-lg hover:shadow-xl hover:shadow-primary/50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Audio'}
                </Button>
              </div>
            )}

            {/* Settings Panel */}
            {showSettings && audioUrl && (
              <div className="pt-5 border-t border-gray-200 dark:border-white/5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-2.5">
                      Voice
                    </label>
                    <select
                      value={voiceSettings.voice}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/10 text-text-primary text-sm font-medium hover:bg-gray-300 dark:hover:bg-white/20 transition-all shadow-md"
                    >
                      {effectiveVoiceOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-2.5">
                      Speed: {voiceSettings.speed}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={voiceSettings.speed}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-white/30 rounded-full appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default AudioPlayer;