import SingleSongDetails from "../_components/SingleSongDetails";

type SingleSongPageProps = {
  params: {
    id: string;
  };
};

export default function SingleSongPage({ params }: SingleSongPageProps) {
  return <SingleSongDetails songId={params.id} />;
}
