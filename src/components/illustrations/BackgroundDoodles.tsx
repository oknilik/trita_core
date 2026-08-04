import type { CSSProperties } from "react"

interface BackgroundDoodlesProps {
  primarySrc: string
}

export function BackgroundDoodles({ primarySrc }: BackgroundDoodlesProps) {
  const maskStyle: CSSProperties = {
    WebkitMaskImage: `url(${primarySrc})`,
    maskImage: `url(${primarySrc})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    backgroundColor: "#b8876b",
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden md:block" aria-hidden="true">
      <div
        className="absolute -right-20 top-16 h-[28rem] w-[28rem] -rotate-6 opacity-[0.07] lg:h-[34rem] lg:w-[34rem]"
        style={maskStyle}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream/30"
        aria-hidden="true"
      >
      </div>
    </div>
  )
}
