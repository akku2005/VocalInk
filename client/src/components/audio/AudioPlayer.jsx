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
import audioStorageService from '../../services/AudioStorageService';

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
  const [loadingFromStorage, setLoadingFromStorage] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(false);

  const audioRef = useRef(null);
  const blobUrlsRef = useRef([]); // Track blob URLs for cleanup
  const pendingSeekRef = useRef(null); // Track pending seek time when switching segments
  const { isAuthenticated } = useAuth();
  const { showInfo, showError } = useToast();

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => {
        audioStorageService.revokeBlobUrl(url);
      });
      blobUrlsRef.current = [];
    };
  }, []);

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

  // Load audio from IndexedDB on mount
  useEffect(() => {
    const loadFromStorage = async () => {
      if (!blogId || !audioStorageService.isSupported()) {
        setLoadingFromStorage(false);
        return;
      }

      try {
        const stored = await audioStorageService.getAudio(blogId);

        if (stored && stored.segments && stored.segments.length > 0) {
          // Audio found in IndexedDB - create blob URLs for playback
          const normalizedSegments = stored.segments.map(normalizeSegmentForHighlighting);
          const segmentsWithUrls = normalizedSegments.map(seg => {
            const blobUrl = audioStorageService.createBlobUrl(seg.audioData);
            blobUrlsRef.current.push(blobUrl);
            return {
              ...seg,
              url: blobUrl
            };
          });

          setSegments(segmentsWithUrls);
          setTotalDuration(stored.duration || 0);
          setAudioAvailable(true);

          if (segmentsWithUrls.length > 0) {
            setAudioUrl(segmentsWithUrls[0].url);
            setCurrentSegmentIndex(0);
          }

          console.log('✅ Audio loaded from IndexedDB', {
            segments: segmentsWithUrls.length,
            duration: stored.duration,
            firstSegment: segmentsWithUrls[0]
          });
        } else {
          // No audio in IndexedDB - ignore any stale URLs from database
          setAudioAvailable(false);
          setAudioUrl(null);
          setSegments([]);
          console.log('⚠️ No audio in IndexedDB - user needs to generate');
        }
      } catch (error) {
        console.error('Error loading from IndexedDB:', error);
        setAudioAvailable(false);
        setAudioUrl(null);
        setSegments([]);
      } finally {
        setLoadingFromStorage(false);
      }
    };

    loadFromStorage();
  }, [blogId]);

  // REMOVED: Server audio validation logic
  // IndexedDB is now the sole source for audio storage
  // If audio is not in IndexedDB, user must regenerate it

  const normalizeSegmentForHighlighting = (segment) => {
    if (!segment || typeof segment !== 'object') return segment;
    const normalizedId = segment.id || segment.paragraphId || segment._id || null;
    return {
      ...segment,
      id: normalizedId,
      paragraphId: segment.paragraphId || normalizedId,
    };
  };

  // Track current segment and notify parent for highlighting
  const currentSegmentRef = useRef(null);

  // Notify parent of segment change - continuously during playback
  useEffect(() => {
    if (segments.length > 0 && onSegmentChange && isPlaying) {
      const currentSeg = segments[currentSegmentIndex];
      if (currentSeg) {
        // Use id field which contains tts-seg-X for highlighting
        const segmentId = currentSeg.id || currentSeg.paragraphId;

        // Warn if segment lacks ID (old cached audio)
        if (!currentSeg.id && currentSegmentIndex === 0) {
          console.warn('⚠️ TTS segments missing "id" field - highlighting disabled.', {
            segment: currentSeg,
            hint: 'Regenerate audio to enable highlighting'
          });
        }

        const highlightKey = `${segmentId || 'null'}-${currentSegmentIndex}`;

        // Only update if segment actually changed
        if (currentSegmentRef.current !== highlightKey) {
          currentSegmentRef.current = highlightKey;
          onSegmentChange({
            segmentId,
            segmentIndex: currentSegmentIndex,
            text: currentSeg.text
          });
        }
      }
    } else if (!isPlaying && onSegmentChange) {
      // Clear highlighting when not playing
      currentSegmentRef.current = null;
      onSegmentChange(null);
    }
  }, [currentSegmentIndex, segments, onSegmentChange, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);

      // Handle pending seek if we just switched segments due to seek
      if (pendingSeekRef.current !== null) {
        audio.currentTime = pendingSeekRef.current;
        pendingSeekRef.current = null;
      }

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
        setAudioUrl(segments[nextIndex].url); // Use URL directly (already resolved or blob URL)
        // isPlaying remains true, so handleLoadedMetadata will trigger play
      } else {
        // End of playlist or single file
        setIsPlaying(false);
        setCurrentTime(0);
        audio.currentTime = 0;
        // Reset to start
        if (segments.length > 0) {
          setCurrentSegmentIndex(0);
          setAudioUrl(segments[0].url); // Use URL directly (already resolved or blob URL)
        }
      }
    };

    const handleError = (event) => {
      const errorCode = audio?.error?.code;
      const errorMessages = {
        1: 'Audio loading aborted',
        2: 'Network error loading audio',
        3: 'Audio decoding failed',
        4: 'Audio format not supported or file not found'
      };
      const errorMsg = errorMessages[errorCode] || 'Failed to load audio';
      console.error('Audio error:', { errorCode, errorMsg, audioUrl });

      // If audio files don't exist, mark as unavailable
      if (errorCode === 4 || errorCode === 2) {
        setAudioAvailable(false);
        setAudioUrl(null);
        setSegments([]);
        setError('Audio files not found. Please regenerate audio.');
      } else if (audioUrl) {
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

  // DEPRECATED: Ignore initialAudioUrl from database
  // IndexedDB is now the source of truth for audio
  useEffect(() => {
    // Don't use initialAudioUrl - it's likely stale/non-existent
    // User should regenerate audio which will store in IndexedDB
    if (initialAudioUrl && !loadingFromStorage && !audioAvailable) {
      console.log('⚠️ Ignoring legacy audio URL from database:', initialAudioUrl);
      console.log('💡 User needs to regenerate audio to store in IndexedDB');
    }
  }, [initialAudioUrl, loadingFromStorage, audioAvailable]);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        setVoicesLoading(true);
        setVoicesError(null);
        const res = await api.get(`/tts/voices`, { params: { provider: 'googlecloud' } });
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
        provider: 'googlecloud',
        voiceId: voiceSettings.voice,
        language: voiceSettings.language,
        stability: 0.62,
        similarityBoost: 0.55,
        style: 0.2,
        useSpeakerBoost: true
      });

      if (response?.data) {
        const { audioSegments, jobId } = response.data;

        // Store job ID for potential cancellation
        if (jobId) {
          setTtsJobId(jobId);
        }

        console.log('TTS Generated:', { segments: audioSegments?.length, jobId });
        if (audioSegments && audioSegments.length > 0) {
          console.log('Raw API Segments (first 3):', audioSegments.slice(0, 3));
        }

        if (audioSegments && audioSegments.length > 0) {
          // Fetch audio blobs and store in IndexedDB
          const segmentsWithBlobs = await Promise.all(
            audioSegments.map(async (seg) => {
              try {
                const audioUrl = resolveAudioUrl(seg.url);
                const audioResponse = await fetch(audioUrl);
                const audioBlob = await audioResponse.blob();
                const audioData = await audioBlob.arrayBuffer();

                return normalizeSegmentForHighlighting({
                  ...seg,
                  audioData
                });
              } catch (err) {
                console.error(`Failed to fetch segment ${seg.id}:`, err);
                return null;
              }
            })
          );

          const validSegments = segmentsWithBlobs.filter(s => s !== null);

          if (validSegments.length > 0) {
            // Calculate total duration
            const totalDur = validSegments.reduce((sum, seg) => sum + (seg.duration || 0), 0);

            // Store in IndexedDB
            await audioStorageService.saveAudio(
              blogId,
              new ArrayBuffer(0), // Not used, keeping for compatibility
              validSegments,
              totalDur
            );

            // Create blob URLs for playback
            const segmentsWithUrls = validSegments.map((seg) => {
              const blobUrl = audioStorageService.createBlobUrl(seg.audioData);
              blobUrlsRef.current.push(blobUrl);
              return {
                ...seg,
                url: blobUrl
              };
            });

            setSegments(segmentsWithUrls);
            setTotalDuration(totalDur);
            setAudioUrl(segmentsWithUrls[0].url);
            setCurrentSegmentIndex(0);
            setAudioAvailable(true);

            showInfo('Audio saved to your browser storage');
          }
        }

        if (onAudioGenerated) {
          onAudioGenerated(audioSegments);
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
  const filteredVoices = voices.filter(v => v.language === 'en' || v.language?.startsWith('en'));
  const effectiveVoiceOptions = filteredVoices.length > 0
    ? filteredVoices.map(v => ({ value: v.id, label: v.name, previewUrl: v.previewUrl }))
    : voiceOptions;

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
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse"></div>
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
                <Mic2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg text-text-primary tracking-tight">VocalInk</h3>
              <p className="text-xs font-medium text-primary/80 uppercase tracking-wider">AI Voice Narration</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-secondary">
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-secondary"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Player Controls */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlayPause}
                disabled={loadingFromStorage || (!audioAvailable && !audioUrl)}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/5">
                <button onClick={toggleMute} className="text-text-secondary hover:text-primary transition-colors">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Voice Selection Dropdown (No Label) */}
            <div className="w-48">
              <select
                value={voiceSettings.voice}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
                className="w-full px-4 py-3 text-sm font-medium rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-text-primary hover:bg-gray-200 dark:hover:bg-white/10 transition-all shadow-sm hover:shadow-md cursor-pointer outline-none focus:ring-2 focus:ring-primary/50"
              >
                {effectiveVoiceOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expanded Settings */}
          {isExpanded && (
            <div className="pt-6 border-t border-gray-200 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 ml-1">Speed: {voiceSettings.speed}x</label>
                  <div className="px-2 py-2">
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.25"
                      value={voiceSettings.speed}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
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
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                {loadingFromStorage ? (
                  // Loading from IndexedDB
                  <>
                    <div className="relative w-20 h-20 mx-auto mb-5">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-full blur-lg opacity-40 animate-pulse"></div>
                      <div className="relative rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center w-20 h-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      </div>
                    </div>
                    <p className="text-text-primary font-bold mb-2 text-lg">Loading audio...</p>
                    <p className="text-text-secondary text-sm mb-6 font-medium">
                      Checking browser storage
                    </p>
                  </>
                ) : !audioAvailable ? (
                  // No audio available - show generate button
                  <>
                    <div className="relative w-20 h-20 mx-auto mb-5">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-full blur-lg opacity-40 animate-pulse"></div>
                      <div className="relative rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center w-20 h-20">
                        <Mic2 className="w-10 h-10 text-primary" />
                      </div>
                    </div>
                    <p className="text-text-primary font-bold mb-2 text-lg">No Audio Available</p>
                    <p className="text-text-secondary text-sm mb-6 font-medium">
                      Generate AI narration to listen to this post
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
                          Cancel Generation
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
                          {isGenerating ? 'Generating Audio...' : 'Generate Audio'}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  // Audio exists but not loaded yet (fallback)
                  <>
                    <div className="relative w-20 h-20 mx-auto mb-5">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-full blur-lg opacity-40 animate-pulse"></div>
                      <div className="relative rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center w-20 h-20">
                        <Mic2 className="w-10 h-10 text-primary" />
                      </div>
                    </div>
                    <p className="text-text-primary font-bold mb-2 text-lg">Audio Ready</p>
                    <p className="text-text-secondary text-sm font-medium">
                      Click expand to load audio player
                    </p>
                  </>
                )}
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
