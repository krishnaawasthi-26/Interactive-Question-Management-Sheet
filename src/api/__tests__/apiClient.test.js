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
        text: async () => JSON.stringify({ ok: true }),
      })
    );

    const result = await apiRequest("/api/test", { method: "POST", body: { ping: true } });

    expect(result).toEqual({ ok: true });
  });

  it("retries localhost absolute API URLs through browser origin proxy when direct backend is unavailable", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        text: async () => JSON.stringify({ ok: true }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiRequest("/api/test", {
      method: "POST",
      body: { ping: true },
      baseUrl: "http://localhost:8080",
    });

    const expectedFallbackUrl = `${window.location.origin}/api/test`;
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8080/api/test",
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expectedFallbackUrl,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws normalized error for non-ok responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: { get: () => "application/json" },
        clone() {
          return this;
        },
        json: async () => ({ message: "bad request", code: "BAD_INPUT" }),
        text: async () => "",
      })
    );

    await expect(apiRequest("/api/test", { method: "POST", body: { ping: true } })).rejects.toMatchObject({
      message: "bad request",
      code: "BAD_INPUT",
      status: 400,
    });
  });

  it("uses plain text message for non-json error responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: { get: () => "text/plain" },
        text: async () => "Incorrect password. Please try again.",
      })
    );

    await expect(apiRequest("/api/test", { method: "POST", body: { ping: true } })).rejects.toMatchObject({
      message: "Incorrect password. Please try again.",
      status: 401,
    });
  });
});
