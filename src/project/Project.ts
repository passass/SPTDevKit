import { useDataStore } from "@/stores/dataStore";
import { useFileDataStore } from "@/stores/fileStore";
import Traders from "./Traders";
import { availableLocales, gameLocalization, suffixes, type locales } from "@/types/localization";
import { Path, PathArray } from "@/utils/pathUtils";
import type path from "path";
import { isElectron } from "@/utils/utils";
import { RecordSchema } from "@/types/fields/fields";
import { SchemaChoicer } from "@/types/fields/fieldsSchemaChoicer";

export const currentProjectTag = "currentProject";
export const modTag = "mod";

export function toJsonObject(data: any): any {
    if (data === null) return null;

    if (data instanceof RecordSchema) {
        return toJsonObject(data.data);
    } else if (data instanceof SchemaChoicer) {
        throw new Error("SchemaChoicer not implemented to json object");
    } else if (Array.isArray(data)) {
        return data.map((el) => toJsonObject(el));
    } else if (data instanceof Map) {
        const result: Record<any, any> = {};
        for (const [key, value] of data.entries()) {
            result[key] = toJsonObject(value);
        }
        return result;
    } else if (typeof data === "object") {
        const result: Record<any, any> = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = toJsonObject(value);
        }
        return result;
    } else {
        return data;
    }
}

export type ProjectArgs = {
    folderPath: Path;
    notLoadImmediately?: boolean;
    tags: string[];
};

class Project {
    dataStore: ReturnType<typeof useDataStore> | null = null;
    EFTFolder?: Path;
    currentProjectFolder?: Path;

    async loadLocale(projectArgs: ProjectArgs) {
        const customQuestsPath = new Path(projectArgs.folderPath, "db/CustomQuests");

        const storeIds: Set<string> = new Set();

        for (const traderQuestPath of await customQuestsPath.findFolders("*")) {
            const traderId = customQuestsPath.relative(traderQuestPath);
            const localesFolderPath = new Path(traderQuestPath, "Locales");

            for (const locale of availableLocales) {
                const localeFilePath = localesFolderPath.join(`${locale}.json`);
                if (await localeFilePath.exists()) {
                    const storeId = `${locale}${suffixes.localizationSuffix}`;
                    storeIds.add(storeId);
                    this.dataStore?.addFileToStore(storeId, {
                        filename: localeFilePath.toString(),
                        tags: [...projectArgs.tags, "locales", traderId.basename()],
                    });
                }
            }
        }

        const localeFiles = await new Path(projectArgs.folderPath, "db/CustomLocales/*.json").findFiles();
        for (const localeFilePath of localeFiles) {
            const locale = localeFilePath.stem();
            if (!availableLocales.includes(locale)) continue;

            const storeId = `${locale}${suffixes.localizationSuffix}`;
            storeIds.add(storeId);
            this.dataStore?.addFileToStore(storeId, {
                filename: localeFilePath.toString(),
                tags: [currentProjectTag, "locales", locale],
            });
        }

        if (!projectArgs.notLoadImmediately) await this.dataStore?.loadMultiple(Array.from(storeIds.values()));
    }

    async loadTraders(projectArgs: ProjectArgs) {
        await new PathArray(["data/base.json", "db/base.json"], projectArgs.folderPath).forEach((filePath) => {
            Traders.loadAdditionalTrader(filePath.toString(), projectArgs.tags);
        });

        if (!projectArgs.notLoadImmediately) await this.dataStore?.load("traders");
    }

    async loadQuests(projectArgs: ProjectArgs) {
        const filesFound = await new Path(projectArgs.folderPath, "db/*/*/?uests/*.json").findFiles();
        if (new Path(projectArgs.folderPath).stem() === "Lotus") {
            console.log(new Path(projectArgs.folderPath, "db/*/*/?uests/*.json"), filesFound);
        }

        for (const filepath of filesFound) {
            this.dataStore?.addFileToStore("quests", {
                filename: filepath.filePath,
                tags: projectArgs.tags,
            });
        }
        if (!projectArgs.notLoadImmediately) await this.dataStore?.load("quests");
    }

