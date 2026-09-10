import { useDataStore } from "@/stores/dataStore";
import { RecordSchema } from "@/types/fields/fields";
import { availableLocales, gameLocalization, suffixes, type locales } from "@/types/localization";
import { Path } from "@/utils/pathUtils";
import { currentProjectTag, modTag, type ProjectArgs } from "./ProjectConsts";
import { copyRecordSchema } from "@/utils/copyUtils";
import { toJsonObject } from "@/utils/utils";

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
        const dataStore = useDataStore();
        const res = new Map();
        for (const [questId, quest] of dataStore.getByTagInStore("quests", currentProjectTag).entries()) {
            res.set(questId, quest.data);
        }
        return res;
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
					console.log("localization save", localeId, gameLocalization.getText({
                        localeId: localeId,
                        locale: locale as locales,
                        notCheckForDefaultLocalization: true,
                    }))
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

    copyQuest(data: RecordSchema): RecordSchema {
	    return copyRecordSchema(data, currentProjectTag);
    }
}

export default new Quests();
