'use client';

import { useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
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
import { pickAutoQualityOption } from '@/lib/video-quality';
import { primeVideoStream } from '@/lib/video-cache';
import { takeVideoAutoplayIntent } from '@/lib/video-autoplay';
import { SeekFeedbackOverlay } from '@/components/video/seek-feedback-overlay';
import {
  DEFAULT_VIDEO_ZOOM,
  applyPinchCenterZoom,
  computeContainedVideoSize,
  formatZoomPercent,
  getTouchDistance,
  clampPan,
  snapVideoZoom,
  type VideoZoomTransform,
  VIDEO_ZOOM_MAX,
  VIDEO_ZOOM_MIN,
} from '@/lib/video-player-zoom';

const SEEK_SECONDS = 10;
const DOUBLE_TAP_MS = 320;
const CONTROLS_HIDE_MS = 3500;
const SPEED_MIN = 0.5;
const SPEED_MAX = 4;
const SPEED_DEFAULT = 1;
const SPEED_HOLD_RATE = 2;
const SPEED_STEP = 0.5;
const SPEED_SWIPE_PX = 48;
const SPEED_HOLD_MS = 180;
const SPEED_STEP_INDEXES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4] as const;
const SPEED_HOLD_INDEX = SPEED_STEP_INDEXES.indexOf(SPEED_HOLD_RATE);
const TAP_MOVE_THRESHOLD = 10;
const HOLD_CANCEL_PX = 22;
const TAP_SUPPRESS_MS = 350;
const PROGRESS_PAD = 12;
const SWIPE_SEEK_PX = 40;

interface LocalPointer {
  localX: number;
  localY: number;
  width: number;
  height: number;
}

/** Map screen coords to player-local coords. */
function getLocalPointerCoords(
  clientX: number,
  clientY: number,
  container: HTMLElement,
): LocalPointer {
  const rect = container.getBoundingClientRect();
  return {
    localX: clientX - rect.left,
    localY: clientY - rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function snapSpeed(rate: number): number {
  const clamped = Math.max(SPEED_MIN, Math.min(SPEED_MAX, rate));
  return Math.round(clamped / SPEED_STEP) * SPEED_STEP;
}

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
};

async function requestElementFullscreen(el: HTMLElement): Promise<void> {
  if (el.requestFullscreen) {
    await el.requestFullscreen();
    return;
  }
  const webkit = (el as FsElement).webkitRequestFullscreen;
  if (webkit) {
    await webkit.call(el);
    return;
  }
  const moz = (el as FsElement).mozRequestFullScreen;
  if (moz) {
    await moz.call(el);
    return;
  }
  throw new Error('Fullscreen not supported');
}

async function exitElementFullscreen(): Promise<void> {
  const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> };
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  if (doc.webkitExitFullscreen) {
    await doc.webkitExitFullscreen();
  }
}

function getZoomViewportSize(container: HTMLElement): { width: number; height: number } {
  const rect = container.getBoundingClientRect();
  return {
    width: Math.max(1, rect.width),
    height: Math.max(1, rect.height),
  };
}

function getZoomContentSize(
  container: HTMLElement,
  videoEl: HTMLVideoElement | null,
  fallbackWidth: number,
  fallbackHeight: number,
): { width: number; height: number } {
  const viewport = getZoomViewportSize(container);
  return computeContainedVideoSize(
    viewport.width,
    viewport.height,
    videoEl?.videoWidth || fallbackWidth || 16,
    videoEl?.videoHeight || fallbackHeight || 9,
  );
}

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
  autoPlay?: boolean;
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function isPortrait(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(orientation: portrait)').matches;
}

