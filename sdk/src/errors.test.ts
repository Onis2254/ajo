// Errors tests.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AjoContractError } from "./client";
import {
  CONTRACT_ERROR_MESSAGES,
  ContractErrorCode,
  describeContractError,
  parseContractErrorCode,
} from "./errors";

describe("ContractErrorCode", () => {
  it("matches every variant of ContractError in the Rust contract", () => {
    // Guard against drift: parse `Name = N,` lines from the contract source.
    const src = readFileSync(
      fileURLToPath(new URL("../../contracts/ajo-circle/src/lib.rs", import.meta.url)),
      "utf8",
    );
    const body = /pub enum ContractError \{([^}]*)\}/.exec(src)![1];
    const rust = Object.fromEntries(
      [...body.matchAll(/(\w+)\s*=\s*(\d+)/g)].map(([, name, code]) => [name, Number(code)]),
    );
    const ts = Object.fromEntries(
      Object.entries(ContractErrorCode).filter(([, v]) => typeof v === "number"),
    );
    expect(ts).toEqual(rust);
  });

  it("has a message for every code", () => {
    for (const code of Object.values(ContractErrorCode).filter((v) => typeof v === "number")) {
      expect(CONTRACT_ERROR_MESSAGES[code as ContractErrorCode]).toBeTruthy();
    }
  });
});

describe("parseContractErrorCode", () => {
  it("extracts the code from a Soroban simulation error", () => {
    const raw = "HostError: Error(Contract, #4)\n\nEvent log (newest first): ...";
    expect(parseContractErrorCode(raw)).toBe(ContractErrorCode.CircleNotForming);
  });

  it("returns null for unknown codes and non-contract errors", () => {
    expect(parseContractErrorCode("Error(Contract, #99)")).toBeNull();
    expect(parseContractErrorCode("Error(Auth, InvalidAction)")).toBeNull();
    expect(parseContractErrorCode("network timeout")).toBeNull();
  });
});

describe("describeContractError", () => {
  it("maps a known code to its friendly message", () => {
    expect(describeContractError("Error(Contract, #3)")).toBe("You're already a member of this circle.");
  });

  it("falls back to the raw string", () => {
    expect(describeContractError("Error(Contract, #99)")).toBe("Error(Contract, #99)");
  });
});

describe("AjoContractError.fromSimulationError", () => {
  it("carries the friendly message and the numeric code", () => {
    const err = AjoContractError.fromSimulationError("HostError: Error(Contract, #7)");
    expect(err).toBeInstanceOf(AjoContractError);
    expect(err.code).toBe(ContractErrorCode.AlreadyContributed);
    expect(err.message).toBe("You've already contributed this cycle.");
  });

  it("keeps the raw message and a null code otherwise", () => {
    const err = AjoContractError.fromSimulationError("boom");
    expect(err.code).toBeNull();
    expect(err.message).toBe("boom");
  });
});
