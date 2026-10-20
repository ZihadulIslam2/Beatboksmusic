import Link from "next/link";

import FallbackImage from "@/components/common/FallbackImage";

type ArtistCardProps = {
  id: string;
  name: string;
  image: string;
  fallbackImages?: string[];
  albums: number;
  songs: number;
};

export default function ArtistCard({
  id,
  name,
  image,
  fallbackImages,
  albums,
  songs,
}: ArtistCardProps) {
  return (
    <Link href={`/single-artists/${id}`} className="group block min-w-0">
      <div className="relative aspect-[4/4.2] overflow-hidden rounded-xl bg-white/5">
        <FallbackImage
          src={image || "/artis.png"}
          fallbackSrc={fallbackImages}
          placeholderSrc="/artis.png"
          alt={name}
          fill
          sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="pt-3 text-center">
        <h3 className="truncate text-sm font-medium text-white md:text-xl">
          {name}
        </h3>

        <p className="mt-1 text-xs text-[#A8A8A8] md:text-lg">
          {albums} Albums • {songs} Songs
        </p>
      </div>
    </Link>
  );
}
