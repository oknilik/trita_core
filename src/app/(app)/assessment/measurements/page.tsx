import { redirect } from "next/navigation";

// A mérési feladatok nézete /tasks alatt él (2026-07-29): az /assessment*
// útvonalon a fejléc fókusz-módra vált (kitöltő-felület), a feladat-lista
// viszont áttekintő oldal — teljes navigációval. A korábban kiküldött
// értesítés-linkek miatt ez az útvonal átirányít.
export default function LegacyMeasurementsRedirect() {
  redirect("/tasks");
}