    async loadSPTFolder(projectArgs: ProjectArgs) {
        await Promise.all([this.loadQuests(projectArgs), this.loadTraders(projectArgs), this.loadLocale(projectArgs)]);
    }

    async loadProject(folderPath: Path) {
        this.currentProjectFolder = folderPath;

        await this.loadSPTFolder({
            folderPath: folderPath,
            tags: [currentProjectTag],
        });
    }

    async loadEFTMods(folderPath: Path) {
        this.EFTFolder = folderPath;

        for (const folderPath of await new Path(this.EFTFolder, "*/user/mods/*").findFolders()) {
            await this.loadSPTFolder({
                folderPath: folderPath,
                tags: ["mod"],
                notLoadImmediately: true,
            });
        }

        await Promise.all([
            this.dataStore?.load("quests"),
            async () => {
                for (const locale of availableLocales)
                    for (const suffix of Object.values(suffixes)) this.dataStore?.load(`${locale}${suffix}`);
            },
            this.dataStore?.load("traders"),
        ]);
    }

    async init() {
        await Traders.load();
        if (!isElectron()) return;
        this.dataStore ??= useDataStore();
        const savedEftPath = localStorage.getItem("eftFolderPath");
        if (savedEftPath) {
            await this.loadEFTMods(new Path(savedEftPath));
        }
    }

    getProjectQuests(): Map<string, RecordSchema> {
        if (!this.dataStore) return new Map();
        return this.dataStore.getByTagInStore("quests", currentProjectTag);
    }

    getProjectQuestsFilteredByTraders(): Map<string, Map<string, RecordSchema>> {
        if (!this.dataStore) return new Map();
        const res: Map<string, Map<string, RecordSchema>> = new Map();
        const traderIds: string[] = Array.from(this.dataStore.getMap("traders").keys());
        const projectQuests = this.getProjectQuests();

        for (const traderId of traderIds) {
            const filteredMap: Map<string, RecordSchema> = new Map();
            for (const [key, value] of projectQuests.entries()) {
                if (value.get("traderId") === traderId) {
                    filteredMap.set(key, value);
                }
            }
            if (filteredMap.size > 0) res.set(traderId, filteredMap);
        }
        return res;
    }

    async saveProjectQuests() {
        if (!this.dataStore || !this.currentProjectFolder) return;

        const quests = toJsonObject(this.getProjectQuests());

        for (const [traderId, quests] of this.getProjectQuestsFilteredByTraders().entries()) {
            window.electronAPI.writeJson(
                new Path(this.currentProjectFolder, `db/CustomQuests/${traderId}/Quests/quest.json`).filePath,
                JSON.stringify(toJsonObject(quests), null, 2)
            );
        }
    }

    async saveLocales() {
		if (!this.dataStore || !this.currentProjectFolder) return;

		for (const [traderId, quests] of this.getProjectQuestsFilteredByTraders().entries()) {
            let localizationFields: string[] = [];
            for (const [questId, quest] of quests.entries()) {
                localizationFields = [...localizationFields, ...quest.getLocalizationFieldsKeys()];
            }

            for (const locale of availableLocales) {
                const localizationsMap: Map<string, string> = new Map();
				for (const localeId of localizationFields) {
					localizationsMap.set(localeId, gameLocalization.getText({
						localeId: localeId,
						locale: locale as locales,
						notCheckForDefaultLocalization: true,
						default: localeId as string
					}))
				}

                if (localizationsMap.size > 0) {
               		const path = new Path(this.currentProjectFolder, `db/CustomQuests/${traderId}/Locales/${locale}.json`);
                    window.electronAPI.writeJson(
                        path.filePath,
                        JSON.stringify(toJsonObject(localizationsMap), null, 2)
                    );
                }
            }
        }
    }

    async saveProject() {
        await Promise.all([this.saveProjectQuests(), this.saveLocales()]);
    }

    isOpened() {
        return !!this.currentProjectFolder;
    }

    constructor() {}
}

export default new Project();
