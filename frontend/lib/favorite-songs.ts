import type { Song } from "@/app/(website)/playlists/_components/playlist-api";

type FavoriteSongsResponse = {
  success: boolean;
  message: string;
  data?: {
    songs?: Song[];
  };
};

type FavoriteMutationResponse = {
  success: boolean;
  message: string;
};

export function favoriteSongsQueryKey(token?: string) {
  return ["favorite-songs", token || "guest"] as const;
}

export async function getFavoriteSongs(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/favorites/songs`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const result = (await response.json()) as FavoriteSongsResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not load favorite songs");
  }

  return Array.isArray(result.data?.songs) ? result.data.songs : [];
}

async function updateFavoriteSong(
  token: string,
  songId: string,
  method: "POST",
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/favorite/song/${encodeURIComponent(
      songId,
    )}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const result = (await response.json()) as FavoriteMutationResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not update favorite");
  }

  return result;
}

export function addFavoriteSong(token: string, songId: string) {
  return updateFavoriteSong(token, songId, "POST");
}

export function removeFavoriteSong(token: string, songId: string) {
  return updateFavoriteSong(token, songId, "POST");
}
