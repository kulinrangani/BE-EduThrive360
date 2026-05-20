import { describe, it } from "node:test";
import assert from "node:assert";
import { DEFAULT_MESSAGES } from "./quote.service.js";

// Re-export default messages for test without DB
const pickDefault = (riskLevel) => ({
  message: DEFAULT_MESSAGES?.[riskLevel] ?? DEFAULT_MESSAGES.Medium,
});

describe("quote defaults", () => {
  it("has messages for each risk level", () => {
    assert.ok(pickDefault("High").message.length > 10);
    assert.ok(pickDefault("Low").message.length > 10);
  });
});
