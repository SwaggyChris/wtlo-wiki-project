import { describe, expect, it } from "vitest";
import { navItems, socialLinks, usefulResources } from "@/data/site";

describe("site data", () => {
  it("has four primary nav items", () => {
    expect(navItems).toHaveLength(4);
  });

  it("uses unique nav hrefs", () => {
    const hrefs = navItems.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("includes footer resources and social links", () => {
    expect(usefulResources.length).toBeGreaterThanOrEqual(4);
    expect(socialLinks.length).toBeGreaterThanOrEqual(4);
  });
});