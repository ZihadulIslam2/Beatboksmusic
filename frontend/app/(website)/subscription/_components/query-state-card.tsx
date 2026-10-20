import type { LucideIcon } from "lucide-react";

type QueryStateCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: "default" | "error";
};

const toneStyles = {
  default: {
    wrapper: "border-[#2B2B2B] bg-[#1A1A1A]",
    iconBox: "bg-[#00EF0114] text-primary",
  },
  error: {
    wrapper: "border-[#4A2323] bg-[#211515]",
    iconBox: "bg-[#FF4D4F1A] text-[#FF7B7D]",
  },
};

const QueryStateCard = ({
  title,
  description,
  icon: Icon,
  tone = "default",
}: QueryStateCardProps) => {
  const styles = toneStyles[tone];

  return (
    <div
      className={`mt-7 flex min-h-40 flex-col items-center justify-center rounded-[12px] border px-5 py-8 text-center ${styles.wrapper}`}
    >
      <div
        className={`flex size-12 items-center justify-center rounded-full ${styles.iconBox}`}
      >
        <Icon className="size-5" />
      </div>

      <h3 className="pt-4 text-base font-semibold leading-none text-white">
        {title}
      </h3>
      <p className="max-w-[320px] pt-2 text-sm leading-[140%] text-[#A0A0A0]">
        {description}
      </p>
    </div>
  );
};

export default QueryStateCard;
