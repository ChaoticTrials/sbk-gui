export interface ArchiveInfo {
  path: string;
  formatVersion: number;
  algorithm: string;
  fileCount: number;
  frameSizeBytes: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
}

export interface EntryInfo {
  path: string;
  mtimeMs: number;
  groupId: number;
  originalSize: number;
}

export interface ExtractionProgress {
  phase: "decompress" | "decode" | "write";
  completed: number;
  total: number;
}

export interface OpenArchiveResult {
  info: ArchiveInfo;
  entries: EntryInfo[];
}

export type SortColumn = "name" | "type" | "size" | "modified";
export type ColumnKey = "name" | "type" | "size" | "modified" | "coords";
export type SelectMode = "single" | "toggle" | "range";

export interface PhaseProgress {
  completed: number;
  total: number;
}

export interface ExtractDialogState {
  phase: "running" | "done" | "error";
  decompress?: PhaseProgress;
  decode?: PhaseProgress;
  write?: PhaseProgress;
  writeStartedAt?: number;
  count?: number;
  dest?: string;
  message?: string;
}

export interface ContextMenuState {
  x: number;
  y: number;
}

export type VerifyState = "running" | { ok: boolean } | { error: string };
