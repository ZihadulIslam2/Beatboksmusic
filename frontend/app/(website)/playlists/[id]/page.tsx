import { PlaylistDetails } from "../_components/PlaylistDetails";

type PlaylistPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    name?: string | string[];
  };
};

function formatPlaylistId(id: string) {
  if (/^\d+$/.test(id)) return `My Playlist #${id}`;

  return id
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PlaylistPage({
  params,
  searchParams,
}: PlaylistPageProps) {
  const requestedName = Array.isArray(searchParams?.name)
    ? searchParams.name[0]
    : searchParams?.name;
  const title = requestedName?.trim() || formatPlaylistId(params.id);

  return <PlaylistDetails playlistId={params.id} title={title} />;
}
