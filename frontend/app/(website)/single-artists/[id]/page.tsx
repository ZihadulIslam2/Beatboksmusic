import ArtistDetailsClient from "../_components/ArtistDetailsClient";

type ArtistPageProps = {
  params: {
    id: string;
  };
};

export default function ArtistPage({ params }: ArtistPageProps) {
  return <ArtistDetailsClient artistId={params.id} />;
}