function waitUntilCanPlay(el: HTMLVideoElement, timeoutMs = 20000): Promise<void> {
  if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve();
  }

  el.preload = 'auto';
  if (el.networkState === HTMLMediaElement.NETWORK_EMPTY) {
    el.load();
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('Video buffer timeout'));
    }, timeoutMs);

    const onReady = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      el.removeEventListener('canplay', onReady);
      el.removeEventListener('loadeddata', onReady);
    };

    el.addEventListener('canplay', onReady, { once: true });
    el.addEventListener('loadeddata', onReady, { once: true });
  });
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
  autoPlay = false,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<{ time: number; zone: 'left' | 'right' | 'center' } | null>(
    null,
  );
  const seekHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekBurstRef = useRef({
    direction: 'forward' as 'back' | 'forward',
    seconds: SEEK_SECONDS,
    burstAt: 0,
  });
  const speedGestureRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    speedSwipeOriginX: 0,
    startRate: SPEED_DEFAULT,
    lastStep: 0,
    active: false,
    holdTimer: null as ReturnType<typeof setTimeout> | null,
  });
  const isSpeedGesturingRef = useRef(false);
  const suppressTapUntilRef = useRef(0);
  const pointerSessionRef = useRef({ moved: false, speedUsed: false });
  const pointerStartRef = useRef({ x: 0, y: 0, localX: 0, localY: 0, time: 0 });
  const lastPointerRef = useRef({ clientX: 0, clientY: 0, localX: 0, localY: 0 });
  const lastAppliedRateRef = useRef(SPEED_DEFAULT);
  const overlayRafRef = useRef<number | null>(null);
  const isFullscreenRef = useRef(false);
  const gestureLayerRef = useRef<HTMLDivElement>(null);
  const documentGestureCleanupRef = useRef<(() => void) | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seekFeedback, setSeekFeedback] = useState<{
    direction: 'back' | 'forward';
    seconds: number;
    animationKey: number;
  } | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const pendingPlayRef = useRef(false);
  const autoplayPendingRef = useRef(false);
  const isScrubbingRef = useRef(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const scrubSessionRef = useRef({
    wasPlaying: false,
    pointerId: -1,
    target: null as HTMLElement | null,
    docCleanup: null as (() => void) | null,
  });
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(SPEED_DEFAULT);
  const [showSpeedOverlay, setShowSpeedOverlay] = useState(false);
  const [gestureActive, setGestureActive] = useState(false);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const [showRotateHint, setShowRotateHint] = useState(false);
  const orientationLockedRef = useRef(false);
  const resumeAfterFsRef = useRef(false);
  const videoZoomRef = useRef<VideoZoomTransform>(DEFAULT_VIDEO_ZOOM);
  const pinchBlocksGesturesRef = useRef(false);
  const pinchGestureRef = useRef({
    active: false,
    panning: false,
    startDistance: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    panStartX: 0,
    panStartY: 0,
    panOriginX: 0,
    panOriginY: 0,
  });
  const zoomHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [videoZoom, setVideoZoom] = useState<VideoZoomTransform>(DEFAULT_VIDEO_ZOOM);
  const [isPinching, setIsPinching] = useState(false);
  const [showZoomHint, setShowZoomHint] = useState(false);
  const [fsPortraitChromeBottom, setFsPortraitChromeBottom] = useState(0);
  const [zoomContentSize, setZoomContentSize] = useState({ width: 0, height: 0 });
  const zoomContentSizeRef = useRef({ width: 0, height: 0 });

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
    if (selectedQuality === 'auto') {
      return pickAutoQualityOption(qualityOptions)?.url ?? qualityOptions[0].url;
    }
    return (
      qualityOptions.find((q) => q.label === selectedQuality)?.url ??
      qualityOptions[0].url
    );
  }, [qualityOptions, selectedQuality]);

  const activeQualityLabel = useMemo(() => {
    if (selectedQuality === 'auto') {
      const auto = pickAutoQualityOption(qualityOptions);
      return auto ? `Auto (${auto.label})` : 'Auto';
    }
    return selectedQuality;
  }, [qualityOptions, selectedQuality]);

  const posterUrl = video.thumbnailUrl ?? video.posterUrl ?? undefined;

  const zoomEnabled = isFullscreen || pseudoFullscreen;

  const applyVideoZoom = useCallback((next: VideoZoomTransform) => {
    videoZoomRef.current = next;
    setVideoZoom(next);
    if (Math.abs(next.scale - 1) > 0.02) {
      setShowZoomHint(true);
      if (zoomHintTimerRef.current) clearTimeout(zoomHintTimerRef.current);
      zoomHintTimerRef.current = setTimeout(() => setShowZoomHint(false), 1200);
    } else {
      setShowZoomHint(false);
    }
  }, []);

  const resetVideoZoom = useCallback(() => {
    videoZoomRef.current = DEFAULT_VIDEO_ZOOM;
    setVideoZoom(DEFAULT_VIDEO_ZOOM);
    setShowZoomHint(false);
    pinchGestureRef.current.active = false;
    pinchGestureRef.current.panning = false;
    pinchBlocksGesturesRef.current = false;
    pinchGestureRef.current.startX = 0;
    pinchGestureRef.current.startY = 0;
    pinchGestureRef.current.startScale = 1;
  }, []);

  const syncZoomContentSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const next = getZoomContentSize(
      container,
      videoRef.current,
      video.width ?? 16,
      video.height ?? 9,
    );
    zoomContentSizeRef.current = next;
    setZoomContentSize(next);
  }, [video.height, video.width]);

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
    const now = Date.now();
    const burst = seekBurstRef.current;
    const seconds =
      burst.direction === direction && now - burst.burstAt < 900
        ? burst.seconds + SEEK_SECONDS
        : SEEK_SECONDS;

    seekBurstRef.current = { direction, seconds, burstAt: now };
    setSeekFeedback({ direction, seconds, animationKey: now });

    if (seekHintTimerRef.current) clearTimeout(seekHintTimerRef.current);
    seekHintTimerRef.current = setTimeout(() => setSeekFeedback(null), 750);
  }, []);

  const applyPlaybackRate = useCallback((rate: number) => {
    const el = videoRef.current;
    const snapped = snapSpeed(rate);
    if (el && el.playbackRate !== snapped) {
      el.playbackRate = snapped;
    }
    lastAppliedRateRef.current = snapped;
    if (overlayRafRef.current !== null) return;
    overlayRafRef.current = requestAnimationFrame(() => {
      overlayRafRef.current = null;
      setPlaybackRate(lastAppliedRateRef.current);
    });
  }, []);

  const flushPlaybackRate = useCallback((rate: number) => {
    const el = videoRef.current;
    const snapped = snapSpeed(rate);
    if (el) el.playbackRate = snapped;
    lastAppliedRateRef.current = snapped;
    if (overlayRafRef.current !== null) {
      cancelAnimationFrame(overlayRafRef.current);
      overlayRafRef.current = null;
    }
    setPlaybackRate(snapped);
  }, []);

  const getSpeedSwipeThreshold = useCallback(() => {
    if (isFullscreenRef.current) return 28;
    const width = containerRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    return Math.max(24, Math.min(44, width * 0.055));
  }, []);

  const activateSpeedGesture = useCallback(
    (clientX: number) => {
      const g = speedGestureRef.current;
      const session = pointerSessionRef.current;
      g.active = true;
      g.speedSwipeOriginX = clientX;
      g.startRate = SPEED_HOLD_RATE;
      g.lastStep = 0;
      session.speedUsed = true;
      isSpeedGesturingRef.current = true;
      flushPlaybackRate(SPEED_HOLD_RATE);
      setShowSpeedOverlay(true);
      clearHideTimer();
      const el = videoRef.current;
      if (el?.paused) {
        void el.play().catch(() => undefined);
      }
    },
    [clearHideTimer, flushPlaybackRate],
  );

  const updateSpeedFromPointer = useCallback(
    (clientX: number) => {
      const g = speedGestureRef.current;
      if (!g.active) return;
      const threshold = getSpeedSwipeThreshold();
      const deltaX = clientX - g.speedSwipeOriginX;
      const steps = Math.round(deltaX / threshold);
      if (steps === g.lastStep) return;
      g.lastStep = steps;
      const stepIndex = Math.max(
        0,
        Math.min(SPEED_STEP_INDEXES.length - 1, SPEED_HOLD_INDEX + steps),
      );
      flushPlaybackRate(SPEED_STEP_INDEXES[stepIndex]);
    },
    [flushPlaybackRate, getSpeedSwipeThreshold],
  );

  const getPointerLocal = useCallback((clientX: number, clientY: number): LocalPointer => {
    const container = containerRef.current;
    if (!container) {
      return { localX: clientX, localY: clientY, width: 1, height: 1 };
    }
    return getLocalPointerCoords(clientX, clientY, container);
  }, []);

  const endSpeedGesture = useCallback(() => {
    const g = speedGestureRef.current;
    if (g.holdTimer) {
      clearTimeout(g.holdTimer);
      g.holdTimer = null;
    }
    const wasActive = g.active;
    g.active = false;
    g.pointerId = -1;
    g.lastStep = 0;
    if (wasActive) {
      flushPlaybackRate(SPEED_DEFAULT);
      setShowSpeedOverlay(false);
      suppressTapUntilRef.current = Date.now() + TAP_SUPPRESS_MS;
      if (playing) scheduleHideControls();
    }
    setTimeout(() => {
      isSpeedGesturingRef.current = false;
    }, TAP_SUPPRESS_MS);
  }, [flushPlaybackRate, playing, scheduleHideControls]);

  const shouldIgnoreTap = useCallback(() => {
    if (isSpeedGesturingRef.current) return true;
    if (Date.now() < suppressTapUntilRef.current) return true;
    if (pointerSessionRef.current.moved) return true;
    if (pointerSessionRef.current.speedUsed) return true;
    return false;
  }, []);

  const handleTapRef = useRef<(clientX: number, clientY: number) => void>(() => {});
  const shouldIgnoreTapRef = useRef<() => boolean>(() => false);

  const cleanupDocumentGesture = useCallback(() => {
    documentGestureCleanupRef.current?.();
    documentGestureCleanupRef.current = null;
  }, []);

  const updateSpeedFromPointerRef = useRef(updateSpeedFromPointer);
  const endSpeedGestureRef = useRef(endSpeedGesture);
  const cleanupDocumentGestureRef = useRef(cleanupDocumentGesture);

  useEffect(() => {
    updateSpeedFromPointerRef.current = updateSpeedFromPointer;
    endSpeedGestureRef.current = endSpeedGesture;
    cleanupDocumentGestureRef.current = cleanupDocumentGesture;
  }, [updateSpeedFromPointer, endSpeedGesture, cleanupDocumentGesture]);

  const finishSpeedTouchSession = useCallback(() => {
    cleanupDocumentGestureRef.current();
    setGestureActive(false);
    endSpeedGestureRef.current();
    try {
      const layer = gestureLayerRef.current;
      const pointerId = speedGestureRef.current.pointerId;
      if (layer && pointerId >= 0 && layer.hasPointerCapture(pointerId)) {
        layer.releasePointerCapture(pointerId);
      }
    } catch {
      // ignore
    }
    speedGestureRef.current.pointerId = -1;
  }, []);

  const handlePinchTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!zoomEnabled || isScrubbingRef.current) return;

      const pinch = pinchGestureRef.current;

      if (e.touches.length === 2) {
        pinchBlocksGesturesRef.current = true;
        pinch.active = true;
        pinch.panning = false;
        pinch.startDistance = getTouchDistance(e.touches);
        pinch.startScale = videoZoomRef.current.scale;
        const hasPan =
          Math.abs(videoZoomRef.current.x) > 0.5 || Math.abs(videoZoomRef.current.y) > 0.5;
        pinch.startX = hasPan ? videoZoomRef.current.x : 0;
        pinch.startY = hasPan ? videoZoomRef.current.y : 0;
        setIsPinching(true);
        setGestureActive(true);
        cleanupDocumentGesture();
        endSpeedGesture();
        if (speedGestureRef.current.holdTimer) {
          clearTimeout(speedGestureRef.current.holdTimer);
          speedGestureRef.current.holdTimer = null;
        }
        e.preventDefault();
        return;
      }

      if (
        e.touches.length === 1 &&
        videoZoomRef.current.scale > VIDEO_ZOOM_MIN + 0.02 &&
        !speedGestureRef.current.active &&
        !speedGestureRef.current.holdTimer
      ) {
        pinch.panning = false;
        pinch.panStartX = e.touches[0].clientX;
        pinch.panStartY = e.touches[0].clientY;
        pinch.panOriginX = videoZoomRef.current.x;
        pinch.panOriginY = videoZoomRef.current.y;
      }
    },
    [cleanupDocumentGesture, endSpeedGesture, zoomEnabled],
  );

  const handlePinchTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const speed = speedGestureRef.current;
      if (speed.active && e.touches.length >= 1) {
        e.preventDefault();
        updateSpeedFromPointerRef.current(e.touches[0].clientX);
        lastPointerRef.current.clientX = e.touches[0].clientX;
        lastPointerRef.current.clientY = e.touches[0].clientY;
        return;
      }

      if (!zoomEnabled) return;
      const container = containerRef.current;
      if (!container) return;

      const pinch = pinchGestureRef.current;
      const { width, height } = zoomContentSizeRef.current.width
        ? zoomContentSizeRef.current
        : getZoomContentSize(container, videoRef.current, video.width ?? 16, video.height ?? 9);

      if (e.touches.length === 2 && pinch.active) {
        e.preventDefault();
        const distance = getTouchDistance(e.touches);
        if (pinch.startDistance <= 0) return;

        const nextScale = pinch.startScale * (distance / pinch.startDistance);
        const updated = applyPinchCenterZoom(
          pinch.startScale,
          nextScale,
          pinch.startX,
          pinch.startY,
          width,
          height,
        );
        applyVideoZoom(updated);
        return;
      }

      if (e.touches.length === 1 && videoZoomRef.current.scale > 1) {
        const speed = speedGestureRef.current;
        if (speed.active || speed.holdTimer) return;

        const pinch = pinchGestureRef.current;
        const dx = e.touches[0].clientX - pinch.panStartX;
        const dy = e.touches[0].clientY - pinch.panStartY;
        if (!pinch.panning && Math.hypot(dx, dy) < TAP_MOVE_THRESHOLD) return;

        if (!pinch.panning) {
          pinch.panning = true;
          setGestureActive(true);
        }

        e.preventDefault();
        const { x, y } = clampPan(
          videoZoomRef.current.scale,
          pinch.panOriginX + dx,
          pinch.panOriginY + dy,
          width,
          height,
        );
        applyVideoZoom({ scale: videoZoomRef.current.scale, x, y });
      }
    },
    [applyVideoZoom, zoomEnabled],
  );

  const handlePinchTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (speedGestureRef.current.active && e.touches.length === 0) {
        e.preventDefault();
        finishSpeedTouchSession();
        return;
      }

      if (!zoomEnabled) return;

      const pinch = pinchGestureRef.current;
      const container = containerRef.current;

      if (e.touches.length < 2) {
        pinch.active = false;
        setIsPinching(false);
      }

      if (e.touches.length === 0) {
        pinch.panning = false;
        pinchBlocksGesturesRef.current = false;
        setGestureActive(false);

        if (container) {
          const { width, height } = getZoomContentSize(
            container,
            videoRef.current,
            video.width ?? 16,
            video.height ?? 9,
          );
          applyVideoZoom(snapVideoZoom(videoZoomRef.current, width, height));
        } else {
          applyVideoZoom(snapVideoZoom(videoZoomRef.current, 1, 1));
        }
      } else if (e.touches.length === 1 && pinch.active) {
        pinch.active = false;
        setIsPinching(false);
        pinch.panning = true;
        pinch.panStartX = e.touches[0].clientX;
        pinch.panStartY = e.touches[0].clientY;
        pinch.panOriginX = videoZoomRef.current.x;
        pinch.panOriginY = videoZoomRef.current.y;
      }
    },
    [applyVideoZoom, finishSpeedTouchSession, video.height, video.width, zoomEnabled],
  );

  const handleGesturePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (isScrubbingRef.current) return;
      if (pinchBlocksGesturesRef.current || pinchGestureRef.current.active) return;

      cleanupDocumentGesture();

      const local = getPointerLocal(e.clientX, e.clientY);
      const pointerId = e.pointerId;

      lastPointerRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        localX: local.localX,
        localY: local.localY,
      };

      setGestureActive(true);
      pointerStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        localX: local.localX,
        localY: local.localY,
        time: Date.now(),
      };
      pointerSessionRef.current = { moved: false, speedUsed: false };

      const g = speedGestureRef.current;
      g.pointerId = pointerId;
      g.startX = local.localX;
      g.startY = local.localY;
      g.startRate = SPEED_HOLD_RATE;
      g.lastStep = 0;
      g.active = false;

      try {
        gestureLayerRef.current?.setPointerCapture(pointerId);
      } catch {
        // ignore
      }

      const processMove = (clientX: number, clientY: number, preventDefault?: () => void) => {
        const gesture = speedGestureRef.current;
        if (!gesture.active && gesture.pointerId !== pointerId) return;

        const point = getPointerLocal(clientX, clientY);
        lastPointerRef.current = {
          clientX,
          clientY,
          localX: point.localX,
          localY: point.localY,
        };

        const deltaX = point.localX - pointerStartRef.current.localX;
        const deltaY = point.localY - pointerStartRef.current.localY;

        if (Math.abs(deltaX) > TAP_MOVE_THRESHOLD || Math.abs(deltaY) > TAP_MOVE_THRESHOLD) {
          pointerSessionRef.current.moved = true;
        }

        if (
          !gesture.active &&
          Math.abs(deltaY) > (isFullscreenRef.current ? 32 : HOLD_CANCEL_PX) &&
          Math.abs(deltaY) > Math.abs(deltaX) * 1.5
        ) {
          if (gesture.holdTimer) {
            clearTimeout(gesture.holdTimer);
            gesture.holdTimer = null;
          }
          return;
        }

        if (!gesture.active) return;

        preventDefault?.();
        updateSpeedFromPointer(clientX);
      };

      const processEnd = (clientX: number, clientY: number) => {
        const gesture = speedGestureRef.current;
        if (gesture.pointerId !== pointerId && !gesture.active) return;

        cleanupDocumentGesture();
        setGestureActive(false);

        const wasSpeedActive = gesture.active;
        endSpeedGesture();

        try {
          const layer = gestureLayerRef.current;
          if (layer?.hasPointerCapture(pointerId)) {
            layer.releasePointerCapture(pointerId);
          }
        } catch {
          // ignore
        }

        if (wasSpeedActive || pointerSessionRef.current.speedUsed) return;

        const point = getPointerLocal(clientX, clientY);
        const deltaX = point.localX - pointerStartRef.current.localX;
        const deltaY = point.localY - pointerStartRef.current.localY;

        if (
          Math.abs(deltaX) > SWIPE_SEEK_PX &&
          Math.abs(deltaX) > Math.abs(deltaY) * 1.2
        ) {
          seekRelative(deltaX > 0 ? SEEK_SECONDS : -SEEK_SECONDS);
          showSeekFeedback(deltaX > 0 ? 'forward' : 'back');
          suppressTapUntilRef.current = Date.now() + TAP_SUPPRESS_MS;
          pointerSessionRef.current.moved = true;
          return;
        }

        if (shouldIgnoreTapRef.current()) return;
        handleTapRef.current(clientX, clientY);
      };

      if (g.holdTimer) clearTimeout(g.holdTimer);
      g.holdTimer = setTimeout(() => {
        if (g.pointerId === pointerId && !isScrubbingRef.current) {
          const { clientX } = lastPointerRef.current;
          activateSpeedGesture(clientX);
          updateSpeedFromPointer(clientX);
        }
      }, SPEED_HOLD_MS);

      let usedPointerEvents = false;

      const onDocMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        usedPointerEvents = true;
        processMove(ev.clientX, ev.clientY, () => ev.preventDefault());
      };

      const onDocEnd = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        usedPointerEvents = true;
        processEnd(ev.clientX, ev.clientY);
      };

      const onTouchMove = (ev: TouchEvent) => {
        const gesture = speedGestureRef.current;
        if (gesture.active && ev.touches.length >= 1) {
          processMove(ev.touches[0].clientX, ev.touches[0].clientY, () => ev.preventDefault());
          return;
        }
        if (gesture.holdTimer && ev.touches.length >= 1) {
          processMove(ev.touches[0].clientX, ev.touches[0].clientY, () => ev.preventDefault());
          return;
        }
        if (usedPointerEvents) return;
        const touch =
          Array.from(ev.touches).find((t) => t.identifier === pointerId) ??
          (ev.touches.length === 1 ? ev.touches[0] : undefined);
        if (!touch) return;
        processMove(touch.clientX, touch.clientY, () => ev.preventDefault());
      };

      const onTouchEnd = (ev: TouchEvent) => {
        const gesture = speedGestureRef.current;
        if (gesture.active && ev.touches.length === 0) {
          const touch =
            Array.from(ev.changedTouches).find((t) => t.identifier === pointerId) ??
            ev.changedTouches[0];
          if (touch) processEnd(touch.clientX, touch.clientY);
          return;
        }
        if (usedPointerEvents) return;
        const touch =
          Array.from(ev.changedTouches).find((t) => t.identifier === pointerId) ??
          (ev.changedTouches.length === 1 ? ev.changedTouches[0] : undefined);
        if (!touch) return;
        processEnd(touch.clientX, touch.clientY);
      };

      const listenerOpts = { passive: false } as const;
      document.addEventListener('pointermove', onDocMove, listenerOpts);
      document.addEventListener('pointerup', onDocEnd, listenerOpts);
      document.addEventListener('pointercancel', onDocEnd, listenerOpts);
      document.addEventListener('touchmove', onTouchMove, listenerOpts);
      document.addEventListener('touchend', onTouchEnd, listenerOpts);
      document.addEventListener('touchcancel', onTouchEnd, listenerOpts);
      documentGestureCleanupRef.current = () => {
        document.removeEventListener('pointermove', onDocMove);
        document.removeEventListener('pointerup', onDocEnd);
        document.removeEventListener('pointercancel', onDocEnd);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        document.removeEventListener('touchcancel', onTouchEnd);
      };
    },
    [
      activateSpeedGesture,
      cleanupDocumentGesture,
      endSpeedGesture,
      getPointerLocal,
      seekRelative,
      showSeekFeedback,
      updateSpeedFromPointer,
    ],
  );

  const attemptPlay = useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;

    setPlaybackError(null);
    setIsStarting(true);
    setIsBuffering(el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA);

    try {
      await waitUntilCanPlay(el);
      await el.play();
      pendingPlayRef.current = false;
      setIsBuffering(false);
      setIsStarting(false);
    } catch (err) {
      const domError = err as DOMException;
      if (domError?.name === 'AbortError') {
        return;
      }

      pendingPlayRef.current = true;
      setIsBuffering(true);

      const retry = () => {
        if (!pendingPlayRef.current) return;
        void el
          .play()
          .then(() => {
            pendingPlayRef.current = false;
            setIsBuffering(false);
            setIsStarting(false);
          })
          .catch(() => {
            // onCanPlay / onPlaying will retry again.
          });
      };

      el.addEventListener('canplay', retry, { once: true });
      el.addEventListener('canplaythrough', retry, { once: true });
      el.addEventListener('loadeddata', retry, { once: true });
    }
  }, []);

  useLayoutEffect(() => {
    autoplayPendingRef.current = autoPlay || takeVideoAutoplayIntent(video.slug);
  }, [autoPlay, video.slug]);

  useEffect(() => {
    if (!autoplayPendingRef.current || !activeSourceUrl) return;

    autoplayPendingRef.current = false;
    void attemptPlay();
  }, [activeSourceUrl, attemptPlay, video.slug]);

  const resumePlaybackIfNeeded = useCallback(() => {
    const el = videoRef.current;
    if (!el || !resumeAfterFsRef.current) return;
    resumeAfterFsRef.current = false;
    requestAnimationFrame(() => {
      if (!el.paused) {
        setPlaying(true);
        return;
      }
      void el
        .play()
        .then(() => {
          setPlaying(true);
          setIsBuffering(false);
          setIsStarting(false);
        })
        .catch(() => undefined);
    });
  }, []);

  const capturePlaybackForFullscreen = useCallback(() => {
    const el = videoRef.current;
    resumeAfterFsRef.current = el ? !el.paused : playing;
  }, [playing]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void attemptPlay();
    } else {
      el.pause();
    }
  }, [attemptPlay]);

  const exitFullscreenMode = useCallback(async () => {
    const el = videoRef.current as WebKitVideoElement | null;

    cleanupDocumentGesture();
    setGestureActive(false);
    setPseudoFullscreen(false);
    document.body.classList.remove('video-fullscreen', 'video-pseudo-fullscreen');

    if (orientationLockedRef.current) {
      await unlockLandscape();
      orientationLockedRef.current = false;
    }

    try {
      await exitElementFullscreen();
    } catch {
      // ignore
    }

    if (el?.webkitDisplayingFullscreen) {
      try {
        el.webkitExitFullscreen?.();
      } catch {
        // ignore — user can tap Done on iOS
      }
    }

    setIsFullscreen(false);
  }, [cleanupDocumentGesture]);

  const enterPseudoFullscreen = useCallback(() => {
    capturePlaybackForFullscreen();
    setPseudoFullscreen(true);
    setIsFullscreen(true);
    document.body.classList.add('video-fullscreen', 'video-pseudo-fullscreen');

    if (isMobileDevice()) {
      void lockLandscape().then((locked) => {
        orientationLockedRef.current = locked;
        resumePlaybackIfNeeded();
      });
    } else {
      resumePlaybackIfNeeded();
    }
  }, [capturePlaybackForFullscreen, resumePlaybackIfNeeded]);

  /** iOS Safari requires a synchronous call from click — no await before webkitEnterFullscreen */
  const enterIosNativeFullscreen = useCallback(() => {
    const el = videoRef.current as WebKitVideoElement | null;
    if (!el?.webkitEnterFullscreen) return false;

    try {
      capturePlaybackForFullscreen();
      if (el.paused) {
        void el.play().catch(() => undefined);
      }
      el.webkitEnterFullscreen();
      setIsFullscreen(true);
      document.body.classList.add('video-fullscreen');
      return true;
    } catch {
      return false;
    }
  }, [capturePlaybackForFullscreen]);

  const enterFullscreenWithLandscape = useCallback(() => {
    if (isIosDevice()) {
      enterPseudoFullscreen();
      return;
    }

    void (async () => {
      const container = containerRef.current;
      const el = videoRef.current as WebKitVideoElement | null;
      if (!container || !el) return;

      const wasPlaying = !el.paused;
      capturePlaybackForFullscreen();

      try {
        await requestElementFullscreen(container);
        setIsFullscreen(true);
        document.body.classList.add('video-fullscreen');

        if (isMobileDevice()) {
          const locked = await lockLandscape();
          orientationLockedRef.current = locked;
        }

        if (wasPlaying) resumePlaybackIfNeeded();
      } catch {
        if (el.webkitEnterFullscreen && enterIosNativeFullscreen()) return;
        enterPseudoFullscreen();
      }
    })();
  }, [capturePlaybackForFullscreen, enterIosNativeFullscreen, enterPseudoFullscreen, resumePlaybackIfNeeded]);

  const toggleFullscreen = useCallback(async () => {
    const el = videoRef.current as WebKitVideoElement | null;
    const isNativeIosFs = isIosDevice() && !!el?.webkitDisplayingFullscreen;
    const isFs = !!document.fullscreenElement || isNativeIosFs || pseudoFullscreen;

    if (isFs) {
      await exitFullscreenMode();
      return;
    }

    enterFullscreenWithLandscape();
  }, [enterFullscreenWithLandscape, exitFullscreenMode, pseudoFullscreen]);

  const handleFullscreenClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const el = videoRef.current as WebKitVideoElement | null;

      if (el?.webkitDisplayingFullscreen || pseudoFullscreen) {
        void exitFullscreenMode();
        return;
      }

      enterFullscreenWithLandscape();
    },
    [enterFullscreenWithLandscape, exitFullscreenMode, pseudoFullscreen],
  );

  const getTapZone = useCallback(
    (clientX: number, clientY: number): 'left' | 'right' | 'center' => {
      const local = getPointerLocal(clientX, clientY);
      const ratio = local.localX / local.width;
      if (ratio < 0.35) return 'left';
      if (ratio > 0.65) return 'right';
      return 'center';
    },
    [getPointerLocal],
  );

  const handleTap = useCallback(
    (clientX: number, clientY: number) => {
      const zone = getTapZone(clientX, clientY);
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

  useEffect(() => {
    handleTapRef.current = handleTap;
    shouldIgnoreTapRef.current = shouldIgnoreTap;
  }, [handleTap, shouldIgnoreTap]);

  useEffect(() => {
    isFullscreenRef.current = isFullscreen || pseudoFullscreen;
  }, [isFullscreen, pseudoFullscreen]);

  const updateProgressFromPointer = useCallback(
    (clientX: number) => {
      const el = videoRef.current;
      const bar = containerRef.current?.querySelector('[data-progress]') as HTMLElement;
      if (!el || !bar || !el.duration) return;
      const rect = bar.getBoundingClientRect();
      const pad = PROGRESS_PAD;
      const innerWidth = rect.width - pad * 2;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left - pad) / innerWidth));
      el.currentTime = ratio * el.duration;
      setCurrentTime(el.currentTime);
    },
    [],
  );

  const endScrubSession = useCallback(() => {
    if (!isScrubbingRef.current) return;

    const session = scrubSessionRef.current;
    const shouldResume = session.wasPlaying;

    isScrubbingRef.current = false;
    setIsScrubbing(false);
    setGestureActive(false);

    session.docCleanup?.();
    session.docCleanup = null;

    const target = session.target;
    const pointerId = session.pointerId;
    if (target && pointerId >= 0) {
      try {
        if (target.hasPointerCapture(pointerId)) {
          target.releasePointerCapture(pointerId);
        }
      } catch {
        // ignore
      }
    }

    session.target = null;
    session.pointerId = -1;
    session.wasPlaying = false;

    const el = videoRef.current;
    if (el) {
      setCurrentTime(el.currentTime);
      if (shouldResume) {
        void el
          .play()
          .then(() => {
            setPlaying(true);
            setIsBuffering(false);
            setIsStarting(false);
          })
          .catch(() => undefined);
      }
    }

    if (shouldResume) {
      scheduleHideControls();
    }
  }, [scheduleHideControls]);

  const beginScrubSession = useCallback(
    (clientX: number, pointerId: number, target: HTMLElement) => {
      const el = videoRef.current;
      if (!el) return;

      scrubSessionRef.current.wasPlaying = !el.paused;
      scrubSessionRef.current.pointerId = pointerId;
      scrubSessionRef.current.target = target;

      isScrubbingRef.current = true;
      setIsScrubbing(true);
      setGestureActive(true);
      setShowControls(true);
      clearHideTimer();
      updateProgressFromPointer(clientX);

      try {
        target.setPointerCapture(pointerId);
      } catch {
        // ignore
      }

      const onDocEnd = () => {
        endScrubSession();
      };

      document.addEventListener('pointerup', onDocEnd);
      document.addEventListener('pointercancel', onDocEnd);
      scrubSessionRef.current.docCleanup = () => {
        document.removeEventListener('pointerup', onDocEnd);
        document.removeEventListener('pointercancel', onDocEnd);
      };
    },
    [clearHideTimer, endScrubSession, updateProgressFromPointer],
  );

  useEffect(() => {
    return () => {
      endScrubSession();
    };
  }, [endScrubSession]);

  useEffect(() => {
    return () => {
      cleanupDocumentGesture();
      if (overlayRafRef.current !== null) {
        cancelAnimationFrame(overlayRafRef.current);
      }
    };
  }, [cleanupDocumentGesture]);

  const updateFsPortraitChromeInset = useCallback(() => {
    if (!pseudoFullscreen || !isPortrait()) {
      setFsPortraitChromeBottom(0);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const vw = videoRef.current?.videoWidth || video.width || 16;
    const vh = videoRef.current?.videoHeight || video.height || 9;
    if (!vw || !vh) return;

    const scale = Math.min(rect.width / vw, rect.height / vh);
    const displayedHeight = vh * scale;
    const letterbox = Math.max(0, (rect.height - displayedHeight) / 2);
    setFsPortraitChromeBottom(Math.round(letterbox));
  }, [pseudoFullscreen, video.height, video.width]);

  useEffect(() => {
    updateFsPortraitChromeInset();

    window.addEventListener('resize', updateFsPortraitChromeInset);
    window.addEventListener('orientationchange', updateFsPortraitChromeInset);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateFsPortraitChromeInset);
    }

    const el = videoRef.current;
    el?.addEventListener('loadedmetadata', updateFsPortraitChromeInset);

    return () => {
      window.removeEventListener('resize', updateFsPortraitChromeInset);
      window.removeEventListener('orientationchange', updateFsPortraitChromeInset);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateFsPortraitChromeInset);
      }
      el?.removeEventListener('loadedmetadata', updateFsPortraitChromeInset);
    };
  }, [
    activeSourceUrl,
    isFullscreen,
    pseudoFullscreen,
    updateFsPortraitChromeInset,
  ]);

  useEffect(() => {
    if (!pseudoFullscreen) return;
    resumePlaybackIfNeeded();
  }, [pseudoFullscreen, resumePlaybackIfNeeded]);

  useEffect(() => {
    if (!pseudoFullscreen) {
      setShowRotateHint(false);
      return;
    }
    if (isPortrait()) {
      setShowRotateHint(true);
      const timer = setTimeout(() => setShowRotateHint(false), 4000);
      return () => clearTimeout(timer);
    }
    setShowRotateHint(false);
  }, [pseudoFullscreen]);

  useEffect(() => {
    if (!pseudoFullscreen) return;

    const onViewportChange = () => {
      if (!isPortrait()) setShowRotateHint(false);
    };

    window.addEventListener('orientationchange', onViewportChange);
    window.addEventListener('resize', onViewportChange);
    return () => {
      window.removeEventListener('orientationchange', onViewportChange);
      window.removeEventListener('resize', onViewportChange);
    };
  }, [pseudoFullscreen]);

  useEffect(() => {
    if (!zoomEnabled) return;

    let frame = 0;
    const onViewportChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          resetVideoZoom();
          syncZoomContentSize();
          updateFsPortraitChromeInset();
        });
      });
    };

    window.addEventListener('orientationchange', onViewportChange);
    window.visualViewport?.addEventListener('resize', onViewportChange);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('orientationchange', onViewportChange);
      window.visualViewport?.removeEventListener('resize', onViewportChange);
    };
  }, [resetVideoZoom, syncZoomContentSize, updateFsPortraitChromeInset, zoomEnabled]);

  useEffect(() => {
    if (!zoomEnabled) {
      zoomContentSizeRef.current = { width: 0, height: 0 };
      setZoomContentSize({ width: 0, height: 0 });
      return;
    }

    syncZoomContentSize();
    const onLayout = () => syncZoomContentSize();

    window.addEventListener('resize', onLayout);
    window.addEventListener('orientationchange', onLayout);
    window.visualViewport?.addEventListener('resize', onLayout);

    const el = videoRef.current;
    el?.addEventListener('loadedmetadata', onLayout);

    return () => {
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('orientationchange', onLayout);
      window.visualViewport?.removeEventListener('resize', onLayout);
      el?.removeEventListener('loadedmetadata', onLayout);
    };
  }, [activeSourceUrl, isFullscreen, pseudoFullscreen, syncZoomContentSize, zoomEnabled]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.setAttribute('playsinline', 'true');
    el.setAttribute('webkit-playsinline', 'true');
    el.setAttribute('x5-playsinline', 'true');
    if (initialProgress > 0) {
      el.currentTime = initialProgress;
      setCurrentTime(initialProgress);
    }
  }, [activeSourceUrl, initialProgress]);

  useEffect(() => {
    if (!pseudoFullscreen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void exitFullscreenMode();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pseudoFullscreen, exitFullscreenMode]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs || pseudoFullscreen);
      document.body.classList.toggle('video-fullscreen', isFs || pseudoFullscreen);
      if (isFs) {
        resumePlaybackIfNeeded();
        if (isMobileDevice()) {
          void lockLandscape().then((locked) => {
            orientationLockedRef.current = locked;
          });
        }
      } else if (!pseudoFullscreen) {
        if (orientationLockedRef.current) {
          void unlockLandscape();
          orientationLockedRef.current = false;
        }
      }
    };

    const onViewportChange = () => {
      // Trigger layout recalc after physical rotation (iOS Safari)
      if (pseudoFullscreen && containerRef.current) {
        containerRef.current.style.width = '100%';
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('orientationchange', onViewportChange);
    window.addEventListener('resize', onViewportChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onViewportChange);
    }

    const el = videoRef.current as WebKitVideoElement | null;
    const onWebkitBegin = () => {
      setIsFullscreen(true);
      document.body.classList.add('video-fullscreen');
    };
    const onWebkitEnd = () => {
      setIsFullscreen(pseudoFullscreen);
      if (!pseudoFullscreen) {
        document.body.classList.remove('video-fullscreen');
      }
    };
    el?.addEventListener('webkitbeginfullscreen', onWebkitBegin);
    el?.addEventListener('webkitendfullscreen', onWebkitEnd);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('orientationchange', onViewportChange);
      window.removeEventListener('resize', onViewportChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onViewportChange);
      }
      el?.removeEventListener('webkitbeginfullscreen', onWebkitBegin);
      el?.removeEventListener('webkitendfullscreen', onWebkitEnd);
    };
  }, [activeSourceUrl, pseudoFullscreen, resumePlaybackIfNeeded]);

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
    if ((isFullscreen || pseudoFullscreen) && playing && showControls) {
      scheduleHideControls();
    }
  }, [isFullscreen, pseudoFullscreen, playing, showControls, scheduleHideControls]);

  useEffect(() => {
    if (playing && showControls) {
      scheduleHideControls();
    } else {
      clearHideTimer();
    }
  }, [playing, showControls, scheduleHideControls, clearHideTimer]);

  useEffect(() => {
    if (!isFullscreen && !pseudoFullscreen) {
      resetVideoZoom();
    }
  }, [isFullscreen, pseudoFullscreen, resetVideoZoom]);

  useEffect(() => {
    resetVideoZoom();
  }, [activeSourceUrl, resetVideoZoom]);

  useEffect(() => {
    return () => {
      if (zoomHintTimerRef.current) clearTimeout(zoomHintTimerRef.current);
    };
  }, []);

  useEffect(() => {
    pendingPlayRef.current = false;
    setPlaybackError(null);
    setIsBuffering(false);
    setIsStarting(false);
    flushPlaybackRate(SPEED_DEFAULT);
    setShowSpeedOverlay(false);

    if (!activeSourceUrl) return;

    primeVideoStream(activeSourceUrl);

    const el = videoRef.current;
    if (!el) return;

    const srcChanged = el.getAttribute('src') !== activeSourceUrl;
    if (srcChanged) {
      el.src = activeSourceUrl;
    }

    el.preload = 'auto';

    if (srcChanged || el.readyState === HTMLMediaElement.HAVE_NOTHING) {
      el.load();
    }
  }, [activeSourceUrl, flushPlaybackRate]);

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
  const controlsVisible = showControls || !playing;
  const inFullscreen = isFullscreen || pseudoFullscreen;
  const liftChromeInPortraitFs = pseudoFullscreen && fsPortraitChromeBottom > 0;
  const progressBarVisible = controlsVisible || isScrubbing;
  const fsChromeBottomPx = liftChromeInPortraitFs ? fsPortraitChromeBottom : 0;

  const playerMarkup = (
    <div
      ref={containerRef}
      className={cn(
        'group/player relative w-full overflow-hidden bg-black select-none',
        'aspect-video',
        'rounded-none sm:rounded-xl',
        (isFullscreen || pseudoFullscreen) && 'aspect-auto h-full max-h-none rounded-none',
        pseudoFullscreen && 'player-pseudo-fullscreen',
        gestureActive && 'touch-none',
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className={cn(
            'shrink-0 will-change-transform',
            !(inFullscreen && zoomContentSize.width > 0) && 'h-full w-full',
          )}
          style={{
            ...(inFullscreen && zoomContentSize.width > 0
              ? { width: zoomContentSize.width, height: zoomContentSize.height }
              : undefined),
            transform: `translate3d(${videoZoom.x}px, ${videoZoom.y}px, 0) scale(${videoZoom.scale})`,
            transformOrigin: 'center center',
            transition: isPinching ? undefined : 'transform 0.18s ease-out',
          }}
        >
          <video
            ref={videoRef}
            src={activeSourceUrl}
            className={cn(
              'pointer-events-none block h-full w-full',
              inFullscreen
                ? zoomContentSize.width > 0
                  ? undefined
                  : 'object-contain'
                : 'object-cover sm:object-contain',
            )}
            playsInline
            preload="auto"
            poster={posterUrl}
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
              if (isScrubbingRef.current) return;
              if (!videoRef.current?.paused) {
                setIsBuffering(true);
              }
            }}
            onSeeked={() => {
              if (isScrubbingRef.current) return;
              setIsBuffering(false);
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
        </div>
      </div>

      {/* Full-area gesture capture — receives touches in chrome gaps via pointer-events-none on controls */}
      <div
        ref={gestureLayerRef}
        className={cn(
          'absolute inset-0 z-10',
          isFullscreen || pseudoFullscreen ? 'touch-none' : 'touch-manipulation',
        )}
        onTouchStart={handlePinchTouchStart}
        onTouchMove={handlePinchTouchMove}
        onTouchEnd={handlePinchTouchEnd}
        onTouchCancel={handlePinchTouchEnd}
        onPointerDown={handleGesturePointerDown}
        onPointerCancel={() => {
          cleanupDocumentGesture();
          setGestureActive(false);
          endSpeedGesture();
        }}
        onDoubleClick={(e) => {
          if (isMobileDevice()) return;
          e.preventDefault();
          const zone = getTapZone(e.clientX, e.clientY);
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
      />

      {(isStarting || isBuffering) && !playbackError && !isScrubbing && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      )}

      {playbackError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-zinc-200">{playbackError}</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPlaybackError(null);
              void attemptPlay();
            }}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      )}

      {/* Top gradient + badges when controls visible */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-3 pb-6 pt-3 transition-opacity duration-200 sm:px-4',
          controlsVisible ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div className="flex items-center justify-end gap-2">
          {qualityOptions.length > 1 && (
            <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white/90">
              {activeQualityLabel}
            </span>
          )}
        </div>
      </div>

      {seekFeedback && (
        <SeekFeedbackOverlay
          direction={seekFeedback.direction}
          seconds={seekFeedback.seconds}
          animationKey={seekFeedback.animationKey}
        />
      )}

      {showSpeedOverlay && (
        <div className="pointer-events-none absolute inset-x-0 top-10 z-30 flex justify-center">
          <p className="rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white">
            {formatPlaybackRate(playbackRate)}
          </p>
        </div>
      )}

      {showZoomHint && Math.abs(videoZoom.scale - 1) > 0.02 && (
        <div className="pointer-events-none absolute inset-x-0 top-10 z-30 flex justify-center">
          <p className="rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white">
            {formatZoomPercent(videoZoom.scale)}
          </p>
        </div>
      )}

      {showRotateHint && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/30">
          <p className="rounded-lg bg-black/75 px-4 py-2.5 text-center text-sm text-white">
            Rotate your device for the best view
          </p>
        </div>
      )}

      {/* Center play — only when paused and controls hidden */}
      {!playing && !playbackError && !showSpeedOverlay && !controlsVisible && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="absolute left-1/2 top-1/2 z-30 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-white shadow-xl shadow-black/50 active:scale-95 sm:h-20 sm:w-20"
          aria-label="Play"
        >
          <Play className="ml-1 h-8 w-8 fill-current sm:h-10 sm:w-10" />
        </button>
      )}

      {/* Bottom chrome — auto-hides while playing (YouTube-style) */}
      <div
        className={cn(
          'player-fs-chrome pointer-events-none absolute inset-x-0 bottom-0 z-20',
          inFullscreen && isMobileDevice() && !liftChromeInPortraitFs && 'player-fs-chrome-mobile',
        )}
        style={fsChromeBottomPx > 0 ? { bottom: `${fsChromeBottomPx}px` } : undefined}
      >
        <div
          className={cn(
            'transition-opacity duration-200',
            controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 pt-4 pb-0 sm:px-3 sm:pt-5">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={togglePlay}
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-white active:bg-white/15"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={() => seekRelative(-SEEK_SECONDS)}
              className="pointer-events-auto hidden h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10 sm:flex"
              aria-label={`Rewind ${SEEK_SECONDS} seconds`}
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => seekRelative(SEEK_SECONDS)}
              className="pointer-events-auto hidden h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10 sm:flex"
              aria-label={`Forward ${SEEK_SECONDS} seconds`}
            >
              <SkipForward className="h-4 w-4" />
            </button>

            <span className="ml-1 text-[11px] tabular-nums text-white/80 sm:text-xs">
              {formatDuration(currentTime)}
              <span className="text-white/40"> / </span>
              {formatDuration(duration)}
            </span>

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => {
                const el = videoRef.current;
                if (!el) return;
                el.muted = !el.muted;
                setMuted(el.muted);
              }}
              className="pointer-events-auto hidden h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10 sm:flex"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
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
              className="pointer-events-auto hidden h-1 w-16 accent-red-500 sm:block"
              aria-label="Volume"
            />

            {qualityOptions.length > 0 && (
              <div className="pointer-events-auto relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowQualityMenu((v) => !v);
                    setShowControls(true);
                    clearHideTimer();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white active:bg-white/15"
                  aria-label="Quality"
                >
                  <Settings className="h-[18px] w-[18px]" />
                </button>
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 min-w-[130px] overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-900/95 py-1 shadow-2xl backdrop-blur-md">
                    <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Quality
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedQuality('auto');
                        setShowQualityMenu(false);
                        scheduleHideControls();
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs text-white active:bg-white/10"
                    >
                      <span>Auto{qualityOptions[0] ? ` (${qualityOptions[0].label})` : ''}</span>
                      {selectedQuality === 'auto' && <Check className="h-3.5 w-3.5 text-red-400" />}
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
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs text-white active:bg-white/10"
                      >
                        <span>{q.label}{q.isOriginal ? ' · Source' : ''}</span>
                        {selectedQuality === q.label && <Check className="h-3.5 w-3.5 text-red-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleFullscreenClick}
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-white active:bg-white/15"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="h-[18px] w-[18px]" />
              ) : (
                <Maximize className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>
        </div>

        {/* Progress bar */}
        <div
          data-progress
          className={cn(
            'pointer-events-auto relative w-full cursor-pointer touch-none transition-opacity duration-200',
            inFullscreen ? 'h-7' : 'h-3.5',
            progressBarVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          onPointerDown={(e) => {
            e.stopPropagation();
            beginScrubSession(e.clientX, e.pointerId, e.currentTarget);
          }}
          onPointerMove={(e) => {
            if (isScrubbingRef.current) {
              e.preventDefault();
              updateProgressFromPointer(e.clientX);
            }
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            endScrubSession();
          }}
          onPointerCancel={(e) => {
            e.stopPropagation();
            endScrubSession();
          }}
        >
          <div
            className={cn(
              'absolute inset-x-3 bottom-0 overflow-hidden rounded-full bg-white/30 sm:inset-x-4',
              inFullscreen ? 'h-1' : 'h-[2px]',
            )}
          >
            <div
              className="absolute inset-y-0 left-0 bg-white/35"
              style={{ width: `${buffered}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-red-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div
            className={cn(
              'absolute bottom-0 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-red-500 shadow-md transition-opacity',
              progressBarVisible || isScrubbing ? 'opacity-100' : 'opacity-0',
              isScrubbing && 'scale-125',
            )}
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {pseudoFullscreen && (
        <div className="aspect-video w-full bg-black sm:rounded-xl" aria-hidden />
      )}
      {playerMarkup}
    </>
  );
}
