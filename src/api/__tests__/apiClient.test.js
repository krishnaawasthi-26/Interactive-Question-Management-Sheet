import { apiRequest } from "../apiClient";

describe("apiRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("returns parsed json payload on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: true }),
      })
    );

    const result = await apiRequest("/api/test", { method: "GET" });

    expect(result).toEqual({ ok: true });
  });

  it("throws normalized error for non-ok responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: "bad request", code: "BAD_INPUT" }),
        text: async () => "",
      })
    );

    await expect(apiRequest("/api/test", { method: "GET" })).rejects.toMatchObject({
      message: "bad request",
      code: "BAD_INPUT",
      status: 400,
    });
  });
});
