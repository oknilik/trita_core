import test from "node:test";
import assert from "node:assert/strict";
import {
  getLegalDocumentDownloadPath,
  LEGAL_REVIEW_DOCUMENTS,
} from "@/lib/legal/review-documents";
import { SUPPORTED_LOCALES } from "@/lib/i18n/core";

test("mindhárom review-dokumentum stabil és egyedi azonosítóval szerepel", () => {
  assert.deepEqual(
    LEGAL_REVIEW_DOCUMENTS.map(({ slug }) => slug),
    ["platform-terms", "business-terms", "dpa"],
  );
  assert.equal(new Set(LEGAL_REVIEW_DOCUMENTS.map(({ documentId }) => documentId)).size, 3);
});

test("minden dokumentum teljes HU/EN felületi tartalommal rendelkezik", () => {
  for (const document of LEGAL_REVIEW_DOCUMENTS) {
    for (const locale of SUPPORTED_LOCALES) {
      assert.ok(document.title[locale].trim());
      assert.ok(document.description[locale].trim());
      assert.ok(document.scope[locale].trim());
      assert.ok(document.highlights[locale].length >= 3);
      assert.ok(document.reviewItems[locale].length >= 3);
    }
  }
});

test("a letöltési útvonal verziózott Word-tervezetre mutat", () => {
  for (const document of LEGAL_REVIEW_DOCUMENTS) {
    const path = getLegalDocumentDownloadPath(document);
    assert.match(path, /^\/legal-documents\//);
    assert.match(path, /review-draft-2026-08-28\.docx$/);
  }
});
