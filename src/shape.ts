import * as fs from "fs";
import * as path from "path";

/**
 * Shape capture: records the structure of bank API responses with all data masked,
 * so the result can be shared for debugging without exposing financial/personal data.
 * Enabled only when OBC_SHAPE_DIR is set.
 *
 * Masking: numbers → "<int>"/"<float>"; strings → digits→9, letters→a (keeps format/length);
 * only short alphabetic values under allow-listed keys (currency, type, category…) are kept verbatim.
 */
const KEEP_KEYS = new Set([
  "moneda", "codigoMoneda", "tipo", "claseCuenta", "origenTransaccion", "grupo", "marca",
  "codigo", "tipoCliente", "tipoTarjeta", "estado", "currency",
]);

export function redactShape(v: unknown, key = ""): unknown {
  if (v === null || typeof v === "boolean") return v;
  if (typeof v === "number") return Number.isInteger(v) ? "<int>" : "<float>";
  if (typeof v === "string") {
    if (KEEP_KEYS.has(key) && v.length <= 30 && /^[A-Za-z_ -]+$/.test(v)) return v;
    return v.replace(/[0-9]/g, "9").replace(/\p{L}/gu, "a");
  }
  if (Array.isArray(v)) {
    const out: unknown[] = v.slice(0, 2).map((x) => redactShape(x, key));
    if (v.length > 2) out.push(`<+${v.length - 2} more>`);
    return out;
  }
  if (typeof v === "object") {
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, redactShape(x, k)]));
  }
  return "<unsupported>";
}

const shapes: Record<string, unknown[]> = {};

export function recordShape(name: string, data: unknown): void {
  if (!process.env.OBC_SHAPE_DIR) return;
  (shapes[name] ??= []).push(redactShape(data));
}

/** Serializes captured shapes; returns null if anything that looks like real data (4+ digits) slipped through. */
export function serializeShapes(): string | null {
  const text = JSON.stringify(shapes, null, 2);
  return /\d{4,}/.test(text) ? null : text;
}

export function flushShapes(): void {
  const dir = process.env.OBC_SHAPE_DIR;
  if (!dir || Object.keys(shapes).length === 0) return;
  const text = serializeShapes();
  if (text === null) {
    console.error("[shape] suppressed: output contained a 4+ digit sequence; nothing written");
    return;
  }
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(dir, "shape.json"), text, { mode: 0o600 });
  console.error(`[shape] wrote ${path.join(dir, "shape.json")}`);
}
