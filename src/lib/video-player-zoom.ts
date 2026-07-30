export const VIDEO_ZOOM_MIN = 1;
export const VIDEO_ZOOM_MAX = 4;
/** During active pinch-out, allow slight under-zoom (YouTube rubber-band). */
export const VIDEO_ZOOM_RUBBER_MIN = 0.86;
/** Release below this scale snaps back to fit (1x). */
export const VIDEO_ZOOM_SNAP = 1.08;

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

/** Viewport used for pinch focal point and pan clamping (visible screen area). */
export interface ZoomViewport {
  centerX: number;
  centerY: number;
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

/** Prefer visualViewport size for clamping; use container center for focal (video position). */
export function getZoomViewport(containerRect?: DOMRect): ZoomViewport {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  const viewW =
    vv?.width ??
    containerRect?.width ??
    (typeof window !== 'undefined' ? window.innerWidth : 1);
  const viewH =
    vv?.height ??
    containerRect?.height ??
    (typeof window !== 'undefined' ? window.innerHeight : 1);

  if (containerRect) {
    return {
      centerX: containerRect.left + containerRect.width / 2,
      centerY: containerRect.top + containerRect.height / 2,
      width: Math.max(1, viewW),
      height: Math.max(1, viewH),
    };
  }

  if (vv) {
    return {
      centerX: vv.offsetLeft + vv.width / 2,
      centerY: vv.offsetTop + vv.height / 2,
      width: Math.max(1, vv.width),
      height: Math.max(1, vv.height),
    };
  }

  if (typeof window !== 'undefined') {
    return {
      centerX: window.innerWidth / 2,
      centerY: window.innerHeight / 2,
      width: Math.max(1, window.innerWidth),
      height: Math.max(1, window.innerHeight),
    };
  }

  return { centerX: 0, centerY: 0, width: 1, height: 1 };
}

export function clientToZoomLocal(
  clientX: number,
  clientY: number,
  viewport: ZoomViewport,
): { x: number; y: number } {
  return {
    x: clientX - viewport.centerX,
    y: clientY - viewport.centerY,
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

/** Keep pan inside scaled content bounds so background never shows. */
export function clampPan(
  scale: number,
  x: number,
  y: number,
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): Pick<VideoZoomTransform, 'x' | 'y'> {
  if (scale <= 1) return { x: 0, y: 0 };

  const maxX = Math.max(0, (contentWidth * scale - viewportWidth) / 2);
  const maxY = Math.max(0, (contentHeight * scale - viewportHeight) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y)),
  };
}

/** Zoom one pinch step from the previous transform toward the current focal point. */
export function applyIncrementalFocalZoom(
  prev: VideoZoomTransform,
  nextScale: number,
  focalClientX: number,
  focalClientY: number,
  viewport: ZoomViewport,
  contentWidth: number,
  contentHeight: number,
  options?: { allowRubberBand?: boolean },
): VideoZoomTransform {
  const allowRubberBand = options?.allowRubberBand ?? false;
  const minScale = allowRubberBand ? VIDEO_ZOOM_RUBBER_MIN : VIDEO_ZOOM_MIN;
  const scale = Math.max(minScale, Math.min(VIDEO_ZOOM_MAX, nextScale));

  const { x: focalX, y: focalY } = clientToZoomLocal(focalClientX, focalClientY, viewport);
  const ratio = prev.scale > 0 ? scale / prev.scale : 1;
  let x = focalX - (focalX - prev.x) * ratio;
  let y = focalY - (focalY - prev.y) * ratio;

  if (scale <= 1) {
    if (!allowRubberBand) return DEFAULT_VIDEO_ZOOM;
    // Under-fit: shrink toward center and fade pan (letterbox / grey bars appear).
    const fitWeight = Math.max(0, (scale - VIDEO_ZOOM_RUBBER_MIN) / (1 - VIDEO_ZOOM_RUBBER_MIN));
    x *= fitWeight;
    y *= fitWeight;
    return { scale, x, y };
  }

  const clamped = clampPan(scale, x, y, contentWidth, contentHeight, viewport.width, viewport.height);
  return { scale, ...clamped };
}

/** Zoom toward the pinch focal point (YouTube-style). */
export function applyFocalZoom(
  viewport: ZoomViewport,
  startScale: number,
  nextScale: number,
  focalClientX: number,
  focalClientY: number,
  startX: number,
  startY: number,
  contentWidth: number,
  contentHeight: number,
): VideoZoomTransform {
  const scale = Math.max(VIDEO_ZOOM_MIN, Math.min(VIDEO_ZOOM_MAX, nextScale));
  if (scale <= 1) return DEFAULT_VIDEO_ZOOM;

  const { x: focalX, y: focalY } = clientToZoomLocal(focalClientX, focalClientY, viewport);
  const ratio = startScale > 0 ? scale / startScale : 1;
  const x = focalX - (focalX - startX) * ratio;
  const y = focalY - (focalY - startY) * ratio;
  const clamped = clampPan(scale, x, y, contentWidth, contentHeight, viewport.width, viewport.height);
  return { scale, ...clamped };
}

export function snapVideoZoom(
  transform: VideoZoomTransform,
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): VideoZoomTransform {
  if (transform.scale <= VIDEO_ZOOM_SNAP) return DEFAULT_VIDEO_ZOOM;
  const clamped = clampPan(
    transform.scale,
    transform.x,
    transform.y,
    contentWidth,
    contentHeight,
    viewportWidth,
    viewportHeight,
  );
  return { scale: transform.scale, ...clamped };
}

/** Called on pinch release — snap to fit or clamp pan like YouTube. */
export function finalizePinchZoom(
  transform: VideoZoomTransform,
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): { transform: VideoZoomTransform; snapToFit: boolean } {
  if (transform.scale <= VIDEO_ZOOM_SNAP) {
    return { transform: DEFAULT_VIDEO_ZOOM, snapToFit: true };
  }
  return {
    transform: snapVideoZoom(transform, contentWidth, contentHeight, viewportWidth, viewportHeight),
    snapToFit: false,
  };
}

export function formatZoomPercent(scale: number): string {
  return `${Math.round(scale * 100)}%`;
}

export function reclampVideoZoom(
  transform: VideoZoomTransform,
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): VideoZoomTransform {
  if (transform.scale <= 1) return DEFAULT_VIDEO_ZOOM;
  const clamped = clampPan(
    transform.scale,
    transform.x,
    transform.y,
    contentWidth,
    contentHeight,
    viewportWidth,
    viewportHeight,
  );
  return { scale: transform.scale, ...clamped };
}

/** Double-tap toggles between 1x fit and 2x centered on the tap location. */
export function toggleDoubleTapZoom(
  current: VideoZoomTransform,
  tapClientX: number,
  tapClientY: number,
  viewport: ZoomViewport,
  contentWidth: number,
  contentHeight: number,
  targetScale = 2,
): VideoZoomTransform {
  if (current.scale > 1.05) return DEFAULT_VIDEO_ZOOM;
  return applyFocalZoom(
    viewport,
    1,
    targetScale,
    tapClientX,
    tapClientY,
    0,
    0,
    contentWidth,
    contentHeight,
  );
}

/** @deprecated Use applyFocalZoom — kept for compatibility. */
export function applyPinchCenterZoom(
  startScale: number,
  nextScale: number,
  startX: number,
  startY: number,
  contentWidth: number,
  contentHeight: number,
  focalClientX?: number,
  focalClientY?: number,
  containerRect?: DOMRect,
): VideoZoomTransform {
  const viewport = getZoomViewport(containerRect);
  if (focalClientX != null && focalClientY != null) {
    return applyFocalZoom(
      viewport,
      startScale,
      nextScale,
      focalClientX,
      focalClientY,
      startX,
      startY,
      contentWidth,
      contentHeight,
    );
  }
  const scale = Math.max(VIDEO_ZOOM_MIN, Math.min(VIDEO_ZOOM_MAX, nextScale));
  if (scale <= 1) return DEFAULT_VIDEO_ZOOM;
  const ratio = startScale > 0 ? scale / startScale : 1;
  const clamped = clampPan(
    scale,
    startX * ratio,
    startY * ratio,
    contentWidth,
    contentHeight,
    viewport.width,
    viewport.height,
  );
  return { scale, ...clamped };
}

/** @deprecated Use applyFocalZoom */
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
    containerWidth,
    containerHeight,
  );
  return { scale, ...clamped };
}
