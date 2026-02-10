import type { TestConfig } from "./types";
import { hexacoConfig } from "./hexaco";

/**
 * Modified HEXACO — same 6 dimensions, custom questions
 * TODO: Replace placeholder questions with your own modified question bank
 */
export const hexacoModifiedConfig: TestConfig = {
  type: "HEXACO_MODIFIED",
  name: "Módosított HEXACO",
  description: "Saját módosított HEXACO kérdéssor, ugyanazzal a 6 dimenzióval.",
  format: "likert",
  // Same dimensions as official HEXACO
  dimensions: hexacoConfig.dimensions,
  questions: [
    // ── H: Őszinteség-Alázat ──
    { id: 1, dimension: "H", text: "MOD-H1 — cseréld ki a saját kérdésedre" },
    { id: 2, dimension: "H", text: "MOD-H2 — cseréld ki a saját kérdésedre" },
    /*{ id: 3, dimension: "H", text: "MOD-H3 — cseréld ki a saját kérdésedre" },

    // ── E: Érzelmi stabilitás ──
    { id: 4, dimension: "E", text: "MOD-E1 — cseréld ki a saját kérdésedre" },
    { id: 5, dimension: "E", text: "MOD-E2 — cseréld ki a saját kérdésedre" },
    { id: 6, dimension: "E", text: "MOD-E3 — cseréld ki a saját kérdésedre" },

    // ── X: Extraverzió ──
    { id: 7, dimension: "X", text: "MOD-X1 — cseréld ki a saját kérdésedre" },
    { id: 8, dimension: "X", text: "MOD-X2 — cseréld ki a saját kérdésedre" },
    { id: 9, dimension: "X", text: "MOD-X3 — cseréld ki a saját kérdésedre" },

    // ── A: Barátságosság ──
    { id: 10, dimension: "A", text: "MOD-A1 — cseréld ki a saját kérdésedre" },
    { id: 11, dimension: "A", text: "MOD-A2 — cseréld ki a saját kérdésedre" },
    { id: 12, dimension: "A", text: "MOD-A3 — cseréld ki a saját kérdésedre" },

    // ── C: Lelkiismeretesség ──
    { id: 13, dimension: "C", text: "MOD-C1 — cseréld ki a saját kérdésedre" },
    { id: 14, dimension: "C", text: "MOD-C2 — cseréld ki a saját kérdésedre" },
    { id: 15, dimension: "C", text: "MOD-C3 — cseréld ki a saját kérdésedre" },

    // ── O: Nyitottság ──
    { id: 16, dimension: "O", text: "MOD-O1 — cseréld ki a saját kérdésedre" },
    { id: 17, dimension: "O", text: "MOD-O2 — cseréld ki a saját kérdésedre" },
    { id: 18, dimension: "O", text: "MOD-O3 — cseréld ki a saját kérdésedre" },
     */
  ],
};
