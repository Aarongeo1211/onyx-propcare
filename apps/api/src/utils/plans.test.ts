import { describe, it, expect } from "vitest";
import { getPlanCategoryForPropertyType, planSupportsPropertyType } from "./plans";

describe("getPlanCategoryForPropertyType", () => {
  it("maps RESIDENTIAL_PLOT to RESIDENTIAL_PLOT", () => {
    expect(getPlanCategoryForPropertyType("RESIDENTIAL_PLOT")).toBe("RESIDENTIAL_PLOT");
  });

  it("maps FARMLAND to FARMLAND", () => {
    expect(getPlanCategoryForPropertyType("FARMLAND")).toBe("FARMLAND");
  });

  it("maps AGRICULTURAL_LAND to FARMLAND", () => {
    expect(getPlanCategoryForPropertyType("AGRICULTURAL_LAND")).toBe("FARMLAND");
  });

  it("maps ORCHARD to FARMLAND", () => {
    expect(getPlanCategoryForPropertyType("ORCHARD")).toBe("FARMLAND");
  });

  it("maps PLANTATION to FARMLAND", () => {
    expect(getPlanCategoryForPropertyType("PLANTATION")).toBe("FARMLAND");
  });
});

describe("planSupportsPropertyType", () => {
  it("ALL supports everything", () => {
    expect(planSupportsPropertyType("ALL", "FARMLAND")).toBe(true);
    expect(planSupportsPropertyType("ALL", "RESIDENTIAL_PLOT")).toBe(true);
  });

  it("FARMLAND supports farmland types", () => {
    expect(planSupportsPropertyType("FARMLAND", "FARMLAND")).toBe(true);
    expect(planSupportsPropertyType("FARMLAND", "ORCHARD")).toBe(true);
  });

  it("FARMLAND rejects RESIDENTIAL_PLOT", () => {
    expect(planSupportsPropertyType("FARMLAND", "RESIDENTIAL_PLOT")).toBe(false);
  });

  it("RESIDENTIAL_PLOT rejects farmland types", () => {
    expect(planSupportsPropertyType("RESIDENTIAL_PLOT", "FARMLAND")).toBe(false);
  });
});
