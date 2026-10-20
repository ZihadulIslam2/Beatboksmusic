export interface ArtistSong {
  _id: string;
  name: string;
}

export interface Artist {
  _id: string;
  name: string;
  description: string;
  image?: string;
  imageKey?: string;
  coverImage?: string;
  coverImageKey?: string;
  status?: "active" | "inactive" | string;
  createdAt?: string;
  updatedAt?: string;
  songCount?: number;
  songs?: ArtistSong[];
}

export interface ArtistFormValues {
  name: string;
  description: string;
  image?: File;
  coverImage?: File;
}
