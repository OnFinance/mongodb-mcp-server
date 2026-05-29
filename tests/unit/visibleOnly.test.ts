import { describe, expect, it } from "vitest";
import type { UserConfig } from "../../src/common/config/userConfig.js";
import { withVisibleFilter, withVisiblePipeline } from "../../src/helpers/visibleOnly.js";

const baseConfig = {
    visibleOnly: true,
    visibleField: "visible",
} as UserConfig;

describe("visibleOnly helpers", () => {
    it("adds visible:true to empty filters", () => {
        expect(withVisibleFilter(baseConfig, undefined)).toEqual({ visible: true });
        expect(withVisibleFilter(baseConfig, {})).toEqual({ visible: true });
    });

    it("combines visible:true with caller filters", () => {
        expect(withVisibleFilter(baseConfig, { status: "open" })).toEqual({
            $and: [{ visible: true }, { status: "open" }],
        });
    });

    it("prepends a visible match to ordinary aggregation pipelines", () => {
        expect(withVisiblePipeline(baseConfig, [{ $group: { _id: "$status" } }])).toEqual([
            { $match: { visible: true } },
            { $group: { _id: "$status" } },
        ]);
    });

    it("keeps search-like required first stages first", () => {
        expect(withVisiblePipeline(baseConfig, [{ $search: { text: { query: "risk", path: "title" } } }])).toEqual([
            { $search: { text: { query: "risk", path: "title" } } },
            { $match: { visible: true } },
        ]);
    });

    it("does nothing when visibleOnly is disabled", () => {
        const config = { ...baseConfig, visibleOnly: false } as UserConfig;
        const filter = { status: "open" };
        const pipeline = [{ $group: { _id: "$status" } }];
        expect(withVisibleFilter(config, filter)).toBe(filter);
        expect(withVisiblePipeline(config, pipeline)).toBe(pipeline);
    });
});
