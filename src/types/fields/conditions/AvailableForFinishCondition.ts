import { createLazySchemaChoicer } from "@/utils/lazySchemaLoader";

export const AvailableForFinishCondition = createLazySchemaChoicer(
    "*.conditions.AvailableForFinish",
    "AvailableForFinishCondition"
);