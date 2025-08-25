import fetch from "../fetch";

describe("fetch wrapper", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  it("passes credentials include by default", async () => {
    await fetch("/api/x");
    expect(global.fetch).toHaveBeenCalledWith("/api/x", expect.objectContaining({ credentials: "include" }));
  });

  it("merges caller options without dropping credentials", async () => {
    await fetch("/api/x", { method: "POST", headers: { "X": "1" } });
    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.credentials).toBe("include");
    expect(opts.method).toBe("POST");
    expect(opts.headers.X).toBe("1");
  });
});
