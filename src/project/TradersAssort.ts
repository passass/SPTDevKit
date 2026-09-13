import { TradersAssortSchema } from "@/types/schemas/tradersAssort";
import { type ProjectArgs } from "@/consts/ProjectConsts";
import { dataStore } from "@/stores/dataStore";
import type { RecordSchema } from "@/types/fields/fields";
import { Path } from "@/utils/pathUtils";

export const assortDataStore = new dataStore("TraderAssort");

class TradersAssort {
    constructor() {}

    ensureStore() {
        if (!assortDataStore.isInited()) {
			assortDataStore.register({
				file: [],
				schemaType: TradersAssortSchema,
				isArray: true,
				onFileLoad: (content: any) => {
					const res: RecordSchema[] = [];
					for (const item of content.items ?? []) {
						res.push(TradersAssortSchema.from({
							"_id": item._id,
				            "_tpl": item._tpl,
				            "parentId": item.parentId,
				            "slotId": item.slotId,
				            "upd": {
				                "UnlimitedCount": item.upd?.UnlimitedCount,
				                "StackObjectsCount": item.upd?.StackObjectsCount,
				                "BuyRestrictionMax": item.upd?.BuyRestrictionMax,
				                "BuyRestrictionCurrent": item.upd?.BuyRestrictionCurrent
							},

							"loyal_level_items": content.loyal_level_items[item._id],
							"barter_scheme": content.barter_scheme[item._id],
						}))
					}
					return res;
				},
			});
        }
    }

    async loadFromMod(projectArgs: ProjectArgs) {
		this.ensureStore();
		for (const filePath of await new Path(projectArgs.folderPath, "db/CustomAssortSchemes/*.json").findFiles())
			assortDataStore.addFileToStore({filename: filePath.toString(), tags: projectArgs.tags})
    }

    getTradersAssort(): RecordSchema {
        return new TradersAssortSchema({});
    }
}

export default new TradersAssort();
