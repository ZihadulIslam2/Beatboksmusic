export interface NamedRef {
  _id: string;
  name: string;
  image?: string;
  coverImage?: string;
}

export interface Song {
  _id: string;
  name: string;
  artists: NamedRef[];
  albums: NamedRef[];
  genres: NamedRef[];
  tags: NamedRef[];
  audioFile: string;
  coverImage: string;
  duration: number;
  status: "active" | "inactive" | string;
  createdAt: string;
  updatedAt: string;
}

export interface SongFormValues {
  name?: string;
  artistIds: string[];
  albumIds: string[];
  genreIds: string[];
  tagIds: string[];
  audioFile?: File;
  audioFiles?: File[];
  coverImageFile?: File;
  status?: "active" | "inactive";
}

export interface SelectOptions {
  artists: NamedRef[];
  albums: NamedRef[];
  genres: NamedRef[];
  tags: NamedRef[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SongsData {
  songs: Song[];
  paginationInfo?: PaginationInfo;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
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
