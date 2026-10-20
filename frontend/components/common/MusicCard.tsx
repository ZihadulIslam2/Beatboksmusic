import Image, { type ImageProps } from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type MusicCardProps = {
  image: ImageProps["src"];
  title: string;
  artist?: string;
  year?: number | string;
  type?: string;
  duration?: string;
  href?: string;
  className?: string;
  priority?: boolean;
};

export function MusicCard({
  image,
  title,
  artist,
  year,
  type,
  duration,
  href,
  className,
  priority = false,
}: MusicCardProps) {
  const metadata = [artist, year, type, duration]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .join(" • ");

  const cardClassName = cn(
    "group block min-w-0 rounded-lg p-1.5 transition-colors duration-200 hover:bg-[#212121] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00EF01] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818] sm:p-2",
    className
  );

  const content = (
    <>
      <div className="relative aspect-[533/520] w-full overflow-hidden rounded-md bg-white/5">
        <Image
          src={image}
          alt={title}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-2 min-w-0 sm:mt-3">
        <h3 className="truncate text-sm font-medium leading-tight text-white sm:text-xl">
          {title}
        </h3>
        {metadata && (
          <p
            className="mt-1 truncate text-xs leading-tight text-[#A8A8A8] sm:text-sm"
            title={metadata}
          >
            {metadata}
          </p>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return <article className={cardClassName}>{content}</article>;
}

export default MusicCard;
