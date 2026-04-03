export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDate(mtimeMs: number): string {
  if (!mtimeMs) return "—";
  const d = new Date(mtimeMs);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}  ${hh}:${mi}:${ss}`;
}

export function groupLabel(groupId: number): string {
  switch (groupId) {
    case 0:
      return "MCA";
    case 1:
      return "NBT";
    case 2:
      return "JSON";
    default:
      return "RAW";
  }
}

/** Parse an .mca region filename (r.RX.RZ.mca) and return block coordinate bounds, or null. */
export function parseMcaCoords(filename: string): { x1: number; z1: number; x2: number; z2: number } | null {
  const m = filename.match(/^r\.(-?\d+)\.(-?\d+)\.mca$/i);
  if (!m) return null;
  const rx = parseInt(m[1]);
  const rz = parseInt(m[2]);
  return { x1: rx * 512, z1: rz * 512, x2: rx * 512 + 511, z2: rz * 512 + 511 };
}

/** Format mca coordinate range for display, e.g. "X: 0–511  Z: 512–1023" */
export function formatMcaCoords(coords: { x1: number; z1: number; x2: number; z2: number }): string {
  return `X: ${coords.x1}–${coords.x2}  Z: ${coords.z1}–${coords.z2}`;
}
