// Client test tests.
import { describe, expect, it } from "vitest";
import { nativeToScVal, xdr } from "@stellar/stellar-sdk";
import { AjoClient, AjoContractError, CircleStatus, decodeReturnValue, minLedgerFromRangeError } from "./client";

describe("AjoContractError", () => {
  it("is a real Error subclass with a stable name for narrowing", () => {
    const error = new AjoContractError("simulation failed");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AjoContractError");
    expect(error.message).toBe("simulation failed");
  });
});

describe("CircleStatus", () => {
  it("matches the contract's discriminant values exactly", () => {
    // These are load-bearing: scValToNative decodes the contract's enum to
    // a plain number, and callers compare it against this enum by value.
    // A mismatch here would silently misclassify every circle's status.
    expect(CircleStatus.Forming).toBe(0);
    expect(CircleStatus.Active).toBe(1);
    expect(CircleStatus.Completed).toBe(2);
    expect(CircleStatus.Cancelled).toBe(3);
  });
});

describe("minLedgerFromRangeError", () => {
  it("extracts the lower bound from a real Soroban RPC range error", () => {
    const err = { code: -32600, message: "startLedger must be within the ledger range: 3846337 - 3967296" };
    expect(minLedgerFromRangeError(err)).toBe(3846337);
  });

  it("returns null for an unrelated error", () => {
    expect(minLedgerFromRangeError(new Error("network timeout"))).toBeNull();
  });

  it("handles a plain string error", () => {
    expect(minLedgerFromRangeError("ledger range: 100 - 200")).toBe(100);
  });
});

describe("AjoClient", () => {
  it("constructs with just a contract id, defaulting to testnet", () => {
    expect(() => new AjoClient({ contractId: "CCL4M6UACHON7VFUBIXCLY5OGD2HLGAYV63W54MKFJ3UICWCHEBYBWTL" })).not.toThrow();
  });

  it("accepts a custom rpc url and network passphrase", () => {
    expect(
      () =>
        new AjoClient({
          contractId: "CCL4M6UACHON7VFUBIXCLY5OGD2HLGAYV63W54MKFJ3UICWCHEBYBWTL",
          rpcUrl: "https://soroban-mainnet.example.org",
          networkPassphrase: "Public Global Stellar Network ; September 2015",
        }),
    ).not.toThrow();
  });
});
describe("decodeReturnValue", () => {
  it("decodes a u64 return value (e.g. create_circle's new id) to a bigint", () => {
    expect(decodeReturnValue<bigint>(nativeToScVal(42n, { type: "u64" }))).toBe(42n);
  });

  it("returns undefined when there is no return value", () => {
    expect(decodeReturnValue(undefined)).toBeUndefined();
  });

  it("returns undefined for a void return (e.g. join / contribute)", () => {
    expect(decodeReturnValue(xdr.ScVal.scvVoid())).toBeUndefined();
  });
});
