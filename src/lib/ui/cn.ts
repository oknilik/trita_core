export type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

function appendClass(input: ClassValue, output: string[]): void {
  if (!input) {
    return;
  }

  if (typeof input === "string" || typeof input === "number") {
    output.push(String(input));
    return;
  }

  if (Array.isArray(input)) {
    for (const entry of input) {
      appendClass(entry, output);
    }
    return;
  }

  for (const [key, enabled] of Object.entries(input)) {
    if (enabled) {
      output.push(key);
    }
  }
}

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    appendClass(input, classes);
  }

  return classes.join(" ");
}
