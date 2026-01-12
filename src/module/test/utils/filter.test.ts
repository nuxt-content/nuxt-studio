import { describe, it, expect } from "vitest";
import { filterComponents } from "../../src/runtime/server/utils/filter";

describe("filterComponents", () => {
  const components = [
    { name: "MyComponent", path: "components/MyComponent.vue" },
    { name: "AwesomeButton", path: "components/ui/AwesomeButton.vue" },
    { name: "ContentProse", path: "content/prose/ContentProse.vue" },
    { name: "ContentList", path: "content/ContentList.vue" },
  ];

  it("should exclude components by name", () => {
    const result = filterComponents(components, [], ["MyComponent"]);
    expect(result).toHaveLength(3);
    expect(result.find((c) => c.name === "MyComponent")).toBeUndefined();
  });

  it("should exclude components by path", () => {
    const result = filterComponents(components, [], ["content/prose/**"]);
    expect(result).toHaveLength(3);
    expect(result.find((c) => c.name === "ContentProse")).toBeUndefined();
  });

  it("should support glob patterns", () => {
    const result = filterComponents(components, [], ["Awesome*"]);
    expect(result).toHaveLength(3);
    expect(result.find((c) => c.name === "AwesomeButton")).toBeUndefined();
  });

  it("should handle include whitelist", () => {
    const result = filterComponents(components, ["Content*"]);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.name)).toEqual(["ContentProse", "ContentList"]);
  });

  it("should handle mixed include/exclude", () => {
    // Include all Content*, but exclude specifically ContentProse
    const result = filterComponents(
      components,
      ["Content*"],
      ["content/prose/**"],
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toEqual("ContentList");
  });
});
