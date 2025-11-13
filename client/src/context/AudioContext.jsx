import { createContext, useEffect, useMemo, useRef, useState } from 'react';

export const AudioContext = createContext({
  queue: [],
  current: null,
  playing: false,
  addTrack: () => {},
  play: () => {},
  pause: () => {},
  next: () => {},
  prev: () => {},
});

export const AudioProvider = ({ children }) => {
  const [queue, setQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('vocalink_audio_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = parseInt(localStorage.getItem('vocalink_audio_index') || '0', 10);
    return Number.isNaN(idx) ? 0 : idx;
  });
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const current = queue[currentIndex] || null;

  useEffect(() => {
    localStorage.setItem('vocalink_audio_queue', JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem('vocalink_audio_index', String(currentIndex));
  }, [currentIndex]);

  const addTrack = (track) => {
    setQueue(prev => [...prev, track]);
    if (current == null) setCurrentIndex(0);
  };

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  const next = () => {
    setCurrentIndex(i => Math.min(i + 1, Math.max(0, queue.length - 1)));
  };

  const prev = () => {
    setCurrentIndex(i => Math.max(0, i - 1));
  };

  const value = useMemo(() => ({ queue, current, playing, addTrack, play, pause, next, prev, audioRef }), [queue, current, playing]);

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};