/** Four geometric marks in information/coordination/decision/execution order. */
export function OperatingPatternMark({ code, className = "" }: { code: string; className?: string }) {
  return <span aria-hidden="true" className={`grid aspect-square grid-cols-2 gap-1 ${className}`}>
    <span className={`bg-sage ${code[0] === "I" ? "rounded-full" : "rounded-tl-full"}`} />
    <span className={`bg-bronze ${code[1] === "O" ? "scale-75 rounded-full" : "rounded-tr-full"}`} />
    {code[2] === "D" ? <span className="grid grid-cols-2 gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className="rounded-full bg-current" />)}</span> : <span className="rounded-bl-full bg-current" />}
    <span className={`bg-sand ${code[3] === "A" ? "rounded-br-full" : ""}`} />
  </span>;
}
