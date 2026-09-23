"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { roundTime } from "../YouTubeLyricsPlayer/time";

export const useYouTubePlayback = (youtubeId: string) => {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const timeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const isReadyRef = useRef(false);
  const hasStartedPlaybackRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const shouldPlayRef = useRef(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const setPlayerRef = useCallback((player: HTMLVideoElement | null) => {
    playerRef.current = player;
  }, []);

  const syncTime = useCallback(() => {
    const player = playerRef.current;
    if (!player || pendingSeekRef.current != null) return;

    const nextTime = Number(player.currentTime.toFixed(3));
    if (!Number.isFinite(nextTime)) return;
    timeRef.current = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const syncDuration = () => {
    const player = playerRef.current;
    if (!player) return;

    const nextDuration = Number.isFinite(player.duration) ? player.duration : 0;
    setDuration(nextDuration);
  };

  const applySeek = useCallback((time: number) => {
    if (!Number.isFinite(time)) return;
    const player = playerRef.current;
    const duration = player?.duration ?? 0;
    const seekTime = Math.max(
      0,
      duration > 0 ? Math.min(time, duration) : time,
    );
    timeRef.current = seekTime;
    setCurrentTime(seekTime);

    if (!player || !isReadyRef.current || !hasStartedPlaybackRef.current) {
      pendingSeekRef.current = seekTime;
      return;
    }

    player.currentTime = seekTime;
  }, []);

  const play = useCallback(() => {
    shouldPlayRef.current = true;
    setShouldPlay(true);
    void playerRef.current?.play?.();
  }, []);

  const pause = useCallback(() => {
    shouldPlayRef.current = false;
    setShouldPlay(false);
    if (hasStartedPlaybackRef.current) {
      void playerRef.current?.pause?.();
    }
  }, []);

  const stopProgressLoop = useCallback(() => {
    if (animationFrameRef.current == null) return;
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }, []);

  const startProgressLoop = useCallback(() => {
    stopProgressLoop();

    const tick = () => {
      syncTime();
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [stopProgressLoop, syncTime]);

  useEffect(() => {
    isReadyRef.current = false;
    hasStartedPlaybackRef.current = false;
    pendingSeekRef.current = null;
    timeRef.current = 0;
    shouldPlayRef.current = false;
    // Reset the UI snapshot together with the external player source.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShouldPlay(false);
    setCurrentTime(0);
    setDuration(0);
    stopProgressLoop();
  }, [stopProgressLoop, youtubeId]);

  const togglePlay = useCallback(() => {
    if (shouldPlayRef.current) pause();
    else play();
  }, [pause, play]);

  const seekAndPlay = useCallback(
    (time: number) => {
      applySeek(time);
      play();
    },
    [applySeek, play],
  );
  const seekAndPause = useCallback(
    (time: number) => {
      pause();
      applySeek(time);
    },
    [applySeek, pause],
  );
  // Editor-only convenience: pause and move in hundredths of a second.
  const seekBy = useCallback(
    (delta: number) => seekAndPause(roundTime(timeRef.current + delta)),
    [seekAndPause],
  );

  useEffect(() => () => stopProgressLoop(), [stopProgressLoop]);

  const playerEvents = {
    onLoadedMetadata: () => {
      isReadyRef.current = true;
      syncDuration();

      if (hasStartedPlaybackRef.current && pendingSeekRef.current != null) {
        const seekTime = pendingSeekRef.current;
        pendingSeekRef.current = null;
        applySeek(seekTime);
        if (!shouldPlayRef.current) void playerRef.current?.pause?.();
      }
    },
    onTimeUpdate: syncTime,
    onSeeked: syncTime,
    onDurationChange: syncDuration,
    onPlaying: () => {
      hasStartedPlaybackRef.current = true;

      if (pendingSeekRef.current != null) {
        const seekTime = pendingSeekRef.current;
        pendingSeekRef.current = null;
        const player = playerRef.current;
        if (player) player.currentTime = seekTime;
        syncTime();
      }

      if (shouldPlayRef.current) startProgressLoop();
      else {
        stopProgressLoop();
        void playerRef.current?.pause?.();
      }
    },
    onPause: () => {
      // A seek may pause briefly; preserve the requested playback in that case.
      if (!playerRef.current?.seeking && pendingSeekRef.current == null) {
        shouldPlayRef.current = false;
        setShouldPlay(false);
      }
      stopProgressLoop();
      syncTime();
    },
    onEnded: () => {
      shouldPlayRef.current = false;
      setShouldPlay(false);
      stopProgressLoop();
    },
  };

  return {
    setPlayerRef,
    currentTime,
    duration,
    shouldPlay,
    seek: applySeek,
    seekAndPlay,
    seekAndPause,
    seekBy,
    play,
    pause,
    togglePlay,
    playerEvents,
  };
};
