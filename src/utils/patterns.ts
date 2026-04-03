import type { EntryInfo } from "@/types";

export function buildPatterns(paths: string[], entries: EntryInfo[]): string[] {
  const filePaths = new Set(entries.map((e) => e.path));
  return paths.map((p) => (filePaths.has(p) ? p : p + "/**"));
}
