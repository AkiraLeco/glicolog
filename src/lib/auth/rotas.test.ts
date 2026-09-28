import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./rotas";

describe("destinoSeguro", () => {
  it("aceita caminhos internos", () => {
    expect(destinoSeguro("/historico?periodo=7d")).toBe("/historico?periodo=7d");
  });

  it("usa o padrão quando não há destino", () => {
    expect(destinoSeguro(null)).toBe("/");
    expect(destinoSeguro("", "/x")).toBe("/x");
  });

  it("bloqueia destinos externos", () => {
    expect(destinoSeguro("https://malicioso.com")).toBe("/");
    expect(destinoSeguro("//malicioso.com")).toBe("/");
    expect(destinoSeguro("/\\malicioso.com")).toBe("/");
    expect(destinoSeguro("malicioso.com")).toBe("/");
  });
});
