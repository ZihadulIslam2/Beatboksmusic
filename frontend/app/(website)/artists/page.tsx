import ArtistsList from "./_components/ArtistsList";

export default function ArtistsPage() {
  return (
    <section className="rounded-2xl bg-[#FFFFFF1A] p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-semibold text-white">Artists</h1>
      <ArtistsList />
    </section>
  );
}
