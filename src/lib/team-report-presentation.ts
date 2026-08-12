/**
 * A hosszabb tanácsadói narratívából rövid, vezetői átfutásra alkalmas
 * kiemeléseket készít. Nem írja át a tartalmat: csak a felsorolásokat és
 * mondatokat bontja fel, majd megtartja az első néhány elemet.
 */
export function extractNarrativeHighlights(
  text: string | null | undefined,
  limit = 3,
): string[] {
  if (!text?.trim() || limit <= 0) return [];

  const highlights = text
    .split(/\r?\n/u)
    .flatMap((rawLine) => {
      const line = rawLine.trim().replace(/^[•*\-]\s*/u, "");
      if (!line) return [];
      return line.split(/(?<=[.!?])\s+/u);
    })
    .map((item) => item.trim())
    .filter(Boolean);

  return highlights.slice(0, limit);
}
