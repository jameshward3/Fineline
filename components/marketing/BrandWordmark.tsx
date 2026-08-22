import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("relative block h-[60px] w-[120px] text-fl-charcoal", className)}>
      <Image
        src="/marketing/brand-thread-mark.svg"
        alt=""
        width={104}
        height={26}
        className="absolute left-0.5 top-1.5 h-[26px] w-[104px]"
      />
      <span className="absolute left-0 top-[29px] font-display text-[15px] leading-none tracking-[2.6px]">
        FINE LINE
      </span>
      <span className="absolute left-[19px] top-[49px] font-flsans text-[7px] font-light leading-none tracking-[3.4px]">
        STUDIO
      </span>
    </span>
  );
}
