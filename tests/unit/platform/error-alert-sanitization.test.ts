import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeDiagnosticPath,
  sanitizeDiagnosticText,
} from "@/lib/error-alert";

test("a hibariasztás kitakarja az emailt, tokent és query-értéket", () => {
  const sanitized = sanitizeDiagnosticText(
    "Failed for daniel@example.com?token=secret123 Bearer abc.def.ghi",
  );
  assert.ok(sanitized);
  assert.ok(!sanitized.includes("daniel@example.com"));
  assert.ok(!sanitized.includes("secret123"));
  assert.ok(!sanitized.includes("abc.def.ghi"));
});

test("a diagnosztikai útvonalból query és hash nem kerül ki", () => {
  assert.equal(sanitizeDiagnosticPath("/team/abc?token=secret#section"), "/team/abc");
  assert.equal(sanitizeDiagnosticPath("https://example.com/team"), null);
});
