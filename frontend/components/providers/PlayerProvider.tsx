"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserProfile } from "@/lib/use-user-profile";

export type RepeatMode = "off" | "all" | "one";

export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  image: string;
  audioUrl: string;
  duration: number;
  albumId?: string;
};

type PlayQueueOptions = {
  startTrackId?: string;
  shuffle?: boolean;
};

type PlayerContextValue = {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  seedQueue: (tracks: PlayerTrack[], options?: PlayQueueOptions) => void;
  playQueue: (tracks: PlayerTrack[], options?: PlayQueueOptions) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  resetPlayer: () => void;
};

const PlayerContext = React.createContext<PlayerContextValue | null>(null);

async function recordSongPlay(songId: string, token?: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/song/${encodeURIComponent(songId)}/play`,
      {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      },
    );

    if (!response.ok) {
      throw new Error(`Play tracking failed with status ${response.status}`);
    }
  } catch (error) {
    console.error("Unable to record song play", error);
  }
}

function shuffleIndexes(indexes: number[]) {
  const shuffled = [...indexes];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function getQueueState(tracks: PlayerTrack[], options: PlayQueueOptions = {}) {
  const playableTracks = tracks.filter((track) => Boolean(track.audioUrl));
  if (playableTracks.length === 0) return null;

  const indexes = playableTracks.map((_, index) => index);
  const requestedIndex = options.startTrackId
    ? playableTracks.findIndex((track) => track.id === options.startTrackId)
    : -1;
  const startIndex = requestedIndex >= 0 ? requestedIndex : indexes[0];

  if (!options.shuffle) {
    return {
      tracks: playableTracks,
      order: indexes,
      position: startIndex,
      track: playableTracks[startIndex],
    };
  }

  const order =
    requestedIndex >= 0
      ? [
          startIndex,
          ...shuffleIndexes(indexes.filter((index) => index !== startIndex)),
        ]
      : shuffleIndexes(indexes);

  return {
    tracks: playableTracks,
    order,
    position: 0,
    track: playableTracks[order[0]],
  };
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const {
    status,
    token,
    trialExpired,
    isProfileLoading,
  } = useUserProfile();
  const router = useRouter();
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [queue, setQueue] = React.useState<PlayerTrack[]>([]);
  const [order, setOrder] = React.useState<number[]>([]);
  const [queuePosition, setQueuePosition] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolumeState] = React.useState(0.8);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isShuffle, setIsShuffle] = React.useState(false);
  const [repeatMode, setRepeatMode] = React.useState<RepeatMode>("off");

  const currentTrack = queue[order[queuePosition]] ?? null;

  const promptLogin = React.useCallback(() => {
    toast.error("Please sign in to play songs.", {
      id: "play-login-required",
      action: {
        label: "Sign in",
        onClick: () => router.push("/login"),
      },
    });
  }, [router]);

  const promptPremium = React.useCallback(() => {
    toast.error("Your free trial has ended. Please buy a premium plan.", {
      id: "trial-expired",
      action: {
        label: "Explore Premium",
        onClick: () => router.push("/subscription"),
      },
    });
  }, [router]);

  const loadAndPlay = React.useCallback(
    (track: PlayerTrack) => {
      if (status === "loading" || isProfileLoading) return;
      if (!token) {
        promptLogin();
        return;
      }
      if (trialExpired) {
        promptPremium();
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      audio.src = track.audioUrl;
      audio.load();
      setCurrentTime(0);
      setDuration(track.duration || 0);
      setIsPlaying(true);

      void audio
        .play()
        .then(() => recordSongPlay(track.id, token))
        .catch(() => setIsPlaying(false));
    },
    [
      isProfileLoading,
      promptLogin,
      promptPremium,
      status,
      token,
      trialExpired,
    ],
  );

  const playQueue = React.useCallback(
    (tracks: PlayerTrack[], options: PlayQueueOptions = {}) => {
      if (status === "loading" || isProfileLoading) return;
      if (!token) {
        promptLogin();
        return;
      }
      if (trialExpired) {
        promptPremium();
        return;
      }

      const queueState = getQueueState(tracks, options);
      if (!queueState) return;

      setQueue(queueState.tracks);
      setOrder(queueState.order);
      setQueuePosition(queueState.position);
      setIsShuffle(Boolean(options.shuffle));
      loadAndPlay(queueState.track);
    },
    [
      isProfileLoading,
      loadAndPlay,
      promptLogin,
      promptPremium,
      status,
      token,
      trialExpired,
    ],
  );

  const seedQueue = React.useCallback(
    (tracks: PlayerTrack[], options: PlayQueueOptions = {}) => {
      const queueState = getQueueState(tracks, options);
      if (!queueState) return;

      const audio = audioRef.current;
      if (audio) {
        audio.src = queueState.track.audioUrl;
        audio.load();
      }

      setQueue(queueState.tracks);
      setOrder(queueState.order);
      setQueuePosition(queueState.position);
      setCurrentTime(0);
      setDuration(queueState.track.duration || 0);
      setIsPlaying(false);
      setIsShuffle(Boolean(options.shuffle));
    },
    [],
  );

  const togglePlay = React.useCallback(() => {
    if (status === "loading" || isProfileLoading) return;
    if (!token) {
      promptLogin();
      return;
    }
    if (trialExpired) {
      promptPremium();
      return;
    }

    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (audio.paused) {
      const isRestartingEndedTrack =
        audio.ended ||
        (Number.isFinite(audio.duration) &&
          audio.duration > 0 &&
          audio.currentTime >= audio.duration - 0.25);
      setIsPlaying(true);
      void audio
        .play()
        .then(() => {
          if (isRestartingEndedTrack) {
            return recordSongPlay(currentTrack.id, token);
          }
        })
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [
    currentTrack,
    isProfileLoading,
    promptLogin,
    promptPremium,
    status,
    token,
    trialExpired,
  ]);

  const playNext = React.useCallback(() => {
    if (queue.length === 0 || order.length === 0) return;

    const isLastTrack = queuePosition >= order.length - 1;
    if (isLastTrack && repeatMode === "off") {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    let nextOrder = order;
    let nextPosition = isLastTrack ? 0 : queuePosition + 1;

    if (isLastTrack && isShuffle && repeatMode === "all") {
      nextOrder = shuffleIndexes(queue.map((_, index) => index));
      nextPosition = 0;
      setOrder(nextOrder);
    }

    const nextTrack = queue[nextOrder[nextPosition]];
    if (!nextTrack) return;

    setQueuePosition(nextPosition);
    loadAndPlay(nextTrack);
  }, [
    isShuffle,
    loadAndPlay,
    order,
    queue,
    queuePosition,
    repeatMode,
  ]);

  const playPrevious = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio || queue.length === 0 || order.length === 0) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);

      if (!audio.paused && currentTrack) {
        void recordSongPlay(currentTrack.id, token);
      }
      return;
    }

    const previousPosition =
      queuePosition > 0
        ? queuePosition - 1
        : repeatMode === "all"
          ? order.length - 1
          : 0;
    const previousTrack = queue[order[previousPosition]];
    if (!previousTrack) return;

    setQueuePosition(previousPosition);
    loadAndPlay(previousTrack);
  }, [currentTrack, loadAndPlay, order, queue, queuePosition, repeatMode, token]);

  const seek = React.useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextTime = Math.max(0, Math.min(time, audio.duration || time));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const updateVolume = React.useCallback((nextVolume: number) => {
    const normalizedVolume = Math.max(0, Math.min(nextVolume, 1));
    setVolumeState(normalizedVolume);

    if (normalizedVolume > 0) {
      setIsMuted(false);
    }
  }, []);

  const toggleMute = React.useCallback(() => {
    setIsMuted((muted) => !muted);
  }, []);

  const toggleShuffle = React.useCallback(() => {
    if (queue.length === 0 || order.length === 0) return;

    const currentQueueIndex = order[queuePosition];

    if (isShuffle) {
      const naturalOrder = queue.map((_, index) => index);
      setOrder(naturalOrder);
      setQueuePosition(currentQueueIndex);
      setIsShuffle(false);
      return;
    }

    const remainingIndexes = queue
      .map((_, index) => index)
      .filter((index) => index !== currentQueueIndex);
    setOrder([currentQueueIndex, ...shuffleIndexes(remainingIndexes)]);
    setQueuePosition(0);
    setIsShuffle(true);
  }, [isShuffle, order, queue, queuePosition]);

  const cycleRepeat = React.useCallback(() => {
    setRepeatMode((mode) =>
      mode === "off" ? "all" : mode === "all" ? "one" : "off",
    );
  }, []);

  const resetPlayer = React.useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    setQueue([]);
    setOrder([]);
    setQueuePosition(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsShuffle(false);
    setRepeatMode("off");
  }, []);

  const handleEnded = React.useCallback(() => {
    const audio = audioRef.current;

    if (repeatMode === "one" && audio) {
      audio.currentTime = 0;
      setCurrentTime(0);
      void audio
        .play()
        .then(() => {
          if (currentTrack) {
            return recordSongPlay(currentTrack.id, token);
          }
        })
        .catch(() => setIsPlaying(false));
      return;
    }

    playNext();
  }, [currentTrack, playNext, repeatMode, token]);

  React.useEffect(() => {
    if (status !== "unauthenticated" && !trialExpired) return;

    resetPlayer();
  }, [resetPlayer, status, trialExpired]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.muted = isMuted;
  }, [isMuted, volume]);

  const value = React.useMemo<PlayerContextValue>(
    () => ({
      currentTrack,
      queue,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      isShuffle,
      repeatMode,
      seedQueue,
      playQueue,
      togglePlay,
      playNext,
      playPrevious,
      seek,
      setVolume: updateVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      resetPlayer,
    }),
    [
      currentTime,
      currentTrack,
      cycleRepeat,
      duration,
      isMuted,
      isPlaying,
      isShuffle,
      playNext,
      playPrevious,
      playQueue,
      queue,
      repeatMode,
      resetPlayer,
      seedQueue,
      seek,
      toggleMute,
      togglePlay,
      toggleShuffle,
      updateVolume,
      volume,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          if (Number.isFinite(event.currentTarget.duration)) {
            setDuration(event.currentTarget.duration);
          }
        }}
        onEnded={handleEnded}
        onError={() => setIsPlaying(false)}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = React.useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }

  return context;
}
