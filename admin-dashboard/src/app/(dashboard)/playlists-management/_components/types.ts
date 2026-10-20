export interface OwnerRef {
  _id: string;
  name: string;
  email?: string;
  profileImage?: string;
}

export interface NamedRef {
  _id: string;
  name: string;
  image?: string;
  coverImage?: string;
}

export interface PlaylistSong {
  _id: string;
  name: string;
  artists?: NamedRef[];
  albums?: NamedRef[];
  genres?: NamedRef[];
  tags?: NamedRef[];
  audioFile?: string;
  coverImage?: string;
  duration?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Playlist {
  _id: string;
  name: string;
  owner?: OwnerRef | string;
  ownerType: "admin" | "user" | string;
  songs: Array<string | PlaylistSong>;
  coverImage: string;
  coverImageKey?: string;
  hasCustomCover: boolean;
  status: "active" | "inactive" | string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistFormValues {
  name: string;
  description: string;
  coverImageFile?: File;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  statusCode?: number;
  success?: boolean;
  status?: boolean;
  message?: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PlaylistsData {
  playlists: Playlist[];
  paginationInfo?: PaginationInfo;
}

export interface SongsData {
  songs: PlaylistSong[];
  paginationInfo?: PaginationInfo;
}

export interface PlaylistSongOptions {
  artists: NamedRef[];
  albums: NamedRef[];
}
