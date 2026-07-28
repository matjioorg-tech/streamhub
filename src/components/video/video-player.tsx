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
  AlertCircle,
} from 'lucide-react';
import type { Video, VideoQualityOption } from '@/lib/api/types';
import { cn, formatDuration } from '@/lib/utils';

const SEEK_SECONDS = 10;
const DOUBLE_TAP_MS = 320;
const CONTROLS_HIDE_MS = 3500;

type WebKitVideoElement = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

interface VideoPlayerProps {
  video: Video;
  initialProgress?: number;
  onProgress?: (seconds: number) => void;
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
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
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const pendingPlayRef = useRef(false);
  const isScrubbingRef = useRef(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

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

  const sourceMimeType = video.mimeType ?? 'video/mp4';

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

  const attemptPlay = useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;

    setPlaybackError(null);

    if (el.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      pendingPlayRef.current = true;
      setIsBuffering(true);
      return;
    }

    try {
      await el.play();
      pendingPlayRef.current = false;
      setIsBuffering(false);
    } catch (err) {
      const domError = err as DOMException;
      if (domError.name === 'AbortError') {
        return;
      }
      if (el.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        pendingPlayRef.current = true;
        setIsBuffering(true);
        return;
      }
      setIsBuffering(false);
      setPlaybackError('Tap play to start playback');
    }
  }, []);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void attemptPlay();
    } else {
      el.pause();
    }
  }, [attemptPlay]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    const el = videoRef.current as WebKitVideoElement | null;
    if (!container || !el) return;

    if (isIosDevice() && el.webkitEnterFullscreen) {
      try {
        if (el.webkitDisplayingFullscreen) {
          el.webkitExitFullscreen?.();
        } else {
          el.webkitEnterFullscreen();
        }
      } catch {
        // iOS fullscreen unavailable
      }
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      try {
        await el.requestFullscreen();
      } catch {
        // Fullscreen not supported
      }
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

  const handleTap = useCallback(
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
        if (!playing) {
          togglePlay();
          setShowControls(true);
          scheduleHideControls();
        } else {
          setShowControls((prev) => {
            const next = !prev;
            if (next) scheduleHideControls();
            else clearHideTimer();
            return next;
          });
        }
        return;
      }

      setShowControls(true);
      scheduleHideControls();
    },
    [
      clearHideTimer,
      getTapZone,
      playing,
      scheduleHideControls,
      seekRelative,
      showSeekFeedback,
      togglePlay,
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
    if (playing && showControls) {
      scheduleHideControls();
    } else {
      clearHideTimer();
    }
  }, [playing, showControls, scheduleHideControls, clearHideTimer]);

  useEffect(() => {
    pendingPlayRef.current = false;
    setPlaybackError(null);
    setIsBuffering(false);
  }, [activeSourceUrl]);

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
        'group/player relative aspect-video w-full max-h-[56.25vw] touch-manipulation overflow-hidden bg-black',
        'sm:max-h-none',
        'rounded-none sm:rounded-xl',
        isFullscreen && 'max-h-none rounded-none',
      )}
      onPointerUp={(e) => {
        if (isScrubbingRef.current) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        handleTap(e.clientX);
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
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="metadata"
        poster={video.posterUrl ?? video.thumbnailUrl ?? undefined}
        onPlay={() => {
          setPlaying(true);
          setIsBuffering(false);
          setPlaybackError(null);
        }}
        onPause={() => setPlaying(false)}
        onLoadedData={() => {
          if (pendingPlayRef.current) {
            void attemptPlay();
          }
        }}
        onCanPlay={() => {
          if (pendingPlayRef.current) {
            void attemptPlay();
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          pendingPlayRef.current = false;
        }}
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
        onError={() => {
          setIsBuffering(false);
          pendingPlayRef.current = false;
          setPlaybackError('Unable to play this video. Check your connection and try again.');
        }}
      >
        <source src={activeSourceUrl} type={sourceMimeType} />
      </video>

      {isBuffering && !playbackError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <p className="text-xs text-zinc-300">Loading video...</p>
        </div>
      )}

      {playbackError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm text-zinc-200">{playbackError}</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPlaybackError(null);
              void attemptPlay();
            }}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      )}

      {qualityOptions.length > 1 && (
        <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm sm:text-xs">
          {activeQualityLabel}
        </div>
      )}

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

      {seekHint && (
        <div
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 animate-pulse rounded-2xl bg-black/70 px-5 py-3 text-lg font-semibold text-white backdrop-blur-sm',
            seekHint === 'back' ? 'left-4 sm:left-6' : 'right-4 sm:right-6',
          )}
        >
          {seekHint === 'back' ? `- ${SEEK_SECONDS}s` : `+ ${SEEK_SECONDS}s`}
        </div>
      )}

      {!playing && !playbackError && !isBuffering && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600/95 text-white shadow-lg shadow-red-900/40 transition-transform active:scale-95 sm:h-20 sm:w-20"
          aria-label="Play"
        >
          <Play className="ml-0.5 h-7 w-7 fill-current sm:ml-1 sm:h-10 sm:w-10" />
        </button>
      )}

      <div
        className={cn(
          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-10 transition-opacity duration-300 sm:px-4 sm:pt-12',
          showControls || !playing ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          data-progress
          className="group/progress relative mb-2 h-3 cursor-pointer rounded-full sm:mb-3 sm:h-2"
          onPointerDown={(e) => {
            isScrubbingRef.current = true;
            updateProgressFromPointer(e.clientX);
            e.currentTarget.setPointerCapture(e.pointerId);
            setShowControls(true);
            clearHideTimer();
          }}
          onPointerMove={(e) => {
            if (isScrubbingRef.current) updateProgressFromPointer(e.clientX);
          }}
          onPointerUp={(e) => {
            isScrubbingRef.current = false;
            e.currentTarget.releasePointerCapture(e.pointerId);
            if (playing) scheduleHideControls();
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/20 sm:h-1.5">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/30"
              style={{ width: `${buffered}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-red-500"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow sm:h-3.5 sm:w-3.5"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="rounded-full p-2.5 text-white active:bg-white/20 sm:p-2 sm:hover:bg-white/10"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <Pause className="h-6 w-6 sm:h-6 sm:w-6" />
            ) : (
              <Play className="h-6 w-6 fill-current sm:h-6 sm:w-6" />
            )}
          </button>

          <button
            type="button"
            onClick={() => seekRelative(-SEEK_SECONDS)}
            className="rounded-full p-2.5 text-white active:bg-white/20 sm:hidden"
            aria-label={`Rewind ${SEEK_SECONDS} seconds`}
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => seekRelative(SEEK_SECONDS)}
            className="rounded-full p-2.5 text-white active:bg-white/20 sm:hidden"
            aria-label={`Forward ${SEEK_SECONDS} seconds`}
          >
            <SkipForward className="h-5 w-5" />
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

          <button
            type="button"
            onClick={() => {
              const el = videoRef.current;
              if (!el) return;
              el.muted = !el.muted;
              setMuted(el.muted);
            }}
            className="rounded-full p-2.5 text-white active:bg-white/20 sm:p-2 sm:hover:bg-white/10"
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
            className="hidden h-1 w-20 accent-red-500 sm:block"
            aria-label="Volume"
          />

          <span className="ml-auto text-[11px] tabular-nums text-white/90 sm:text-sm">
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
                className="rounded-full p-2.5 text-white active:bg-white/20 sm:p-2 sm:hover:bg-white/10"
                aria-label="Quality settings"
              >
                <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-2 max-h-[50vh] min-w-[140px] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900/95 py-1 shadow-xl backdrop-blur">
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
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-white active:bg-white/10"
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
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-white active:bg-white/10"
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
            className="rounded-full p-2.5 text-white active:bg-white/20 sm:p-2 sm:hover:bg-white/10"
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
