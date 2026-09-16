import { ItemAssort, TradersAssortSchema } from "@/types/schemas/tradersAssort";
import { currentProjectTag, type ProjectArgs } from "@/consts/ProjectConsts";
import { dataStore, type dataMapRecordType } from "@/stores/dataStore";
import { RecordSchema } from "@/types/fields/fields";
import { Path } from "@/utils/pathUtils";
import type { onFileLoadContext } from "@/consts/DataStoreConsts";
import { collectDescendants } from "@/utils/treeUtils";
import { computed, ref, type Ref } from "vue";
import { groupBy } from "@/utils/utils";

export const assortDataStore = new dataStore("TraderAssort");

type ITraderAssort = {
    items: Record<string, Record<string, any>>;
    barter_scheme: Record<string, Array<Array<Record<string, any>>>>;
    loyal_level_items: Record<string, number>;
};

const tradersMongoIdToUUID: Record<string, string> = {
    jaeger: "5c0647fdd443bc2504c2d371",
};

class TradersAssort {
    constructor() {}

    transferContentIntoSchemas(content: any, _traderId: string): ItemAssort[] {
        const res: ItemAssort[] = [];
        if (content === null || typeof content !== "object") return res;

        let traderId: string;
        if (_traderId in tradersMongoIdToUUID) {
            traderId = tradersMongoIdToUUID[_traderId];
        } else {
            traderId = _traderId;
        }

        if (!this.cachedAssortsData.value.has(traderId)) this.cachedAssortsData.value.set(traderId, new Map());
        for (const item of content.items ?? []) {
            if (item.parentId !== "hideout") continue;
            const schema = ItemAssort.from({
                _id: item._id,
                _tpl: item._tpl,
                parentId: item.parentId,
                slotId: item.slotId,
                upd: {
                    UnlimitedCount: item.upd?.UnlimitedCount,
                    StackObjectsCount: item.upd?.StackObjectsCount,
                    BuyRestrictionMax: item.upd?.BuyRestrictionMax,
                    BuyRestrictionCurrent: item.upd?.BuyRestrictionCurrent,
                },

                children: collectDescendants(content.items, item._id),
                traderId: traderId,
                loyal_level_items: content.loyal_level_items[item._id],
                barter_scheme: content.barter_scheme[item._id],
            });
            this.cachedAssortsData.value.get(traderId)!.set(item._id, schema);
            res.push(schema);
        }

        return res;
    }

    addNewAssorts(content: any, traderId?: string, tags?: string[]): ItemAssort[] {
        if (typeof content !== "object" || content === null) return [];

        const isSingleTrader = "items" in content && "barter_scheme" in content && "loyal_level_items" in content;

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
                    return this.addNewAssorts(ctx.content.data, undefined, ctx.tags);
                },
                onStoreClear: (data: dataMapRecordType[] | Map<string | number, dataMapRecordType>) => {
                    this.cachedAssortsData.value.clear();
                },
            });
        }
    }

    async loadFromMod(projectArgs: ProjectArgs) {
        for (const filePath of await new Path(projectArgs.folderPath, "db/CustomAssortSchemes/*.json").findFiles())
            assortDataStore.addFileToStore({ filename: filePath.toString(), tags: projectArgs.tags ?? [] });

        if (!projectArgs.notLoadImmediately) await assortDataStore.load();
    }

    async asyncInit() {
        this.ensureStore();
        const files = [];
        for (const filepath of await new Path(
            await window.electronAPI.getDataDir(),
            "traders/*/assort.json"
        ).findFiles()) {
            const traderId = filepath.dirname().basename();
            assortDataStore.addFileToStore({
                filename: filepath.toString(),
                tags: ["vanilla", `trader_${traderId}`],
            });
        }

        await assortDataStore.load();
    }

    async saveProject(projectArgs: ProjectArgs) {
        const groupedByTraders: Map<string | number, Map<string | number, dataMapRecordType>> = groupBy(
            assortDataStore.getByTagInStore(currentProjectTag),
            (el) => (el && el.data && el.data instanceof RecordSchema && (el.data.get("traderId") as string)) || null
        );

        const res = new Map<string, ITraderAssort>();

        for (const [traderId, records] of groupedByTraders.entries()) {
            const traderAssorts: ITraderAssort = {
                items: {},
                barter_scheme: {},
                loyal_level_items: {},
            };
            res.set(String(traderId), traderAssorts);

            for (const [id, record] of records.entries()) {
                const assort = record.data;
				if (!(assort instanceof RecordSchema)) continue;
				const recordId = String(assort.getId())

                traderAssorts.items[recordId] = assort.toJSON();
				const children = assort.get("children");
                if (Array.isArray(children))
					for (const assortChildren of children) {
						if (typeof assortChildren !== "object" || assortChildren === null) continue;
						const id = assortChildren instanceof RecordSchema ? assortChildren.getId() : ((assortChildren as any)["_id"] ?? (assortChildren as any)["id"])
						if (id)
							traderAssorts.items[id] = assortChildren instanceof RecordSchema ? assortChildren.toJSON() : assortChildren;
                    }

				const barter_scheme = assort.get("barter_scheme")
                if (barter_scheme && typeof barter_scheme === "object" && Array.isArray(barter_scheme))
                	(traderAssorts.barter_scheme as any)[recordId] = barter_scheme

				const loyal_level_items = assort.get("loyal_level_items")
				if (typeof loyal_level_items === "number") {
					traderAssorts.loyal_level_items[recordId] = loyal_level_items
                }
			}

			res.set(String(traderId), traderAssorts)
		}

		await new Path(projectArgs.folderPath, "db/CustomAssortSchemes/assort.json").saveFile(res)
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
