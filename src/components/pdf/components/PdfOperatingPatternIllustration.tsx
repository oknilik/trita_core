import { G, Path, Svg } from "@react-pdf/renderer";
import vectors from "../generated/operating-pattern-vectors.json";

/** Native paths generated from the public SVGs; works offline and stays sharp in print. */
export function PdfOperatingPatternIllustration({ code }: { code: string }) {
  if (!Object.hasOwn(vectors, code)) return null;
  const vector = vectors[code as keyof typeof vectors];
  return <Svg viewBox="0 0 400 224" width={200} height={112}>
    <G transform={vector.transform}>
      {vector.paths.map((path, i) => <Path key={i} d={path.d} fill={path.fill} transform={path.transform} />)}
    </G>
  </Svg>;
}
