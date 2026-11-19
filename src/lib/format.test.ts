import { describe, it, expect } from "vitest";
import { escapeHtml, formatUSD, formatPct, formatSupply } from "./format.js";

describe("escapeHtml", () => {
  it("escapes &", () => expect(escapeHtml("a & b")).toBe("a &amp; b"));
  it("escapes <", () => expect(escapeHtml("a < b")).toBe("a &lt; b"));
  it("escapes >", () => expect(escapeHtml("a > b")).toBe("a &gt; b"));
  it("escapes all three in one string", () => {
    expect(escapeHtml("<script>a & b</script>")).toBe("&lt;script&gt;a &amp; b&lt;/script&gt;");
  });
  it("passes through plain text unchanged", () => {
    expect(escapeHtml("Bitcoin (BTC)")).toBe("Bitcoin (BTC)");
  });
});

describe("formatUSD", () => {
  it("formats zero", () => expect(formatUSD(0)).toBe("$0.00"));
  it("formats trillions", () => expect(formatUSD(1.5e12)).toBe("$1.5T"));
  it("formats billions", () => expect(formatUSD(2.3e9)).toBe("$2.3B"));
  it("formats millions", () => expect(formatUSD(1_234_567)).toBe("$1.23M"));
  it("formats thousands", () => expect(formatUSD(43_250)).toBe("$43.25K"));
  it("formats whole dollars", () => expect(formatUSD(150.5)).toBe("$150.50"));
  it("formats small prices (>= $0.01)", () => expect(formatUSD(0.08)).toBe("$0.08"));
  it("formats very small prices with enough significant figures", () => {
    expect(formatUSD(0.00001234)).toBe("$0.00001234");
  });
  it("strips trailing zeros in compact notation", () => {
    expect(formatUSD(1e9)).toBe("$1B");
    expect(formatUSD(1.5e6)).toBe("$1.5M");
  });
});

describe("formatPct", () => {
  it("shows 🟢 and + for positive values", () => {
    expect(formatPct(1.23)).toBe("🟢 +1.23%");
  });
  it("shows 🔴 and − for negative values", () => {
    expect(formatPct(-2.34)).toBe("🔴 -2.34%");
  });
  it("returns an em-dash for null", () => {
    expect(formatPct(null)).toBe("—");
  });
  it("treats zero as positive", () => {
    expect(formatPct(0)).toBe("🟢 +0.00%");
  });
});

describe("formatSupply", () => {
  it("returns ∞ for null max supply", () => {
    expect(formatSupply(null)).toBe("∞");
  });
  it("formats millions", () => expect(formatSupply(21_000_000)).toBe("21M"));
  it("formats billions", () => expect(formatSupply(141_000_000_000)).toBe("141B"));
  it("formats thousands", () => expect(formatSupply(1_234)).toBe("1.23K"));
  it("formats values below 1 K without a suffix", () => {
    expect(formatSupply(500)).toBe("500");
  });
});
