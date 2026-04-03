import type { EntryInfo } from "@/types";

export interface VirtualDir {
  kind: "dir";
  name: string;
  path: string;
  children: Map<string, VirtualNode>;
}

export interface VirtualFile {
  kind: "file";
  name: string;
  path: string;
  entry: EntryInfo;
}

export type VirtualNode = VirtualDir | VirtualFile;
export type DirEntry = VirtualNode;

export function buildTree(entries: EntryInfo[]): VirtualDir {
  const root: VirtualDir = { kind: "dir", name: "", path: "", children: new Map() };
  for (const entry of entries) {
    const parts = entry.path.split("/");
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.children.has(part)) {
        const dirPath = parts.slice(0, i + 1).join("/");
        current.children.set(part, { kind: "dir", name: part, path: dirPath, children: new Map() });
      }
      current = current.children.get(part) as VirtualDir;
    }
    const filename = parts[parts.length - 1];
    current.children.set(filename, { kind: "file", name: filename, path: entry.path, entry });
  }
  return root;
}

export function listDir(root: VirtualDir, pathSegments: string[]): VirtualNode[] {
  let current: VirtualDir = root;
  for (const seg of pathSegments) {
    const child = current.children.get(seg);
    if (!child || child.kind !== "dir") return [];
    current = child;
  }
  return Array.from(current.children.values());
}

/**
 * Returns the total original size for a given path.
 * For a real file entry the entry's own size is returned.
 * For a virtual directory (no matching entry) all descendant entry sizes are summed.
 */
export function sizeOf(entries: EntryInfo[], path: string): number {
  const entry = entries.find((e) => e.path === path);
  if (entry) return entry.originalSize;
  const prefix = path + "/";
  return entries.filter((e) => e.path.startsWith(prefix)).reduce((s, e) => s + e.originalSize, 0);
}

export function isValidPath(root: VirtualDir, pathSegments: string[]): boolean {
  let current: VirtualDir = root;
  for (const seg of pathSegments) {
    const child = current.children.get(seg);
    if (!child || child.kind !== "dir") return false;
    current = child;
  }
  return true;
}
