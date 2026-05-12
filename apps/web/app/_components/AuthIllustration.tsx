import Image from "next/image";
import { WEB_BRAND_COMPACT_MARK_SRC } from "@/shared/config/brand";

export function AuthIllustration() {
  return (
    <div
      className="relative h-full min-h-[420px] overflow-hidden bg-accent-strong md:min-h-[560px] lg:min-h-screen"
    >
      <Image
        fill
        priority
        unoptimized
        alt=""
        aria-hidden="true"
        className="pointer-events-none object-cover"
        sizes="(min-width: 1024px) 46vw, 100vw"
        src="/auth/register-illustration.png"
      />
      <div
        className="absolute inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-white/25 bg-white/90 px-3 py-2 text-sm font-semibold text-foreground shadow-sm"
        style={{
          left: "max(1.25rem, env(safe-area-inset-left))",
          top: "max(1.25rem, env(safe-area-inset-top))",
        }}
      >
        <Image
          alt=""
          aria-hidden="true"
          className="size-8 rounded-[var(--radius-sm)] object-contain"
          height={32}
          priority
          src={WEB_BRAND_COMPACT_MARK_SRC}
          width={32}
        />
        <span translate="no">VRK</span>
      </div>
    </div>
  );
}
