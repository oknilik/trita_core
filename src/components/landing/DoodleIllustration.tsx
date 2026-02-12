import Image from "next/image";

export function DoodleIllustration() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#F8FAFC]">
      {/* Pastel amorphous background shapes */}
      <svg
        viewBox="0 0 700 300"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M40 60c30-14 62-4 74 22 12 26-6 52-36 56-28 4-56-12-60-36-4-18 6-32 22-42z"
          fill="#E0E7FF"
        />
        <path
          d="M520 30c28-10 60 8 66 34 6 28-14 52-42 56-26 4-52-14-56-38-4-20 10-42 32-52z"
          fill="#D1FAE5"
        />
        <path
          d="M280 220c24-8 54 6 60 28 6 22-12 42-36 44-22 2-44-10-48-30-4-16 6-34 24-42z"
          fill="#EDE9FE"
        />
        <path
          d="M80 210c22-6 48 8 52 28 4 18-10 34-32 36-20 2-38-10-40-26-2-14 6-30 20-38z"
          fill="#FCE7F3"
        />
        <path
          d="M600 200c18-4 38 10 40 26 2 16-10 30-28 32-16 1-32-8-34-22-1-12 6-28 22-36z"
          fill="#DBEAFE"
        />
        <circle cx="380" cy="260" r="22" fill="#FEF3C7" />
        <circle cx="150" cy="40" r="16" fill="#FFEDD5" />
        <circle cx="650" cy="80" r="14" fill="#D1FAE5" />
      </svg>

      <Image
        src="/doodles/meditating.svg"
        alt=""
        aria-hidden
        fill
        sizes="(min-width: 768px) 384px, 100vw"
        className="relative h-full w-full object-contain"
      />
    </div>
  );
}
