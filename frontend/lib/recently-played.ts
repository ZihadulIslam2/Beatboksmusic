import type { Song } from "@/app/(website)/playlists/_components/playlist-api";

type RecentlyPlayedResponse = {
  success: boolean;
  message: string;
  data?: {
    songs?: Song[];
  };
};

export function recentlyPlayedQueryKey(token?: string) {
  return ["recently-played", token || "guest"] as const;
}

export async function getRecentlyPlayedSongs(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/recently-played`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const result = (await response.json()) as RecentlyPlayedResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not load recently played songs");
  }

  return Array.isArray(result.data?.songs) ? result.data.songs : [];
}
