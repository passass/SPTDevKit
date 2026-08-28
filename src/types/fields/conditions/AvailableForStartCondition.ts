import { createLazySchemaChoicer } from "@/utils/lazySchemaLoader";

export const AvailableForStartCondition = createLazySchemaChoicer(
    "*.conditions.AvailableForStart",
    "AvailableForStartCondition"
);