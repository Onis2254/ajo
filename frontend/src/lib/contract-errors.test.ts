// @vitest-environment node
// Contract errors tests.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ContractCallError } from "./contract";
import { ContractErrorCode, describeContractError, parseContractErrorCode } from "./contract-errors";

describe("ContractErrorCode (frontend copy)", () => {
  it("matches every variant of ContractError in the Rust contract", () => {
    const src = readFileSync(
      fileURLToPath(new URL("../../../contracts/ajo-circle/src/lib.rs", import.meta.url)),
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
});

describe("contract error mapping", () => {
  it("resolves a known code and falls back to the raw string", () => {
    expect(parseContractErrorCode("HostError: Error(Contract, #2)")).toBe(ContractErrorCode.CircleFull);
    expect(describeContractError("Error(Contract, #2)")).toBe("This circle is already full.");
    expect(describeContractError("rpc down")).toBe("rpc down");
  });

  it("ContractCallError.fromSimulationError exposes message and code", () => {
    const err = ContractCallError.fromSimulationError("HostError: Error(Contract, #10)");
    expect(err).toBeInstanceOf(ContractCallError);
    expect(err.code).toBe(ContractErrorCode.NotAuthorized);
    expect(err.message).toBe("You're not authorized to do that.");
  });
});
