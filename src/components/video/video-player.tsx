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
const SPEED_MIN = 0.25;
const SPEED_MAX = 2;
const SPEED_DEFAULT = 1;
const SPEED_PX_PER_STEP = 40;
const SPEED_HOLD_MS = 280;

function formatPlaybackRate(rate: number): string {
  if (Math.abs(rate - 1) < 0.01) return '1x';
  const rounded = Math.round(rate * 100) / 100;
  return `${rounded}x`;
}

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

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

async function lockLandscape(): Promise<boolean> {
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    if (orientation?.lock) {
      await orientation.lock('landscape');
      return true;
    }
  } catch {
    // Not supported or not allowed outside fullscreen
  }
  return false;
}

async function unlockLandscape(): Promise<void> {
  try {
    screen.orientation?.unlock?.();
  } catch {
    // ignore
  }
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
  const speedGestureRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    startRate: SPEED_DEFAULT,
    active: false,
    holdTimer: null as ReturnType<typeof setTimeout> | null,
  });
  const isSpeedGesturingRef = useRef(false);

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
  const [isStarting, setIsStarting] = useState(false);
  const pendingPlayRef = useRef(false);
  const isScrubbingRef = useRef(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(SPEED_DEFAULT);
  const [showSpeedOverlay, setShowSpeedOverlay] = useState(false);
  const [forceLandscape, setForceLandscape] = useState(false);
  const orientationLockedRef = useRef(false);

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

  const applyPlaybackRate = useCallback((rate: number) => {
    const el = videoRef.current;
    const clamped =
      Math.round(Math.max(SPEED_MIN, Math.min(SPEED_MAX, rate)) * 100) / 100;
    if (el) el.playbackRate = clamped;
    setPlaybackRate(clamped);
  }, []);

  const activateSpeedGesture = useCallback(
    (clientX: number) => {
      const g = speedGestureRef.current;
      g.active = true;
      g.startX = clientX;
      g.startRate = SPEED_DEFAULT;
      isSpeedGesturingRef.current = true;
      applyPlaybackRate(SPEED_DEFAULT);
      setShowSpeedOverlay(true);
      clearHideTimer();
      setShowControls(true);
    },
    [clearHideTimer, applyPlaybackRate],
  );

  const updateSpeedFromPointer = useCallback(
    (clientX: number) => {
      const g = speedGestureRef.current;
      if (!g.active) return;
      const deltaX = clientX - g.startX;
      const deltaRate = (deltaX / SPEED_PX_PER_STEP) * 0.25;
      applyPlaybackRate(g.startRate + deltaRate);
    },
    [applyPlaybackRate],
  );

  const endSpeedGesture = useCallback(() => {
    const g = speedGestureRef.current;
    if (g.holdTimer) {
      clearTimeout(g.holdTimer);
      g.holdTimer = null;
    }
    const wasActive = g.active;
    g.active = false;
    g.pointerId = -1;
    if (wasActive) {
      applyPlaybackRate(SPEED_DEFAULT);
      setShowSpeedOverlay(false);
      if (playing) scheduleHideControls();
    }
    setTimeout(() => {
      isSpeedGesturingRef.current = false;
    }, 50);
  }, [applyPlaybackRate, playing, scheduleHideControls]);

  const handleSpeedPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (isScrubbingRef.current) return;

      const g = speedGestureRef.current;
      g.pointerId = e.pointerId;
      g.startX = e.clientX;
      g.startY = e.clientY;
      g.startRate = SPEED_DEFAULT;
      g.active = false;

      if (g.holdTimer) clearTimeout(g.holdTimer);
      g.holdTimer = setTimeout(() => {
        if (g.pointerId === e.pointerId && !isScrubbingRef.current) {
          activateSpeedGesture(g.startX);
          containerRef.current?.setPointerCapture(e.pointerId);
        }
      }, SPEED_HOLD_MS);
    },
    [activateSpeedGesture],
  );

  const handleSpeedPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const g = speedGestureRef.current;
      if (g.pointerId !== e.pointerId || !g.active) return;

      e.preventDefault();
      updateSpeedFromPointer(e.clientX);
    },
    [updateSpeedFromPointer],
  );

  const handleSpeedPointerEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const g = speedGestureRef.current;
      if (g.pointerId !== e.pointerId) return;

      const wasActive = g.active;
      if (g.holdTimer) {
        clearTimeout(g.holdTimer);
        g.holdTimer = null;
      }

      endSpeedGesture();

      try {
        containerRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer may not be captured
      }

      return wasActive;
    },
    [endSpeedGesture],
  );

  const attemptPlay = useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;

    setPlaybackError(null);
    setIsStarting(true);

    try {
      await el.play();
      pendingPlayRef.current = false;
      setIsBuffering(false);
      setIsStarting(false);
    } catch (err) {
      const domError = err as DOMException;
      if (domError.name === 'AbortError') {
        return;
      }

      // Not enough data yet — wait for the browser to buffer, then retry.
      pendingPlayRef.current = true;
      setIsBuffering(true);

      const retry = () => {
        if (!pendingPlayRef.current) return;
        void el.play()
          .then(() => {
            pendingPlayRef.current = false;
            setIsBuffering(false);
            setIsStarting(false);
          })
          .catch(() => {
            // Still loading — onCanPlay / onPlaying will retry again.
          });
      };

      el.addEventListener('canplay', retry, { once: true });
      el.addEventListener('loadeddata', retry, { once: true });
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

    const mobile = isMobileDevice();
    const isNativeIosFs = isIosDevice() && el.webkitDisplayingFullscreen;

    if (document.fullscreenElement || isNativeIosFs) {
      setForceLandscape(false);
      if (orientationLockedRef.current) {
        await unlockLandscape();
        orientationLockedRef.current = false;
      }
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch {
        // ignore
      }
      if (isNativeIosFs) {
        try {
          el.webkitExitFullscreen?.();
        } catch {
          // ignore
        }
      }
      return;
    }

    try {
      await container.requestFullscreen();
      setIsFullscreen(true);

      if (mobile) {
        const locked = await lockLandscape();
        orientationLockedRef.current = locked;
        if (!locked && window.matchMedia('(orientation: portrait)').matches) {
          setForceLandscape(true);
        }
      }
      return;
    } catch {
      // Container fullscreen unavailable — fall back to native video fullscreen on iOS.
      if (isIosDevice() && el.webkitEnterFullscreen) {
        try {
          el.webkitEnterFullscreen();
        } catch {
          // Fullscreen not supported
        }
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
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        setForceLandscape(false);
        if (orientationLockedRef.current) {
          void unlockLandscape();
          orientationLockedRef.current = false;
        }
      }
    };

    const onOrientationChange = () => {
      if (window.matchMedia('(orientation: landscape)').matches) {
        setForceLandscape(false);
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('orientationchange', onOrientationChange);

    const el = videoRef.current as WebKitVideoElement | null;
    const onWebkitBegin = () => setIsFullscreen(true);
    const onWebkitEnd = () => {
      setIsFullscreen(false);
      setForceLandscape(false);
    };
    el?.addEventListener('webkitbeginfullscreen', onWebkitBegin);
    el?.addEventListener('webkitendfullscreen', onWebkitEnd);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('orientationchange', onOrientationChange);
      el?.removeEventListener('webkitbeginfullscreen', onWebkitBegin);
      el?.removeEventListener('webkitendfullscreen', onWebkitEnd);
      if (orientationLockedRef.current) {
        void unlockLandscape();
        orientationLockedRef.current = false;
      }
    };
  }, [activeSourceUrl]);

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
      const g = speedGestureRef.current;
      if (g.holdTimer) clearTimeout(g.holdTimer);
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
    setIsStarting(false);
    applyPlaybackRate(SPEED_DEFAULT);
    setShowSpeedOverlay(false);
  }, [activeSourceUrl, applyPlaybackRate]);

  // Clear stuck loading state if playback never starts.
  useEffect(() => {
    if (!isStarting && !isBuffering) return;

    const timeout = setTimeout(() => {
      const el = videoRef.current;
      if (!el) return;
      if (!pendingPlayRef.current && el.paused) return;
      pendingPlayRef.current = false;
      setIsBuffering(false);
      setIsStarting(false);
      if (el.paused) {
        setPlaybackError('Tap play to start playback');
      }
    }, 12000);

    return () => clearTimeout(timeout);
  }, [isStarting, isBuffering, activeSourceUrl]);

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
        isFullscreen && 'aspect-auto h-full w-full max-h-none rounded-none',
        forceLandscape && 'player-landscape-fallback',
      )}
      onPointerDown={handleSpeedPointerDown}
      onPointerMove={handleSpeedPointerMove}
      onPointerUp={(e) => {
        if (isScrubbingRef.current) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const wasSpeedGesture = handleSpeedPointerEnd(e);
        if (wasSpeedGesture || isSpeedGesturingRef.current) return;
        handleTap(e.clientX);
      }}
      onPointerCancel={(e) => {
        handleSpeedPointerEnd(e);
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
        src={activeSourceUrl}
        className="h-full w-full object-contain"
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="auto"
        poster={video.posterUrl ?? video.thumbnailUrl ?? undefined}
        onPlay={() => {
          setPlaying(true);
          setIsBuffering(false);
          setIsStarting(false);
          setPlaybackError(null);
          pendingPlayRef.current = false;
        }}
        onPause={() => setPlaying(false)}
        onCanPlay={() => {
          if (pendingPlayRef.current) {
            void attemptPlay();
          }
        }}
        onCanPlayThrough={() => {
          if (pendingPlayRef.current) {
            void attemptPlay();
          }
        }}
        onWaiting={() => {
          if (!videoRef.current?.paused) {
            setIsBuffering(true);
          }
        }}
        onPlaying={() => {
          setIsBuffering(false);
          setIsStarting(false);
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
          setIsStarting(false);
          pendingPlayRef.current = false;
          setPlaybackError('Unable to play this video. Check your connection and try again.');
        }}
      />

      {(isStarting || isBuffering) && !playbackError && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/50">
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

      {showSpeedOverlay && (
        <div className="pointer-events-none absolute left-1/2 top-10 z-20 -translate-x-1/2 sm:top-12">
          <p className="rounded-md bg-black/55 px-2.5 py-1 text-xs font-medium tabular-nums text-white/95 backdrop-blur-sm">
            {formatPlaybackRate(playbackRate)}
          </p>
        </div>
      )}

      {!playing && !playbackError && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="absolute left-1/2 top-1/2 z-30 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600/95 text-white shadow-lg shadow-red-900/40 transition-transform active:scale-95 sm:h-20 sm:w-20"
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

        <div className="flex min-w-0 items-center gap-0.5 sm:gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="shrink-0 rounded-full p-2.5 text-white active:bg-white/20 sm:p-2 sm:hover:bg-white/10"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={() => seekRelative(-SEEK_SECONDS)}
            className="hidden shrink-0 rounded-full p-2 text-white hover:bg-white/10 sm:block"
            aria-label={`Rewind ${SEEK_SECONDS} seconds`}
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => seekRelative(SEEK_SECONDS)}
            className="hidden shrink-0 rounded-full p-2 text-white hover:bg-white/10 sm:block"
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
            className="shrink-0 rounded-full p-2.5 text-white active:bg-white/20 sm:p-2 sm:hover:bg-white/10"
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
            className="hidden h-1 w-20 shrink-0 accent-red-500 sm:block"
            aria-label="Volume"
          />

          <span className="ml-auto min-w-0 shrink truncate text-xs tabular-nums text-white/90 sm:text-sm">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          {qualityOptions.length > 0 && (
            <div className="relative shrink-0">
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
                <Settings className="h-5 w-5" />
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
            className="shrink-0 rounded-full p-2.5 text-white active:bg-white/20 sm:p-2 sm:hover:bg-white/10"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
