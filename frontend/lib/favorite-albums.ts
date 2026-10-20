export type FavoriteAlbumArtist = {
  _id: string;
  name: string;
  image?: string;
};

export type FavoriteAlbum = {
  _id: string;
  name: string;
  artists?: FavoriteAlbumArtist[];
  releaseDate?: string | null;
  coverImage?: string;
};

type FavoriteAlbumsResponse = {
  success: boolean;
  message: string;
  data?: {
    albums?: FavoriteAlbum[];
  };
};

export function favoriteAlbumsQueryKey(token?: string) {
  return ["favorite-albums", token || "guest"] as const;
}

export async function getFavoriteAlbums(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/favorites/albums`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const result = (await response.json()) as FavoriteAlbumsResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not load favorite albums");
  }

  return Array.isArray(result.data?.albums) ? result.data.albums : [];
}
