export type SearchType = "all" | "songs" | "artists" | "playlists" | "albums";

export type SearchTag = {
  _id: string;
  name: string;
  status?: string;
};

export type SearchSong = {
  _id: string;
  name: string;
  artists?: Array<{
    _id: string;
    name: string;
    image?: string;
  }>;
  albums?: Array<{
    _id: string;
    name: string;
    coverImage?: string;
  }>;
  genres?: Array<{
    _id: string;
    name: string;
  }>;
  tags?: Array<{
    _id: string;
    name: string;
  }>;
  coverImage?: string;
  duration?: number;
  playCount?: number;
};

export type SearchArtist = {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  songCount?: number;
  albumCount?: number;
};

export type SearchAlbum = {
  _id: string;
  name: string;
  coverImage?: string;
  artists?: SearchArtist[];
  songCount?: number;
  releaseDate?: string;
};

export type SearchPlaylist = {
  _id: string;
  name: string;
  songs?: string[];
  coverImage?: string;
};

export type SearchResults = {
  query?: string;
  songs?: SearchSong[];
  artists?: SearchArtist[];
  albums?: SearchAlbum[];
  playlists?: SearchPlaylist[];
  matchedTags?: string[];
  total?: number;
  page?: number;
  limit?: number;
  paginationInfo?: {
    currentPage: number;
    totalPages: number;
    totalData: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  counts?: {
    songs?: number;
    artists?: number;
    albums?: number;
    playlists?: number;
    total?: number;
  };
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type TagsData = {
  tags?: SearchTag[];
};

type SearchParams = {
  query?: string | null;
  type?: SearchType;
  tags?: Array<string | null | undefined>;
  page?: number;
  limit?: number;
};

function normalizeText(value: string | null | undefined) {
  return value ?? "";
}

function getBackendUrl(path: string, params?: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  const queryString = searchParams.toString();

  return `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}${
    queryString ? `?${queryString}` : ""
  }`;
}

export async function getTags(): Promise<SearchTag[]> {
  const response = await fetch(getBackendUrl("/tag", { limit: "100" }));
  const result = (await response.json()) as ApiResponse<TagsData>;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not load tags");
  }

  return Array.isArray(result.data?.tags) ? result.data.tags : [];
}

export async function searchMusic({
  query = "",
  type = "all",
  tags = [],
  page,
  limit,
}: SearchParams): Promise<SearchResults> {
  const trimmedQuery = normalizeText(query).trim();
  const cleanTags = tags.filter((tag): tag is string => Boolean(tag));
  let path = "/search";
  const params: Record<string, string> = {};

  if (page) params.page = String(page);
  if (limit) params.limit = String(limit);

  if (cleanTags.length > 0) {
    path = "/search/tags";
    params.tags = cleanTags.join(",");
  } else {
    if (type !== "all") path = `/search/${type}`;
    if (trimmedQuery) params.q = trimmedQuery;
  }

  const response = await fetch(getBackendUrl(path, params));
  const result = (await response.json()) as ApiResponse<SearchResults>;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not load search results");
  }

  return result.data ?? {};
}

export function buildSearchHref({
  query = "",
  type = "all",
  tags = [],
}: SearchParams) {
  const params = new URLSearchParams();
  const trimmedQuery = normalizeText(query).trim();
  const cleanTags = tags.filter((tag): tag is string => Boolean(tag));

  if (cleanTags.length > 0) {
    if (trimmedQuery) params.set("q", trimmedQuery);
    params.set("type", "tags");
    params.set("tags", cleanTags.join(","));
  } else {
    if (trimmedQuery) params.set("q", trimmedQuery);
    if (type !== "all") params.set("type", type);
  }

  const queryString = params.toString();

  return `/search${queryString ? `?${queryString}` : ""}`;
}
