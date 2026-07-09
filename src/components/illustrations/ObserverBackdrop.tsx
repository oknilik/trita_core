export function ObserverBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden md:block"
      aria-hidden="true"
    >
      <div className="absolute -right-24 top-12 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(193,127,74,0.12)_0%,rgba(193,127,74,0.04)_45%,transparent_72%)]" />
      <div className="absolute -left-20 bottom-6 h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(61,107,94,0.14)_0%,rgba(61,107,94,0.05)_48%,transparent_76%)]" />
      <div className="absolute right-[18%] top-[34%] h-44 w-44 rotate-12 rounded-[42%_58%_53%_47%] bg-[rgba(47,72,99,0.08)] blur-sm" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream/30" />
    </div>
  );
}
