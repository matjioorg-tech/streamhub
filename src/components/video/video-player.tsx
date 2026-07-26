'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Check,
} from 'lucide-react';
import type { Video, VideoQualityOption } from '@/lib/api/types';
import { cn, formatDuration } from '@/lib/utils';

const SEEK_SECONDS = 10;
const DOUBLE_TAP_MS = 320;
const CONTROLS_HIDE_MS = 3500;

interface VideoPlayerProps {
  video: Video;
  initialProgress?: number;
  onProgress?: (seconds: number) => void;
}

export function VideoPlayer({
  video,
  initialProgress = 0,
  onProgress,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<{ time: number; zone: 'left' | 'right' | 'center' } | null>(
    null,
  );
  const seekHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seekHint, setSeekHint] = useState<'back' | 'forward' | null>(null);
  const isScrubbingRef = useRef(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const switchingRef = useRef(false);

  const qualityOptions: VideoQualityOption[] = useMemo(() => {
    if (video.qualities?.length) {
      return [...video.qualities].sort((a, b) => b.height - a.height);
    }
    if (video.cdnUrl) {
      return [
        {
          label: video.height ? `${video.height}p` : 'Source',
          height: video.height ?? 0,
          width: video.width,
          url: video.cdnUrl,
          isOriginal: true,
        },
      ];
    }
    return [];
  }, [video]);

  const activeSourceUrl = useMemo(() => {
    if (qualityOptions.length === 0) return null;
    if (selectedQuality === 'auto') return qualityOptions[0].url;
    return (
      qualityOptions.find((q) => q.label === selectedQuality)?.url ??
      qualityOptions[0].url
    );
  }, [qualityOptions, selectedQuality]);

  const activeQualityLabel = useMemo(() => {
    if (selectedQuality === 'auto') {
      return qualityOptions[0] ? `Auto (${qualityOptions[0].label})` : 'Auto';
    }
    return selectedQuality;
  }, [qualityOptions, selectedQuality]);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, CONTROLS_HIDE_MS);
  }, [clearHideTimer]);

  const seekRelative = useCallback((delta: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta));
    setCurrentTime(el.currentTime);
  }, []);

  const showSeekFeedback = useCallback((direction: 'back' | 'forward') => {
    setSeekHint(direction);
    if (seekHintTimerRef.current) clearTimeout(seekHintTimerRef.current);
    seekHintTimerRef.current = setTimeout(() => setSeekHint(null), 700);
  }, []);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not supported
    }
  }, []);

  const getTapZone = useCallback((clientX: number): 'left' | 'right' | 'center' => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 'center';
    const ratio = (clientX - rect.left) / rect.width;
    if (ratio < 0.35) return 'left';
    if (ratio > 0.65) return 'right';
    return 'center';
  }, []);

  const handlePointerUp = useCallback(
    (clientX: number) => {
      const zone = getTapZone(clientX);
      const now = Date.now();
      const last = lastTapRef.current;

      if (
        last &&
        now - last.time < DOUBLE_TAP_MS &&
        last.zone === zone &&
        (zone === 'left' || zone === 'right')
      ) {
        if (zone === 'left') {
          seekRelative(-SEEK_SECONDS);
          showSeekFeedback('back');
        } else {
          seekRelative(SEEK_SECONDS);
          showSeekFeedback('forward');
        }
        lastTapRef.current = null;
        setShowControls(true);
        scheduleHideControls();
        return;
      }

      lastTapRef.current = { time: now, zone };

      if (zone === 'center') {
        setShowControls((prev) => {
          const next = !prev;
          if (next && playing) scheduleHideControls();
          else clearHideTimer();
          return next;
        });
      } else {
        setShowControls(true);
        scheduleHideControls();
      }
    },
    [
      clearHideTimer,
      getTapZone,
      playing,
      scheduleHideControls,
      seekRelative,
      showSeekFeedback,
    ],
  );

  const updateProgressFromPointer = useCallback(
    (clientX: number) => {
      const el = videoRef.current;
      const bar = containerRef.current?.querySelector('[data-progress]') as HTMLElement;
      if (!el || !bar || !el.duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      el.currentTime = ratio * el.duration;
      setCurrentTime(el.currentTime);
    },
    [],
  );

  useEffect(() => {
    const el = videoRef.current;
    if (el && initialProgress > 0) {
      el.currentTime = initialProgress;
      setCurrentTime(initialProgress);
    }
  }, [initialProgress]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const el = videoRef.current;
      if (!el) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay();
          setShowControls(true);
          scheduleHideControls();
          break;
        case 'f':
        case 'F':
          void toggleFullscreen();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(SEEK_SECONDS);
          showSeekFeedback('forward');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(-SEEK_SECONDS);
          showSeekFeedback('back');
          break;
        case 'm':
        case 'M':
          el.muted = !el.muted;
          setMuted(el.muted);
          break;
        case 'j':
        case 'J':
          seekRelative(-SEEK_SECONDS);
          showSeekFeedback('back');
          break;
        case 'l':
        case 'L':
          seekRelative(SEEK_SECONDS);
          showSeekFeedback('forward');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scheduleHideControls, seekRelative, showSeekFeedback, toggleFullscreen, togglePlay]);

  useEffect(() => {
    return () => {
      clearHideTimer();
      if (seekHintTimerRef.current) clearTimeout(seekHintTimerRef.current);
    };
  }, [clearHideTimer]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !activeSourceUrl || switchingRef.current) return;

    const savedTime = el.currentTime;
    const wasPlaying = !el.paused;

    if (el.src === activeSourceUrl || el.currentSrc === activeSourceUrl) return;

    switchingRef.current = true;
    el.src = activeSourceUrl;
    el.load();

    const onLoaded = () => {
      if (savedTime > 0) el.currentTime = savedTime;
      if (wasPlaying) void el.play().catch(() => undefined);
      switchingRef.current = false;
      el.removeEventListener('loadedmetadata', onLoaded);
    };
    el.addEventListener('loadedmetadata', onLoaded);
    return () => el.removeEventListener('loadedmetadata', onLoaded);
  }, [activeSourceUrl]);

  useEffect(() => {
    if (playing && showControls) {
      scheduleHideControls();
    } else {
      clearHideTimer();
    }
  }, [playing, showControls, scheduleHideControls, clearHideTimer]);

  if (!activeSourceUrl) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-zinc-900 text-zinc-400">
        Video not available
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const buffered = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        'group/player relative aspect-video w-full overflow-hidden bg-black',
        'rounded-none sm:rounded-xl',
        isFullscreen && 'rounded-none',
      )}
      onPointerUp={(e) => {
        if (isScrubbingRef.current) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        handlePointerUp(e.clientX);
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        const zone = getTapZone(e.clientX);
        if (zone === 'left') {
          seekRelative(-SEEK_SECONDS);
          showSeekFeedback('back');
        } else if (zone === 'right') {
          seekRelative(SEEK_SECONDS);
          showSeekFeedback('forward');
        } else {
          void toggleFullscreen();
        }
      }}
    >
      <video
        ref={videoRef}
        key={activeSourceUrl}
        className="h-full w-full object-contain"
        playsInline
        preload="metadata"
        src={activeSourceUrl}
        poster={video.posterUrl ?? video.thumbnailUrl ?? undefined}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          if (!isScrubbingRef.current) {
            setCurrentTime(e.currentTarget.currentTime);
            onProgress?.(e.currentTarget.currentTime);
          }
        }}
        onProgress={(e) => {
          const el = e.currentTarget;
          if (el.buffered.length > 0) {
            setBufferedEnd(el.buffered.end(el.buffered.length - 1));
          }
        }}
        onClick={(e) => e.preventDefault()}
      />

      {/* Quality badge */}
      {qualityOptions.length > 1 && (
        <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm sm:text-xs">
          {activeQualityLabel}
        </div>
      )}

      {/* Double-tap zones (mobile hint) */}
      <div className="pointer-events-none absolute inset-0 flex md:opacity-0 md:transition-opacity md:group-hover/player:opacity-100">
        <div className="flex w-[35%] items-center justify-center">
          <div className="rounded-full bg-black/40 p-3 opacity-0 backdrop-blur-sm transition-opacity [.group\/player:active_&]:opacity-100 md:hidden">
            <SkipBack className="h-6 w-6 text-white/80" />
          </div>
        </div>
        <div className="w-[30%]" />
        <div className="flex w-[35%] items-center justify-center">
          <div className="rounded-full bg-black/40 p-3 opacity-0 backdrop-blur-sm transition-opacity [.group\/player:active_&]:opacity-100 md:hidden">
            <SkipForward className="h-6 w-6 text-white/80" />
          </div>
        </div>
      </div>

      {/* Seek feedback */}
      {seekHint && (
        <div
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 animate-pulse rounded-2xl bg-black/70 px-5 py-3 text-lg font-semibold text-white backdrop-blur-sm',
            seekHint === 'back' ? 'left-6' : 'right-6',
          )}
        >
          {seekHint === 'back' ? `- ${SEEK_SECONDS}s` : `+ ${SEEK_SECONDS}s`}
        </div>
      )}

      {/* Center play button when paused */}
      {!playing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600/90 text-white shadow-lg shadow-red-900/40 transition-transform hover:scale-105 active:scale-95 sm:h-20 sm:w-20"
          aria-label="Play"
        >
          <Play className="ml-1 h-8 w-8 fill-current sm:h-10 sm:w-10" />
        </button>
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-12 transition-opacity duration-300 sm:px-4',
          showControls || !playing ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          data-progress
          className="group/progress relative mb-3 h-1.5 cursor-pointer rounded-full bg-white/20 py-2 sm:h-2"
          onPointerDown={(e) => {
            isScrubbingRef.current = true;
            updateProgressFromPointer(e.clientX);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (isScrubbingRef.current) updateProgressFromPointer(e.clientX);
          }}
          onPointerUp={(e) => {
            isScrubbingRef.current = false;
            e.currentTarget.releasePointerCapture(e.pointerId);
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/20 sm:h-1.5">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/30"
              style={{ width: `${buffered}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-red-500"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 opacity-0 shadow transition-opacity group-hover/progress:opacity-100 sm:h-3.5 sm:w-3.5"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="rounded-full p-2 text-white hover:bg-white/10 active:bg-white/20"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Play className="h-5 w-5 fill-current sm:h-6 sm:w-6" />
            )}
          </button>

          <button
            type="button"
            onClick={() => seekRelative(-SEEK_SECONDS)}
            className="hidden rounded-full p-2 text-white hover:bg-white/10 sm:block"
            aria-label={`Rewind ${SEEK_SECONDS} seconds`}
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => seekRelative(SEEK_SECONDS)}
            className="hidden rounded-full p-2 text-white hover:bg-white/10 sm:block"
            aria-label={`Forward ${SEEK_SECONDS} seconds`}
          >
            <SkipForward className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => {
                const el = videoRef.current;
                if (!el) return;
                el.muted = !el.muted;
                setMuted(el.muted);
              }}
              className="rounded-full p-2 text-white hover:bg-white/10"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                const el = videoRef.current;
                if (!el) return;
                const v = parseFloat(e.target.value);
                el.volume = v;
                el.muted = v === 0;
                setVolume(v);
                setMuted(v === 0);
              }}
              className="h-1 w-20 accent-red-500"
              aria-label="Volume"
            />
          </div>

          <span className="ml-auto text-xs tabular-nums text-white/90 sm:text-sm">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          {qualityOptions.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowQualityMenu((v) => !v);
                  setShowControls(true);
                  clearHideTimer();
                }}
                className="rounded-full p-2 text-white hover:bg-white/10 active:bg-white/20"
                aria-label="Quality settings"
              >
                <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-2 min-w-[140px] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900/95 py-1 shadow-xl backdrop-blur">
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Quality
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuality('auto');
                      setShowQualityMenu(false);
                      scheduleHideControls();
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                  >
                    <span>
                      Auto
                      {qualityOptions[0] ? ` (${qualityOptions[0].label})` : ''}
                    </span>
                    {selectedQuality === 'auto' && (
                      <Check className="h-4 w-4 shrink-0 text-red-400" />
                    )}
                  </button>
                  {qualityOptions.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => {
                        setSelectedQuality(q.label);
                        setShowQualityMenu(false);
                        scheduleHideControls();
                      }}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                    >
                      <span>
                        {q.label}
                        {q.isOriginal ? ' · Source' : ''}
                      </span>
                      {selectedQuality === q.label && (
                        <Check className="h-4 w-4 shrink-0 text-red-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="rounded-full p-2 text-white hover:bg-white/10 active:bg-white/20"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Maximize className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
