import { ItemAssort, TradersAssortSchema } from "@/types/schemas/tradersAssort";
import { type ProjectArgs } from "@/consts/ProjectConsts";
import { dataStore, type dataMapRecordType } from "@/stores/dataStore";
import type { RecordSchema } from "@/types/fields/fields";
import { Path } from "@/utils/pathUtils";
import type { onFileLoadContext } from "@/consts/DataStoreConsts";
import { collectDescendants } from "@/utils/treeUtils";
import { computed, ref, type Ref } from "vue";

export const assortDataStore = new dataStore("TraderAssort");

const tradersMongoIdToUUID: Record<string, string> = {
	"jaeger": "5c0647fdd443bc2504c2d371"
}

class TradersAssort {
	constructor() { }

	transferContentIntoSchemas(content: any, _traderId: string): ItemAssort[] {

		const res: ItemAssort[] = [];
		if (content === null || typeof content !== "object") return res;

		let traderId: string;
		if (_traderId in tradersMongoIdToUUID) {
			traderId = tradersMongoIdToUUID[_traderId]
		} else {
			traderId = _traderId
		}

		if (!this.cachedAssortsData.value.has(traderId))
			this.cachedAssortsData.value.set(traderId, new Map());
		for (const item of content.items ?? []) {
			if (item.parentId !== "hideout") continue;
			const schema = ItemAssort.from({
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

				"children": collectDescendants(content.items, item._id),
				"traderId": traderId,
				"loyal_level_items": content.loyal_level_items[item._id],
				"barter_scheme": content.barter_scheme[item._id],
			})
			this.cachedAssortsData.value.get(traderId)!.set(item._id, schema)
			res.push(schema)
		}

		return res;
	}

	addNewAssorts(content: any, traderId?: string, tags?: string[]): ItemAssort[] {
	    if (typeof content !== "object" || content === null) return [];

	    const isSingleTrader =
	        "items" in content &&
	        "barter_scheme" in content &&
	        "loyal_level_items" in content;

	    if (!isSingleTrader) {
	        let res: ItemAssort[] = [];
	        for (const [resTraderId, barterSchemas] of Object.entries(content)) {
	            res = [...res, ...this.transferContentIntoSchemas(barterSchemas, resTraderId)];
	        }
	        return res;
	    }

	    let resTraderId = traderId;

	    if (!resTraderId && tags) {
	        for (const tag of tags) {
	            const match = tag.match(/^trader_(\w{24})$/);
	            if (match && match.length === 2) {
	                resTraderId = match[1];
	                break;
	            }
	        }
	    }

	    if (!resTraderId) {
	        console.warn("[TradersAssort] traderId не определён, файл пропущен");
	        return [];
	    }

	    return this.transferContentIntoSchemas(content, resTraderId);
	}

	// traderId -> assortId -> assort
	cachedAssortsData: Ref<Map<string, Map<string, ItemAssort>>> = ref(new Map());

    ensureStore() {
        if (!assortDataStore.isInited()) {
			assortDataStore.register({
				file: [],
				schemaType: ItemAssort,
				isArray: true,
				onFileLoad: (ctx: onFileLoadContext) => {
					return this.addNewAssorts(ctx.content.data, undefined, ctx.tags)
				},
				onStoreClear: (data: dataMapRecordType[] | Map<string | number, dataMapRecordType>) => {
					this.cachedAssortsData.value.clear()
				},
			});
        }
    }

    async loadFromMod(projectArgs: ProjectArgs) {
		for (const filePath of await new Path(projectArgs.folderPath, "db/CustomAssortSchemes/*.json").findFiles())
			assortDataStore.addFileToStore({filename: filePath.toString(), tags: projectArgs.tags ?? []})

		if (!projectArgs.notLoadImmediately) await assortDataStore.load();
	}

	async asyncInit() {
		this.ensureStore();
		const files = []
		for (const filepath of await new Path(
			await window.electronAPI.getDataDir(),
			"traders/*/assort.json",
		).findFiles()) {
			const traderId = filepath.dirname().basename()
			assortDataStore.addFileToStore({
				filename: filepath.toString(),
				tags: ["vanilla", `trader_${traderId}`]
			})
		}

		await assortDataStore.load()
	}

	getTradersAssort(): TradersAssortSchema {
	    const resData: { traders: Array<{ trader: string; items: ItemAssort[] }> } = { traders: [] };
	    for (const [traderId, assortsMap] of this.cachedAssortsData.value.entries()) {
	        resData.traders.push({
	            trader: traderId,
	            items: Array.from(assortsMap.values()),
	        });
	    }
	    return TradersAssortSchema.from(resData) as TradersAssortSchema;
	}
}

export default new TradersAssort();
