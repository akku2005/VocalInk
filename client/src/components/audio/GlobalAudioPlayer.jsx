import { useContext, useEffect, useState } from 'react';
import { AudioContext } from '../../context/AudioContext';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';

const GlobalAudioPlayer = () => {
  const { current, playing, play, pause, next, prev, audioRef } = useContext(AudioContext);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  if (!current) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/70 dark:bg-black/60 backdrop-blur-md border-t border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        <button onClick={prev} className="p-2 cursor-pointer"><SkipBack className="w-5 h-5" /></button>
        <button onClick={playing ? pause : play} className="p-2 cursor-pointer">
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button onClick={next} className="p-2 cursor-pointer"><SkipForward className="w-5 h-5" /></button>
        <div className="flex-1 truncate">
          <span className="text-sm font-medium">{current.title || 'Audio'}</span>
          <span className="text-xs text-text-secondary ml-2">{current.language?.toUpperCase()}</span>
        </div>
        <Volume2 className="w-4 h-4" />
        <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e)=>setVolume(parseFloat(e.target.value))} className="w-24" />
        <audio ref={audioRef} src={current.url} preload="metadata" />
      </div>
    </div>
  );
};

export default GlobalAudioPlayer;