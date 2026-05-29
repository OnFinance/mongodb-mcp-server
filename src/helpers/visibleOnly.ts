import type { Document } from "mongodb";
import type { UserConfig } from "../common/config/userConfig.js";

const FIRST_STAGE_OPERATORS = new Set(["$geoNear", "$search", "$searchMeta", "$vectorSearch"]);

export function withVisibleFilter(config: UserConfig, filter: Document | undefined): Document | undefined {
    if (!config.visibleOnly) {
        return filter;
    }

    const visibleFilter = { [config.visibleField]: true };
    if (!filter || Object.keys(filter).length === 0) {
        return visibleFilter;
    }

    return { $and: [visibleFilter, filter] };
}

export function withVisiblePipeline(config: UserConfig, pipeline: Document[]): Document[] {
    if (!config.visibleOnly) {
        return pipeline;
    }

    const visibleMatch = { $match: { [config.visibleField]: true } };
    if (pipeline.length === 0) {
        return [visibleMatch];
    }

    const firstStage = pipeline[0];
    if (!firstStage) {
        return [visibleMatch];
    }
    const rest = pipeline.slice(1);
    const firstStageOperator = Object.keys(firstStage)[0];
    if (firstStageOperator && FIRST_STAGE_OPERATORS.has(firstStageOperator)) {
        return [firstStage, visibleMatch, ...rest];
    }

    return [visibleMatch, ...pipeline];
}
