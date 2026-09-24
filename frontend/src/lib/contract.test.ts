// Contract test tests.
import { describe, expect, it, vi } from "vitest";
import { sendWithRetry } from "./contract";

describe("sendWithRetry (#150)", () => {
  function mockServer(sendTransaction: (...args: unknown[]) => unknown) {
    return { sendTransaction } as unknown as Parameters<typeof sendWithRetry>[0];
  }

  it("returns immediately on PENDING without retrying", async () => {
    const sendTransaction = vi.fn().mockResolvedValue({ status: "PENDING", hash: "abc" });
    const result = await sendWithRetry(mockServer(sendTransaction), {} as never);
    expect(result.status).toBe("PENDING");
    expect(sendTransaction).toHaveBeenCalledTimes(1);
  });

  it("returns DUPLICATE as-is without retrying, so the caller proceeds to polling", async () => {
    const sendTransaction = vi.fn().mockResolvedValue({ status: "DUPLICATE", hash: "abc" });
    const result = await sendWithRetry(mockServer(sendTransaction), {} as never);
    expect(result.status).toBe("DUPLICATE");
    expect(sendTransaction).toHaveBeenCalledTimes(1);
  });

  it("returns ERROR as-is without retrying", async () => {
    const sendTransaction = vi.fn().mockResolvedValue({ status: "ERROR", hash: "abc" });
    const result = await sendWithRetry(mockServer(sendTransaction), {} as never);
    expect(result.status).toBe("ERROR");
    expect(sendTransaction).toHaveBeenCalledTimes(1);
  });

  it("retries with backoff on TRY_AGAIN_LATER, then returns the eventual success", async () => {
    vi.useFakeTimers();
    try {
      const sendTransaction = vi
        .fn()
        .mockResolvedValueOnce({ status: "TRY_AGAIN_LATER", hash: "abc" })
        .mockResolvedValueOnce({ status: "TRY_AGAIN_LATER", hash: "abc" })
        .mockResolvedValueOnce({ status: "PENDING", hash: "abc" });

      const promise = sendWithRetry(mockServer(sendTransaction), {} as never);
      // Two backoff delays (500ms, 1000ms) must elapse between the three calls.
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;
      expect(result.status).toBe("PENDING");
      expect(sendTransaction).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it("gives up after the max retry attempts, returning the last TRY_AGAIN_LATER response", async () => {
    vi.useFakeTimers();
    try {
      const sendTransaction = vi.fn().mockResolvedValue({ status: "TRY_AGAIN_LATER", hash: "abc" });
      const promise = sendWithRetry(mockServer(sendTransaction), {} as never);
      await vi.advanceTimersByTimeAsync(60_000);

      const result = await promise;
      expect(result.status).toBe("TRY_AGAIN_LATER");
      // 1 initial attempt + 5 retries = 6 total calls.
      expect(sendTransaction).toHaveBeenCalledTimes(6);
    } finally {
      vi.useRealTimers();
    }
  });
});
