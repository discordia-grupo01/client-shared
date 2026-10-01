import { describe, expect, it } from "vitest";

import type { ApiResult } from "./api-result";
import { collectAllPages, type PageOf } from "./collect-pages";

const ok = (items: number[], total: number): ApiResult<PageOf<number>> => ({
  ok: true,
  status: 200,
  data: { items, total },
});

describe("collectAllPages", () => {
  it("pide las paginas con el offset acumulado hasta completar el total", async () => {
    const offsets: number[] = [];
    const result = await collectAllPages(async (offset) => {
      offsets.push(offset);
      return ok(offset === 0 ? [1, 2] : [3], 3);
    });
    expect(offsets).toEqual([0, 2]);
    expect(result).toMatchObject({ ok: true, data: { items: [1, 2, 3] } });
  });

  it("corta si el back devuelve una pagina vacia aunque falten items", async () => {
    const result = await collectAllPages(async (offset) =>
      ok(offset === 0 ? [1] : [], 5),
    );
    expect(result).toMatchObject({ ok: true, data: { items: [1], total: 1 } });
  });

  it("devuelve el primer fallo", async () => {
    const failure: ApiResult<PageOf<number>> = {
      ok: false,
      status: 403,
      code: 403,
      message: "no",
    };
    expect(await collectAllPages(async () => failure)).toBe(failure);
  });
});
