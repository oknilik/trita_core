import type { TestContext } from "node:test";

const TIMER_APIS: Array<
  | "Date"
  | "setTimeout"
  | "setInterval"
  | "setImmediate"
> = [
  "Date",
  "setTimeout",
  "setInterval",
  "setImmediate",
];

function toTimestamp(value: Date | number | string): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return new Date(value).getTime();
}

export function enableFakeTimer(
  context: TestContext,
  now: Date | number | string = "2026-04-01T10:00:00.000Z",
): void {
  context.mock.timers.enable({
    apis: TIMER_APIS,
    now: toTimestamp(now),
  });
}

export function setFakeTime(
  context: TestContext,
  now: Date | number | string,
): void {
  context.mock.timers.setTime(toTimestamp(now));
}

export function advanceFakeTime(context: TestContext, milliseconds: number): void {
  context.mock.timers.tick(milliseconds);
}
