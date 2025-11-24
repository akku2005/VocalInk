import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
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
  Mic2,
  X
} from 'lucide-react';
import { buildQuotaToastPayload } from '../../utils/quotaToast';

const AudioPlayer = ({
  blogId,
  blogTitle,
  initialAudioUrl = null,
  initialAudioSegments = [], // New prop for segments
  onAudioGenerated,
  onSegmentChange // Callback for highlighting
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0); // Total across all segments
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl);
  const [segments, setSegments] = useState(initialAudioSegments || []);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

  const [isGenerating, setIsGenerating] = useState(false);
  const [ttsJobId, setTtsJobId] = useState(null);
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
  const { showInfo, showError } = useToast();

  const resolveAudioUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;

    // Get base URL from API config or default to localhost:3000
    const apiBaseUrl = api.defaults.baseURL || 'http://localhost:3000/api';
    const serverBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

    // Ensure url starts with /
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${serverBaseUrl}${normalizedPath}`;
  };

  // Initialize segments if provided
  useEffect(() => {
    if (initialAudioSegments && initialAudioSegments.length > 0) {
      console.log('AudioPlayer: Initializing segments', { count: initialAudioSegments.length, segments: initialAudioSegments });
      setSegments(initialAudioSegments);

      // Calculate total duration across all segments
      const total = initialAudioSegments.reduce((sum, seg) => sum + (seg.duration || 0), 0);
      setTotalDuration(total);

      // If we have segments but no current URL, set the first one
      if (!audioUrl) {
        setAudioUrl(resolveAudioUrl(initialAudioSegments[0].url));
        setCurrentSegmentIndex(0);
        // Don't highlight on load - only when playing
      }
    }
  }, [initialAudioSegments]);

  // Notify parent of segment change - only when playing
  useEffect(() => {
    if (segments.length > 0 && onSegmentChange && isPlaying) {
      const currentSeg = segments[currentSegmentIndex];
      if (currentSeg) {
        // Use id field which contains tts-seg-X for highlighting
        const segmentId = currentSeg.id || currentSeg.paragraphId;
        console.log('AudioPlayer: Segment changed', { index: currentSegmentIndex, segmentId, segment: currentSeg });
        onSegmentChange(segmentId);
      }
    } else if (!isPlaying && onSegmentChange) {
      // Clear highlighting when not playing
      onSegmentChange(null);
    }
  }, [currentSegmentIndex, segments, onSegmentChange, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      if (isPlaying) {
        audio.play().catch(e => console.error("Auto-play failed:", e));
      }
    };

    const handleTimeUpdate = () => {
      // Calculate cumulative time across all segments
      let cumulativeTime = 0;

      // Add duration of all previous segments
      for (let i = 0; i < currentSegmentIndex; i++) {
        cumulativeTime += segments[i]?.duration || 0;
      }

      // Add current time in current segment
      cumulativeTime += audio.currentTime || 0;

      setCurrentTime(cumulativeTime);
    };

    const handleEnded = () => {
      // Playlist logic
      if (segments.length > 0 && currentSegmentIndex < segments.length - 1) {
        // Move to next segment
        const nextIndex = currentSegmentIndex + 1;
        setCurrentSegmentIndex(nextIndex);
        setAudioUrl(resolveAudioUrl(segments[nextIndex].url));
        // isPlaying remains true, so handleLoadedMetadata will trigger play
      } else {
        // End of playlist or single file
        setIsPlaying(false);
        setCurrentTime(0);
        audio.currentTime = 0;
        // Reset to start
        if (segments.length > 0) {
          setCurrentSegmentIndex(0);
          setAudioUrl(resolveAudioUrl(segments[0].url));
        }
      }
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
      // Don't show error for empty src (initial state)
      if (audioUrl) {
        setError(errorMsg);
        setIsPlaying(false);
      }
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
    };
  }, [audioUrl, segments, currentSegmentIndex]); // Removed isPlaying from deps to avoid re-binding

  // Handle initial audio URL from props (Legacy support)
  useEffect(() => {
    if (initialAudioUrl && segments.length === 0) {
      let finalUrl = initialAudioUrl;
      if (finalUrl && !finalUrl.startsWith('http')) {
        const apiBaseUrl = api.defaults.baseURL || 'http://localhost:3000/api';
        const serverBaseUrl = apiBaseUrl.replace('/api', '');
        finalUrl = `${serverBaseUrl}${finalUrl}`;
      }
      setAudioUrl(finalUrl);
    }
  }, [initialAudioUrl, segments]);

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

  // ... (keep existing handlers: handleLoadedMetadata, handleTimeUpdate, handleEnded, handleError)
  // Note: We redefined handleEnded inside useEffect, but we might need to keep the external one or remove it.
  // To avoid conflicts, I will remove the external definitions since they are now inside the effect.
  // But wait, the original code had them outside. 
  // The best practice is to keep them inside useEffect if they depend on state (like segments/index).

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

  const handleQuotaToast = (usage, isError = false) => {
    const payload = buildQuotaToastPayload({ usage, type: 'audio', isError });
    if (!payload) return;
    const show = isError ? showError : showInfo;
    show(payload.message, {
      title: payload.title,
      countdownExpiresAt: payload.countdownExpiresAt,
      duration: isError ? 6000 : 5000,
    });
  };

  const generateTTS = async () => {
    if (!isAuthenticated) return;
    setIsGenerating(true);
    setError(null);
    setTtsJobId(null);
    try {
      const response = await api.post(`/blogs/${blogId}/tts`, {
        provider: 'auto',
        voiceId: voiceSettings.voice,
        language: voiceSettings.language,
        stability: 0.62,
        similarityBoost: 0.55,
        style: 0.2,
        useSpeakerBoost: true
      });

      if (response?.data) {
        const { audioUrl, audioSegments, jobId, message } = response.data;

        // Store job ID for potential cancellation
        if (jobId) {
          setTtsJobId(jobId);
        }

        console.log('TTS Generated:', { audioUrl, audioSegments, jobId });

        if (audioSegments && audioSegments.length > 0) {
          setSegments(audioSegments);
          setAudioUrl(resolveAudioUrl(audioSegments[0].url));
          setCurrentSegmentIndex(0);
        } else if (audioUrl) {
          // Legacy fallback
          setAudioUrl(resolveAudioUrl(audioUrl));
          setSegments([]);
        }

        if (onAudioGenerated) {
          onAudioGenerated(audioSegments || audioUrl);
        }

        const usage = response.data.usage;
        handleQuotaToast(usage);
      }
    } catch (error) {
      console.error('Error generating TTS:', error);
      const usage = error?.response?.data?.usage;
      if (usage) {
        handleQuotaToast(usage, error?.response?.status === 429);
      }
      setError(error?.response?.data?.message || 'Failed to generate audio');
    } finally {
      setIsGenerating(false);
      setTtsJobId(null);
    }
  };

  const cancelTTS = async () => {
    if (!ttsJobId || !blogId) return;
    try {
      await api.post(`/blogs/${blogId}/tts/cancel/${ttsJobId}`);
      setIsGenerating(false);
      setTtsJobId(null);
      showInfo({ message: 'TTS generation cancelled.' });
    } catch (error) {
      console.error('Error cancelling TTS:', error);
      showError({ message: 'Failed to cancel TTS generation.' });
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
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${showSettings
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
                        width: `${totalDuration ? (currentTime / totalDuration) * 100 : 0}%`,
                        transition: 'width 0.1s linear'
                      }}
                    >
                      {/* Glowing dot at end of progress */}
                      {totalDuration && currentTime > 0 && (
                        <div className="w-4 h-4 bg-white rounded-full shadow-lg shadow-primary/80 opacity-100 group-hover/progress:opacity-100 transition-opacity flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-text-secondary font-semibold">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(totalDuration)}</span>
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
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {isGenerating ? (
                    <Button
                      onClick={cancelTTS}
                      disabled={!ttsJobId}
                      variant="destructive"
                      size="md"
                      className="shadow-lg hover:shadow-xl hover:shadow-red-500/50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel TTS
                    </Button>
                  ) : (
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
                  )}
                </div>
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
