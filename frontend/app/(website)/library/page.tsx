import { LibraryTabs } from "./_components/library-tabs";

export default function YourLibrary() {
  return (
    <section className="min-h-full rounded-[12px] bg-[#FFFFFF1A] px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
      <h1 className="text-2xl font-semibold leading-tight text-white sm:text-3xl lg:leading-none">
        Your Library
      </h1>
      <p className="mt-1.5 text-sm leading-tight text-[#8A8A8A] sm:mt-2 lg:leading-none">
        4 favorites · 3 albums · 2 playlists
      </p>

      <LibraryTabs />
    </section>
  );
}
