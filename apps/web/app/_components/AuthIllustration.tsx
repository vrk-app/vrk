import Image from "next/image";

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
    </div>
  );
}
