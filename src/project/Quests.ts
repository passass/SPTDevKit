import { useDataStore } from "@/stores/dataStore";
import { RecordSchema } from "@/types/fields/fields";
import { availableLocales, gameLocalization, suffixes, type locales } from "@/types/localization";
import { Path } from "@/utils/pathUtils";
import { currentProjectTag } from "./Project";

interface ProjectArgs {
    folderPath: Path;
    tags: string[];
    notLoadImmediately?: boolean;
}

function toJsonObject(obj: any): any {
    if (obj instanceof Map) {
        const result: Record<string, any> = {};
        for (const [key, value] of obj.entries()) {
            result[key] = toJsonObject(value);
        }
        return result;
    } else if (obj instanceof RecordSchema) {
        return obj.toJSON();
    } else if (Array.isArray(obj)) {
        return obj.map((v) => toJsonObject(v));
    } else if (obj && typeof obj === "object") {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value instanceof Map) {
                result[key] = toJsonObject(value);
            } else if (Array.isArray(value) && value.some((v) => v instanceof RecordSchema)) {
                result[key] = value.map((v) => (v instanceof RecordSchema ? v.toJSON() : v));
            } else {
                result[key] = value;
            }
        }
        return result;
    }
    return obj;
}

class Quests {
    async loadQuests(projectArgs: ProjectArgs) {
        const dataStore = useDataStore();
		const filesFound = await new Path(projectArgs.folderPath, "db/*/*/?uests/*.json").findFiles();
        for (const filepath of filesFound) {
            dataStore.addFileToStore("quests", {
                filename: filepath.filePath,
                tags: projectArgs.tags,
            });
        }
        if (!projectArgs.notLoadImmediately) await dataStore.load("quests");
    }

    getProjectQuests(): Map<string, RecordSchema> {
        const dataStore = useDataStore()
        return dataStore.getByTagInStore("quests", currentProjectTag);
    }

    getProjectQuestsFilteredByTraders(): Map<string, Map<string, RecordSchema>> {
        const res = new Map<string, Map<string, RecordSchema>>();
        for (const [key, value] of this.getProjectQuests().entries()) {
            const traderId = value.get("traderId") as string;
            if (!res.has(traderId)) res.set(traderId, new Map());
            res.get(traderId)!.set(key, value);
        }
        return res;
    }

    async saveProjectQuests(currentProjectFolder: Path) {
        const quests = toJsonObject(this.getProjectQuests());
        for (const [traderId, quests] of this.getProjectQuestsFilteredByTraders().entries()) {
            window.electronAPI.writeJson(
                new Path(currentProjectFolder, `db/CustomQuests/${traderId}/Quests/quest.json`).filePath,
                JSON.stringify(toJsonObject(quests), null, 2)
            );
        }
    }

	async saveLocales(currentProjectFolder: Path) {
		for (const [traderId, quests] of this.getProjectQuestsFilteredByTraders().entries()) {
            let localizationFields: string[] = [];
			for (const [questId, quest] of quests.entries()) {
                localizationFields = [...localizationFields, ...quest.getLocalizationFieldsKeys()];
            }
            for (const locale of availableLocales) {
                const localizationsMap: Map<string, string> = new Map();
                for (const localeId of localizationFields) {
                    localizationsMap.set(
                        localeId,
                        gameLocalization.getText({
                            localeId: localeId,
                            locale: locale as locales,
                            notCheckForDefaultLocalization: true,
                        })
                    );
                }
                if (localizationsMap.size > 0) {
                    const path = new Path(currentProjectFolder, `db/CustomQuests/${traderId}/Locales/${locale}.json`);
                    window.electronAPI.writeJson(
                        path.filePath,
                        JSON.stringify(toJsonObject(localizationsMap), null, 2)
                    );
                }
            }
        }
    }

	async saveProject(currentProjectFolder: Path) {
        await Promise.all([this.saveProjectQuests(currentProjectFolder), this.saveLocales(currentProjectFolder)]);
    }
}

export default new Quests();
