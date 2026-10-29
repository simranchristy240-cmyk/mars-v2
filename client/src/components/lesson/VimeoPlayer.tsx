import React, { useEffect, useRef, useState, useCallback } from 'react';
import Player from '@vimeo/player';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  CheckCircle2,
  Gauge,
} from 'lucide-react';

interface VimeoPlayerProps {
  vimeoVideoId: string;
  startTime?: number; // seconds
  endTime?: number;   // seconds
  title?: string;
  onEnded?: () => void;
  onTimeUpdate?: (seconds: number) => void;
}

export const formatTime = (seconds: number = 0): string => {
  const clamped = Math.max(0, Math.floor(seconds));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  if (h > 0) {
    return `${h}h ${m < 10 ? '0' : ''}${m}m ${s < 10 ? '0' : ''}${s}s`;
  }
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
};

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export const VimeoPlayer: React.FC<VimeoPlayerProps> = ({
  vimeoVideoId,
  startTime = 0,
  endTime,
  title = 'Anatomy Lesson Video',
  onEnded,
  onTimeUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const seekBarRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Core player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime || 0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isClipFinished, setIsClipFinished] = useState(false);

  // Audio / volume
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Speed & fullscreen
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Controls visibility & scrubber states
  const [showControls, setShowControls] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverSeekPct, setHoverSeekPct] = useState<number | null>(null);
  const [hoverClientX, setHoverClientX] = useState<number>(0);

  const effectiveId = vimeoVideoId || '76979871';
  const embedUrl = `https://player.vimeo.com/video/${effectiveId}?controls=0&badge=0&autopause=0&player_id=0&app_id=58479#t=${startTime || 0}s`;

  // Segment duration calculation
  const effectiveStartTime = Math.max(0, startTime || 0);
  const effectiveEndTime = endTime && endTime > effectiveStartTime
    ? endTime
    : totalDuration > effectiveStartTime
      ? totalDuration
      : effectiveStartTime + 300;
  const clipDuration = Math.max(1, effectiveEndTime - effectiveStartTime);

  // Current progress relative to section segment
  const currentClipSeconds = Math.max(0, Math.min(clipDuration, currentTime - effectiveStartTime));
  const progressPercent = Math.min(100, Math.max(0, (currentClipSeconds / clipDuration) * 100));

  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;

  // Auto-hide controls timer
  const scheduleControlsHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying && !isScrubbing) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 2400);
    }
  }, [isPlaying, isScrubbing]);

  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  // Handle replaying this section clip
  const handleReplay = useCallback(() => {
    setIsClipFinished(false);
    setCurrentTime(effectiveStartTime);
    if (playerRef.current) {
      playerRef.current.setCurrentTime(effectiveStartTime).then(() => {
        playerRef.current?.play().catch(() => {});
      }).catch(() => {});
    }
  }, [effectiveStartTime]);

  // Play / Pause toggle
  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    if (isClipFinished) {
      handleReplay();
      return;
    }
    if (isPlaying) {
      playerRef.current.pause().catch(() => {});
    } else {
      playerRef.current.play().catch(() => {});
    }
  }, [isPlaying, isClipFinished, handleReplay]);

  // Rewind 10 seconds
  const handleRewind10 = useCallback(() => {
    if (!playerRef.current) return;
    const target = Math.max(effectiveStartTime, currentTime - 10);
    setCurrentTime(target);
    playerRef.current.setCurrentTime(target).catch(() => {});
    if (isClipFinished) setIsClipFinished(false);
    handleUserActivity();
  }, [effectiveStartTime, currentTime, isClipFinished, handleUserActivity]);

  // Forward 10 seconds
  const handleForward10 = useCallback(() => {
    if (!playerRef.current) return;
    const target = Math.min(effectiveEndTime, currentTime + 10);
    if (target >= effectiveEndTime) {
      playerRef.current.setCurrentTime(effectiveEndTime).catch(() => {});
      playerRef.current.pause().catch(() => {});
      setIsPlaying(false);
      setIsClipFinished(true);
      setShowControls(true);
      onEndedRef.current?.();
    } else {
      setCurrentTime(target);
      playerRef.current.setCurrentTime(target).catch(() => {});
    }
    handleUserActivity();
  }, [effectiveEndTime, currentTime, handleUserActivity]);

  // Volume & Mute
  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    playerRef.current.setMuted(nextMuted).catch(() => {});
    handleUserActivity();
  }, [isMuted, handleUserActivity]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const shouldMute = val === 0;
    setIsMuted(shouldMute);
    if (playerRef.current) {
      playerRef.current.setVolume(val).catch(() => {});
      playerRef.current.setMuted(shouldMute).catch(() => {});
    }
    handleUserActivity();
  }, [handleUserActivity]);

  // Playback rate
  const handleSpeedSelect = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(speed).catch(() => {});
    }
    handleUserActivity();
  }, [handleUserActivity]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const targetEl = containerRef.current;
    if (!targetEl) return;

    if (!document.fullscreenElement) {
      targetEl.requestFullscreen?.().catch(() => {
        playerRef.current?.requestFullscreen().catch(() => {});
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
    handleUserActivity();
  }, [handleUserActivity]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Scrubber calculation
  const calculateSeekTime = useCallback((clientX: number) => {
    if (!seekBarRef.current) return effectiveStartTime;
    const rect = seekBarRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const pct = clickX / rect.width;
    return effectiveStartTime + pct * clipDuration;
  }, [effectiveStartTime, clipDuration]);

  // Scrubber drag / click
  const handleSeekPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsScrubbing(true);
    setShowControls(true);

    const targetTime = calculateSeekTime(e.clientX);
    setCurrentTime(targetTime);
    if (playerRef.current) {
      playerRef.current.setCurrentTime(targetTime).catch(() => {});
    }

    const onPointerMove = (moveEv: PointerEvent) => {
      const newTarget = calculateSeekTime(moveEv.clientX);
      setCurrentTime(newTarget);
      if (playerRef.current) {
        playerRef.current.setCurrentTime(newTarget).catch(() => {});
      }
    };

    const onPointerUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleSeekMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setHoverSeekPct(clickX / rect.width);
    setHoverClientX(clickX);
  };

  const handleSeekMouseLeave = () => {
    setHoverSeekPct(null);
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.key === 'ArrowLeft' || e.key === 'j') {
      e.preventDefault();
      handleRewind10();
    } else if (e.key === 'ArrowRight' || e.key === 'l') {
      e.preventDefault();
      handleForward10();
    } else if (e.key === 'm') {
      e.preventDefault();
      toggleMute();
    } else if (e.key === 'f') {
      e.preventDefault();
      toggleFullscreen();
    }
  };

  // Setup Vimeo Player & Event Listeners
  useEffect(() => {
    setIsClipFinished(false);
    setCurrentTime(effectiveStartTime);
    const iframe = iframeRef.current;
    if (!iframe) return;

    let isCancelled = false;
    let player: Player | null = null;

    try {
      player = new Player(iframe);
      playerRef.current = player;

      player.ready().then(() => {
        if (isCancelled || !player) return;
        player.getDuration().then((dur) => {
          if (!isCancelled && dur) setTotalDuration(dur);
        }).catch(() => {});

        if (effectiveStartTime > 0) {
          player.setCurrentTime(effectiveStartTime).catch(() => {});
        }
      }).catch(() => {});

      const onPlayListener = () => {
        if (isCancelled) return;
        setIsPlaying(true);
        setIsClipFinished(false);
      };

      const onPauseListener = () => {
        if (isCancelled) return;
        setIsPlaying(false);
        setShowControls(true);
      };

      const onTimeUpdateHandler = (data: { seconds: number; duration: number }) => {
        if (isCancelled || isScrubbing) return;
        const s = data.seconds;
        setCurrentTime(s);
        if (data.duration && data.duration !== totalDuration) {
          setTotalDuration(data.duration);
        }
        onTimeUpdateRef.current?.(s);

        // Clip boundary enforcement
        if (endTime && endTime > effectiveStartTime && s >= endTime) {
          player?.pause().catch(() => {});
          setIsPlaying(false);
          setIsClipFinished(true);
          setShowControls(true);
          onEndedRef.current?.();
        }
      };

      const onSeekedHandler = (data: { seconds: number }) => {
        if (isCancelled) return;
        const s = data.seconds;
        setCurrentTime(s);
        if (effectiveStartTime > 0 && s < effectiveStartTime - 0.5) {
          player?.setCurrentTime(effectiveStartTime).catch(() => {});
        } else if (endTime && endTime > effectiveStartTime && s >= endTime) {
          player?.setCurrentTime(endTime).catch(() => {});
          player?.pause().catch(() => {});
          setIsPlaying(false);
          setIsClipFinished(true);
          setShowControls(true);
          onEndedRef.current?.();
        }
      };

      player.on('play', onPlayListener);
      player.on('pause', onPauseListener);
      player.on('timeupdate', onTimeUpdateHandler);
      player.on('seeked', onSeekedHandler);

      return () => {
        isCancelled = true;
        if (player) {
          player.off('play', onPlayListener);
          player.off('pause', onPauseListener);
          player.off('timeupdate', onTimeUpdateHandler);
          player.off('seeked', onSeekedHandler);
        }
      };
    } catch {
      return () => {
        isCancelled = true;
      };
    }
  }, [effectiveId, effectiveStartTime, endTime, isScrubbing, totalDuration]);

  return (
    <div
      ref={containerRef}
      className={`les-custom-player ${showControls || !isPlaying ? 'controls-visible' : 'controls-hidden'} ${isFullscreen ? 'is-fullscreen' : ''}`}
      onMouseMove={handleUserActivity}
      onMouseLeave={() => {
        if (isPlaying && !isScrubbing) {
          setShowControls(false);
          setShowSpeedMenu(false);
        }
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={`${title} Video Player`}
    >
      <div className="les-vimeo-container">
        <iframe
          ref={iframeRef}
          key={`${effectiveId}-${effectiveStartTime}`}
          src={embedUrl}
          allow="autoplay; fullscreen; picture-in-picture"
          title={title}
        />
      </div>

      {/* Transparent Click Layer for toggling Play/Pause directly on video frame */}
      <div
        className="les-video-click-catcher"
        onClick={togglePlayPause}
        aria-label={isPlaying ? 'Pause video' : 'Play video'}
      />

      {/* Center Big Play Button (when paused and not finished) */}
      {!isPlaying && !isClipFinished && (
        <button
          type="button"
          className="les-center-play-btn"
          onClick={togglePlayPause}
          title="Play video"
          aria-label="Play video"
        >
          <Play size={32} className="les-center-play-icon" />
        </button>
      )}

      {/* ─── CUSTOM MARS CONTROLS OVERLAY ─── */}
      <div className={`les-custom-controls ${showControls || !isPlaying || isScrubbing ? 'is-active' : ''}`}>
        {/* Custom Seek Bar */}
        <div
          ref={seekBarRef}
          className="les-seekbar-container"
          onPointerDown={handleSeekPointerDown}
          onMouseMove={handleSeekMouseMove}
          onMouseLeave={handleSeekMouseLeave}
          title={`Seek: ${formatTime(currentClipSeconds)} of ${formatTime(clipDuration)}`}
        >
          <div className="les-seekbar-track">
            {/* Filled Progress */}
            <div
              className="les-seekbar-fill"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Hover ghost preview line */}
            {hoverSeekPct !== null && (
              <div
                className="les-seekbar-hover-fill"
                style={{ width: `${hoverSeekPct * 100}%` }}
              />
            )}

            {/* Scrub handle / thumb */}
            <div
              className={`les-seekbar-thumb ${isScrubbing ? 'is-dragging' : ''}`}
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          {/* Hover timestamp tooltip */}
          {hoverSeekPct !== null && (
            <div
              className="les-seekbar-tooltip"
              style={{ left: `${hoverClientX}px` }}
            >
              {formatTime(hoverSeekPct * clipDuration)}
            </div>
          )}
        </div>

        {/* Controls Toolbar Row */}
        <div className="les-controls-row">
          {/* Left Controls: Play/Pause, Rewind, Forward, Time */}
          <div className="les-controls-left">
            <button
              type="button"
              className="les-ctrl-btn les-play-btn"
              onClick={togglePlayPause}
              title={isPlaying ? 'Pause (k or Space)' : 'Play (k or Space)'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              type="button"
              className="les-ctrl-btn les-skip-btn"
              onClick={handleRewind10}
              title="Rewind 10 seconds (j or Left Arrow)"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw size={16} />
              <span className="les-skip-label">10</span>
            </button>

            <button
              type="button"
              className="les-ctrl-btn les-skip-btn"
              onClick={handleForward10}
              title="Forward 10 seconds (l or Right Arrow)"
              aria-label="Forward 10 seconds"
            >
              <RotateCw size={16} />
              <span className="les-skip-label">10</span>
            </button>

            {/* Segment time counter (e.g. 1:42 / 5:00) */}
            <div className="les-ctrl-time">
              <span className="les-time-current">{formatTime(currentClipSeconds)}</span>
              <span className="les-time-divider">/</span>
              <span className="les-time-total">{formatTime(clipDuration)}</span>
            </div>
          </div>

          {/* Right Controls: Volume, Speed, Fullscreen */}
          <div className="les-controls-right">
            {/* Volume group with hover slider */}
            <div className="les-volume-group">
              <button
                type="button"
                className="les-ctrl-btn les-vol-btn"
                onClick={toggleMute}
                title={isMuted || volume === 0 ? 'Unmute (m)' : 'Mute (m)'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : volume < 0.5 ? (
                  <Volume1 size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
              <div className="les-vol-slider-wrap">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="les-vol-slider"
                  aria-label="Volume slider"
                />
              </div>
            </div>

            {/* Playback Speed selector */}
            <div className="les-speed-wrapper">
              <button
                type="button"
                className="les-ctrl-btn les-speed-btn"
                onClick={() => setShowSpeedMenu((prev) => !prev)}
                title="Playback speed"
                aria-label="Playback speed"
              >
                <Gauge size={15} />
                <span className="les-speed-text">{playbackSpeed}x</span>
              </button>

              {showSpeedMenu && (
                <div className="les-speed-menu">
                  {PLAYBACK_SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`les-speed-option ${playbackSpeed === s ? 'is-active' : ''}`}
                      onClick={() => handleSpeedSelect(s)}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              className="les-ctrl-btn les-fullscreen-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen (f)' : 'Fullscreen (f)'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
            </button>
          </div>
        </div>
      </div>

      {/* Clip Finished Overlay with Replay */}
      {isClipFinished && (
        <div className="les-clip-finished-overlay">
          <div className="les-clip-finished-card">
            <span className="ui-icon-box is-success" style={{ width: 44, height: 44, borderRadius: '50%' }}>
              <CheckCircle2 size={24} style={{ color: 'var(--success, #16a34a)' }} />
            </span>
            <div className="les-clip-finished-info">
              <h4 className="les-clip-finished-title">Section Video Completed</h4>
              <p className="les-clip-finished-desc">
                Finished section clip ({formatTime(effectiveStartTime)} – {formatTime(effectiveEndTime)})
              </p>
            </div>
            <button
              type="button"
              className="ui-btn is-outline is-sm les-clip-replay-btn"
              onClick={handleReplay}
              title="Replay this section's clip"
            >
              <RotateCcw size={13} /> Replay section
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
