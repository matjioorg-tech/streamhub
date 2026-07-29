export const VIDEO_ZOOM_MIN = 1;
export const VIDEO_ZOOM_MAX = 4;
export const VIDEO_ZOOM_SNAP = 1.04;

export interface VideoZoomTransform {
  scale: number;
  x: number;
  y: number;
}

export const DEFAULT_VIDEO_ZOOM: VideoZoomTransform = { scale: 1, x: 0, y: 0 };

export interface VideoContentSize {
  width: number;
  height: number;
}

/** Visible video bounds when using object-contain inside a container. */
export function computeContainedVideoSize(
  containerWidth: number,
  containerHeight: number,
  videoWidth: number,
  videoHeight: number,
): VideoContentSize {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { width: 1, height: 1 };
  }
  if (!videoWidth || !videoHeight) {
    return { width: containerWidth, height: containerHeight };
  }

  const fitScale = Math.min(containerWidth / videoWidth, containerHeight / videoHeight);
  return {
    width: videoWidth * fitScale,
    height: videoHeight * fitScale,
  };
}

interface TouchPoint {
  clientX: number;
  clientY: number;
}

export function getTouchDistance(touches: { length: number; 0?: TouchPoint; 1?: TouchPoint }): number {
  if (touches.length < 2 || !touches[0] || !touches[1]) return 0;
  const t0 = touches[0];
  const t1 = touches[1];
  return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
}

export function getTouchCenter(touches: { length: number; 0?: TouchPoint; 1?: TouchPoint }): {
  x: number;
  y: number;
} {
  if (touches.length === 0 || !touches[0]) return { x: 0, y: 0 };
  if (touches.length === 1) {
    return { x: touches[0].clientX, y: touches[0].clientY };
  }
  if (!touches[1]) return { x: touches[0].clientX, y: touches[0].clientY };
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

export function clampPan(
  scale: number,
  x: number,
  y: number,
  width: number,
  height: number,
): Pick<VideoZoomTransform, 'x' | 'y'> {
  if (scale <= 1) return { x: 0, y: 0 };
  const maxX = (width * (scale - 1)) / 2;
  const maxY = (height * (scale - 1)) / 2;
  return {
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y)),
  };
}

/** Zoom from the center of the viewport (stable in letterboxed fullscreen). */
export function applyCenterZoom(
  startScale: number,
  nextScale: number,
  startX: number,
  startY: number,
  containerWidth: number,
  containerHeight: number,
): VideoZoomTransform {
  const scale = Math.max(VIDEO_ZOOM_MIN, Math.min(VIDEO_ZOOM_MAX, nextScale));
  if (scale <= 1) return DEFAULT_VIDEO_ZOOM;

  const ratio = startScale > 0 ? scale / startScale : 1;
  const clamped = clampPan(
    scale,
    startX * ratio,
    startY * ratio,
    containerWidth,
    containerHeight,
  );
  return { scale, ...clamped };
}

/** Zoom toward the pinch focal point (YouTube-style). */
export function applyFocalZoom(
  containerRect: DOMRect,
  startScale: number,
  nextScale: number,
  focalClientX: number,
  focalClientY: number,
  startX: number,
  startY: number,
): VideoZoomTransform {
  const scale = Math.max(VIDEO_ZOOM_MIN, Math.min(VIDEO_ZOOM_MAX, nextScale));
  if (scale <= 1) return DEFAULT_VIDEO_ZOOM;

  const focalX = focalClientX - containerRect.left - containerRect.width / 2;
  const focalY = focalClientY - containerRect.top - containerRect.height / 2;
  const ratio = scale / startScale;
  const x = focalX - (focalX - startX) * ratio;
  const y = focalY - (focalY - startY) * ratio;
  const clamped = clampPan(scale, x, y, containerRect.width, containerRect.height);
  return { scale, ...clamped };
}

export function snapVideoZoom(
  transform: VideoZoomTransform,
  width: number,
  height: number,
): VideoZoomTransform {
  if (transform.scale < VIDEO_ZOOM_SNAP) return DEFAULT_VIDEO_ZOOM;
  if (Math.abs(transform.scale - 1) < 0.06) return DEFAULT_VIDEO_ZOOM;
  const clamped = clampPan(transform.scale, transform.x, transform.y, width, height);
  return { scale: transform.scale, ...clamped };
}

export function formatZoomPercent(scale: number): string {
  return `${Math.round(scale * 100)}%`;
}

export function reclampVideoZoom(
  transform: VideoZoomTransform,
  width: number,
  height: number,
): VideoZoomTransform {
  if (transform.scale <= 1) return DEFAULT_VIDEO_ZOOM;
  const clamped = clampPan(transform.scale, transform.x, transform.y, width, height);
  return { scale: transform.scale, ...clamped };
}

/** Pinch zoom anchored to the video content center. */
export function applyPinchCenterZoom(
  startScale: number,
  nextScale: number,
  startX: number,
  startY: number,
  contentWidth: number,
  contentHeight: number,
): VideoZoomTransform {
  const scale = Math.max(VIDEO_ZOOM_MIN, Math.min(VIDEO_ZOOM_MAX, nextScale));
  if (scale <= 1) return DEFAULT_VIDEO_ZOOM;

  const hasPan = Math.abs(startX) > 0.5 || Math.abs(startY) > 0.5;
  if (!hasPan) {
    return { scale, x: 0, y: 0 };
  }

  const ratio = startScale > 0 ? scale / startScale : 1;
  const clamped = clampPan(
    scale,
    startX * ratio,
    startY * ratio,
    contentWidth,
    contentHeight,
  );
  return { scale, ...clamped };
}
