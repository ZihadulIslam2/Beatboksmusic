export interface AlbumArtist {
  _id: string;
  name: string;
  description?: string;
  image?: string;
}

export interface Album {
  _id: string;
  name: string;
  artists?: Array<AlbumArtist | string>;
  releaseDate?: string;
  coverImage?: string;
  coverImageKey?: string;
  status?: "active" | "inactive" | string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  songCount?: number;
}

export interface AlbumSong {
  _id: string;
  name: string;
  artists?: AlbumArtist[];
  albums?: Array<{
    _id: string;
    name: string;
    coverImage?: string;
  }>;
  genres?: Array<{ _id: string; name: string }>;
  tags?: Array<{ _id: string; name: string }>;
  audioFile?: string;
  coverImage?: string;
  duration?: number;
  status?: string;
}

export interface AlbumSongsData {
  songs: AlbumSong[];
  paginationInfo?: {
    currentPage: number;
    totalPages: number;
    totalData: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AlbumDetails {
  album: Album;
  songs: AlbumSong[];
  songCount: number;
  artists: AlbumArtist[];
  artistCount: number;
}
