export type AlbumSummary = {
  slug: string;
  title: string;
  artist: string;
  year: number;
  category: string;
  image: string;
};

export const albumCatalog: AlbumSummary[] = [
  {
    slug: "relaxing-piano-collection",
    title: "Relaxing Piano Collection",
    artist: "Ethan",
    year: 2025,
    category: "Piano Collection",
    image: "/albam.png",
  },
  {
    slug: "ocean-breeze",
    title: "Ocean Breeze",
    artist: "Daniel Hart",
    year: 2025,
    category: "Nature Sounds",
    image: "/albam2.png",
  },
  {
    slug: "zen-journey",
    title: "Zen Journey",
    artist: "Daniel Hart",
    year: 2025,
    category: "Meditation",
    image: "/albam.png",
  },
  {
    slug: "sunset-dreams",
    title: "Sunset Dreams",
    artist: "Sophia Lane",
    year: 2025,
    category: "Evening Lounge",
    image: "/albam2.png",
  },
  {
    slug: "midnight-calm",
    title: "Midnight Calm",
    artist: "Michael Stone",
    year: 2025,
    category: "Night Ambience",
    image: "/albam.png",
  },
  {
    slug: "energy-pulse",
    title: "Energy Pulse",
    artist: "Emma Rhodes",
    year: 2025,
    category: "Focus",
    image: "/albam2.png",
  },
  {
    slug: "deep-focus-sessions",
    title: "Deep Focus Sessions",
    artist: "Emma Rhodes",
    year: 2025,
    category: "Focus",
    image: "/albam.png",
  },
  {
    slug: "urban-lounge",
    title: "Urban Lounge",
    artist: "Lars Falck",
    year: 2025,
    category: "Lounge",
    image: "/albam2.png",
  },
  {
    slug: "silent-forest",
    title: "Silent Forest",
    artist: "Daniel Hart",
    year: 2025,
    category: "Nature Sounds",
    image: "/albam.png",
  },
  {
    slug: "golden-horizon",
    title: "Golden Horizon",
    artist: "Sophia Lane",
    year: 2025,
    category: "Ambient",
    image: "/albam2.png",
  },
  {
    slug: "evening-reflections",
    title: "Evening Reflections",
    artist: "Michael Stone",
    year: 2025,
    category: "Ambient",
    image: "/albam.png",
  },
];

export function toAlbumSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getAlbumHref(title: string) {
  return `/albums/${toAlbumSlug(title)}`;
}

export function getAlbumBySlug(slug: string) {
  return albumCatalog.find((album) => album.slug === slug);
}
