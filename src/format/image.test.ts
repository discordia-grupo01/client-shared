import { describe, expect, it } from "vitest";

import { resolveImageUrl } from "./image";

const API = "http://localhost:8080";

describe("resolveImageUrl", () => {
  it("prefija las rutas relativas con la url del backend", () => {
    expect(resolveImageUrl("/uploads/profile-images/a.jpg", API)).toBe(
      "http://localhost:8080/uploads/profile-images/a.jpg",
    );
  });

  it("deja intactas las urls absolutas (Supabase)", () => {
    const supabase =
      "https://xyz.supabase.co/storage/v1/object/public/icons/a.png";
    expect(resolveImageUrl(supabase, API)).toBe(supabase);
    expect(resolveImageUrl("HTTP://EJEMPLO.COM/a.png", API)).toBe(
      "HTTP://EJEMPLO.COM/a.png",
    );
  });

  it("devuelve null cuando no hay imagen", () => {
    expect(resolveImageUrl(null, API)).toBeNull();
    expect(resolveImageUrl(undefined, API)).toBeNull();
    expect(resolveImageUrl("", API)).toBeNull();
  });
});
