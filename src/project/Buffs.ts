import type { onFileLoadContext } from "@/consts/DataStoreConsts";
import { currentProjectTag, modTag, vanillaTag, type ProjectArgs } from "@/consts/ProjectConsts";
import { dataStore } from "@/stores/dataStore";
import { useFileDataStore } from "@/stores/fileStore";
import { RecordSchema } from "@/types/fields/fields";
import { BuffsSchema } from "@/types/schemas/buffs";
import { Path } from "@/utils/pathUtils";
import { getValueByPath } from "@/utils/utils";

export const buffsDataStore = new dataStore("buffs");

class Buffs {
    ensureStore() {
        if (!buffsDataStore.isInited()) {
            buffsDataStore.register({
                file: [],
                schemaType: BuffsSchema,
                isArray: true,
                onFileLoad: (ctx: onFileLoadContext) => {
                    const res: RecordSchema[] = [];

                    let buffsObject;
                    if (new Path(ctx.content.filename).name() === "globals.json") {
                        buffsObject = getValueByPath(ctx.content.data, "config.Health.Effects.Stimulator.Buffs");
                    } else {
                        buffsObject = ctx.content.data;
                    }

                    for (const [buffId, buffs] of Object.entries(buffsObject)) {
                        res.push(
                            BuffsSchema.from({
                                id: buffId,
                                buffs,
                            })
                        );
                    }

                    return res;
                },
            });
        }
	}

	async loadFromMod(projectArgs: ProjectArgs) {
		for (const filePath of await projectArgs.folderPath.join("db/CustomBuffs/*.json*").findFiles()) {
			buffsDataStore.addFileToStore({ filename: filePath.toString(), tags: [modTag] });
		}

		if (!projectArgs.notLoadImmediately) await buffsDataStore.load();
	}

	async loadFromEFT(EFTFolder: Path) {
        const globalsPath = EFTFolder.join("SPT/SPT_Data/database/globals.json");
		buffsDataStore.addFileToStore({ filename: globalsPath.toString(), tags: [vanillaTag] });
        await buffsDataStore.load();
    }

    async saveProject(projectArgs: ProjectArgs) {
        await window.electronAPI.removeFolder(new Path(projectArgs.folderPath, "db/CustomBuffs").toString());

        const customBuffs = buffsDataStore.getByTagInStore(currentProjectTag);
        const res: Record<string, any> = {};

        for (const [, record] of customBuffs.entries()) {
            const schema = record.data;
            if (schema instanceof RecordSchema) {
                const buffId = schema.get("id") as string;
                if (!buffId) continue;

                const buffs = schema.get("buffs");
                if (Array.isArray(buffs)) {
                    res[buffId] = buffs.map(b => b instanceof RecordSchema ? b.toJSON() : b);
                } else {
                    res[buffId] = buffs;
                }
            }
        }

        await new Path(projectArgs.folderPath, "db/CustomBuffs/buffs.json").saveFile(res);
    }

	init() {
		this.ensureStore();
	}
}

export default new Buffs();
