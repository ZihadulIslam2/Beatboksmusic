import MusicCard, { type MusicCardProps } from "@/components/common/MusicCard";

export type AlbumCardProps = Omit<MusicCardProps, "type"> & {
  albumType?: string;
};

export function AlbumCard({ albumType = "Album", ...props }: AlbumCardProps) {
  return <MusicCard {...props} type={albumType} />;
}

export default AlbumCard;
