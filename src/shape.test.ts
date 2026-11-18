import { describe, it, expect } from "vitest";
import { redactShape } from "./shape.js";

describe("redactShape", () => {
  it("masks numbers, names, ids and dates but keeps allow-listed categories", () => {
    const r = redactShape({
      moneda: "CLP", tipo: "CUENTA_CORRIENTE", disponible: 1234567, interes: 1.5,
      nombre: "José Pérez", rut: "12.345.678-9", numero: "4111111111111111", fecha: "22-03-2026",
      items: [{ monto: 1 }, { monto: 2 }, { monto: 3 }],
    });
    const text = JSON.stringify(r);
    expect(text).not.toMatch(/\d{4,}/);
    expect(text).not.toMatch(/José|Pérez/);
    expect(r).toMatchObject({ moneda: "CLP", tipo: "CUENTA_CORRIENTE", disponible: "<int>", interes: "<float>", fecha: "99-99-9999" });
    expect((r as any).items).toHaveLength(3);
  });
  it("does not keep allow-listed keys whose value contains digits", () => {
    expect(redactShape({ codigo: "AB1234" })).toEqual({ codigo: "aa9999" });
  });
});
