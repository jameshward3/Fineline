import Image from "next/image";
import { brand } from "@/lib/branding";
import { cn } from "@/lib/utils";

export function BrandWordmark({
  className,
  variant = "wordmark",
  priority = false,
}: {
  className?: string;
  variant?: "wordmark" | "stacked";
  priority?: boolean;
}) {
  if (variant === "stacked") {
    return (
      <span className={cn("relative block h-[108px] w-[120px] overflow-hidden", className)}>
        <Image
          src={brand.logoBadge}
          alt={brand.companyName}
          width={395}
          height={357}
          sizes="120px"
          className="h-auto w-full mix-blend-multiply"
          priority={priority}
        />
      </span>
    );
  }

  return (
    <span className={cn("relative block h-[50px] w-[158px] overflow-hidden", className)}>
      <Image
        src={brand.wordmark}
        alt={brand.companyName}
        width={335}
        height={135}
        sizes="158px"
        className="absolute -top-[11px] left-0 h-auto w-full max-w-none mix-blend-multiply"
        priority={priority}
      />
    </span>
  );
}
