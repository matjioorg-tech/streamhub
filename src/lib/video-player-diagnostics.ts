/**
 * Video load timeline diagnostics.
 * Enable: ?videoDebug=1  OR  localStorage.setItem('videoDebug', '1')
 */

export type VideoDiagStage =
  | 'watch_page_mount'
  | 'video_data_ready'
  | 'player_render'
  | 'active_source_resolved'
  | 'warm_stream_start'
  | 'src_assigned'
  | 'load_called'
  | 'play_called'
  | 'play_promise_resolved'
  | 'play_promise_rejected'
  | 'media_loadstart'
  | 'media_loadedmetadata'
  | 'media_loadeddata'
  | 'media_canplay'
  | 'media_canplaythrough'
  | 'media_playing'
  | 'media_waiting'
  | 'media_stalled'
  | 'media_suspend'
  | 'media_progress'
  | 'media_error'
  | 'media_abort'
  | 'media_emptied'
  | 'media_ratechange'
  | 'same_stream_skip'
  | 'stream_key_change';

export interface VideoDiagMark {
  stage: VideoDiagStage | string;
  ms: number;
  detail?: Record<string, unknown>;
}

const SESSIONS = new Map<string, VideoLoadDiagnostics>();

export function isVideoDiagnosticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_VIDEO_DEBUG === '1') return true;
  try {
    if (localStorage.getItem('videoDebug') === '1') return true;
    return new URLSearchParams(window.location.search).has('videoDebug');
  } catch {
    return false;
  }
}

function readyStateLabel(state: number): string {
  const labels = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'];
  return labels[state] ?? `readyState(${state})`;
}

function networkStateLabel(state: number): string {
  const labels = ['NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_NO_SOURCE'];
  return labels[state] ?? `networkState(${state})`;
}

export class VideoLoadDiagnostics {
  readonly slug: string;
  readonly origin: string;
  private readonly t0: number;
  private marks: VideoDiagMark[] = [];
  private reported = false;

  constructor(slug: string, origin = 'player') {
    this.slug = slug;
    this.origin = origin;
    this.t0 = performance.now();
    SESSIONS.set(`${origin}:${slug}`, this);
  }

  static getSession(slug: string, origin = 'player'): VideoLoadDiagnostics | undefined {
    return SESSIONS.get(`${origin}:${slug}`);
  }

  mark(stage: VideoDiagStage | string, detail?: Record<string, unknown>): void {
    if (!isVideoDiagnosticsEnabled()) return;
    const ms = Math.round((performance.now() - this.t0) * 10) / 10;
    this.marks.push({ stage, ms, detail });
    console.debug(
      `[VideoDiag:${this.origin}] +${ms.toFixed(1)}ms ${stage}`,
      detail ?? '',
    );
  }

  mediaSnapshot(el: HTMLVideoElement): Record<string, unknown> {
    return {
      readyState: readyStateLabel(el.readyState),
      networkState: networkStateLabel(el.networkState),
      paused: el.paused,
      muted: el.muted,
      currentTime: el.currentTime,
      duration: el.duration,
      bufferedEnd:
        el.buffered.length > 0 ? Math.round(el.buffered.end(el.buffered.length - 1) * 100) / 100 : 0,
      preload: el.preload,
      playsInline: el.playsInline,
      videoWidth: el.videoWidth,
      videoHeight: el.videoHeight,
    };
  }

  attachMediaElement(el: HTMLVideoElement): () => void {
    if (!isVideoDiagnosticsEnabled()) return () => undefined;

    const on = (stage: VideoDiagStage, extra?: Record<string, unknown>) => {
      this.mark(stage, { ...this.mediaSnapshot(el), ...extra });
    };

    const handlers: Array<[string, EventListener]> = [
      ['loadstart', () => on('media_loadstart')],
      ['loadedmetadata', () => on('media_loadedmetadata')],
      ['loadeddata', () => on('media_loadeddata')],
      ['canplay', () => on('media_canplay')],
      ['canplaythrough', () => on('media_canplaythrough')],
      ['playing', () => {
        on('media_playing');
        this.report();
      }],
      ['waiting', () => on('media_waiting')],
      ['stalled', () => on('media_stalled')],
      ['suspend', () => on('media_suspend')],
      ['progress', () => on('media_progress')],
      ['emptied', () => on('media_emptied')],
      ['abort', () => on('media_abort')],
      [
        'error',
        () => {
          const err = el.error;
          on('media_error', {
            code: err?.code,
            message: err?.message,
          });
          this.report();
        },
      ],
    ];

    for (const [event, handler] of handlers) {
      el.addEventListener(event, handler);
    }

    return () => {
      for (const [event, handler] of handlers) {
        el.removeEventListener(event, handler);
      }
    };
  }

  report(): void {
    if (!isVideoDiagnosticsEnabled() || this.reported) return;
    this.reported = true;

    const firstFrame = this.marks.find((m) => m.stage === 'media_playing');
    const metadata = this.marks.find((m) => m.stage === 'media_loadedmetadata');
    const srcAssigned = this.marks.find((m) => m.stage === 'src_assigned');
    const loadStart = this.marks.find((m) => m.stage === 'media_loadstart');

    const summary = {
      slug: this.slug,
      origin: this.origin,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      isSafari:
        typeof navigator !== 'undefined' &&
        /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
        !/CriOS|FxiOS/i.test(navigator.userAgent),
      totalMs: this.marks.length ? this.marks[this.marks.length - 1].ms : 0,
      timeToSrcMs: srcAssigned?.ms ?? null,
      timeToLoadStartMs: loadStart?.ms ?? null,
      timeToMetadataMs: metadata?.ms ?? null,
      timeToFirstFrameMs: firstFrame?.ms ?? null,
      gapSrcToLoadStartMs:
        srcAssigned && loadStart ? Math.round((loadStart.ms - srcAssigned.ms) * 10) / 10 : null,
      gapMetadataToPlayingMs:
        metadata && firstFrame ? Math.round((firstFrame.ms - metadata.ms) * 10) / 10 : null,
    };

    console.group(`[VideoDiag] REPORT ${this.origin} — ${this.slug}`);
    console.table(this.marks.map((m) => ({ ms: m.ms, stage: m.stage, ...m.detail })));
    console.log('Summary:', summary);
    console.groupEnd();

    if (typeof window !== 'undefined') {
      (window as Window & { __videoDiag?: unknown }).__videoDiag = {
        summary,
        marks: this.marks,
      };
    }
  }
}

export function markWatchPage(slug: string, stage: VideoDiagStage, detail?: Record<string, unknown>): void {
  if (!isVideoDiagnosticsEnabled()) return;
  let session = VideoLoadDiagnostics.getSession(slug, 'watch');
  if (!session) {
    session = new VideoLoadDiagnostics(slug, 'watch');
    session.mark('watch_page_mount');
  }
  session.mark(stage, detail);
}
