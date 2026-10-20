import SongsList from "./_components/SongsList";

type SongsPageProps = {
  searchParams?: {
    section?: string | string[];
  };
};

export default function SongsPage({ searchParams }: SongsPageProps) {
  const section = Array.isArray(searchParams?.section)
    ? searchParams.section[0]
    : searchParams?.section;

  return (
    <div className="min-h-full rounded-[12px] bg-[#FFFFFF1A]">
      <SongsList
        section={section === "recommended" ? "recommended" : "popular"}
      />
    </div>
  );
}
