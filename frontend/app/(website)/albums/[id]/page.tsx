import AlbumDetailsClient from "../_components/AlbumDetailsClient";

type AlbumPageProps = {
  params: {
    id: string;
  };
};

export default function AlbumPage({ params }: AlbumPageProps) {
  return <AlbumDetailsClient albumId={params.id} />;
}
