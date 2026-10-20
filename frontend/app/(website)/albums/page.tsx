import AlbumsList from "./_components/AlbumsList";

export default function AlbumsPage() {
  return (
    <section className="rounded-xl bg-[#FFFFFF1A] px-3 py-5 sm:px-6 sm:py-6">
      <h1 className="mb-4 text-xl font-semibold text-white sm:mb-7 sm:text-3xl lg:text-4xl">
        Albums
      </h1>

      <AlbumsList />
    </section>
  );
}
