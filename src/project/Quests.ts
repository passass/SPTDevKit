import { dataStore, useDataStore } from "@/stores/dataStore";
import { RecordSchema } from "@/types/fields/fields";
import { availableLocales, gameLocalization, suffixes, type locales } from "@/types/localization";
import { Path } from "@/utils/pathUtils";
import { currentProjectTag, modTag, type ProjectArgs } from "../consts/ProjectConsts";
import { copyRecordSchema } from "@/utils/copyUtils";
import { deepClone, getValuesByPath, groupBy, toJsonObject } from "@/utils/utils";
import { customRef } from "vue";

export const questDataStore = new dataStore("quests");

class Quests {
    async loadFromMod(projectArgs: ProjectArgs) {
        const filesFound = await new Path(projectArgs.folderPath, "db/*/*/?uests/*.json").findFiles();
        for (const filepath of filesFound) {
            questDataStore.addFileToStore({
                filename: filepath.filePath,
                tags: projectArgs.tags ?? [],
            });
        }
        if (!projectArgs.notLoadImmediately) await questDataStore.load();
    }

    getProjectQuests(): Map<string, RecordSchema> {
        const res = new Map();
        for (const [questId, quest] of questDataStore.getByTagInStore(currentProjectTag).entries()) {
            res.set(questId, quest.data);
        }
        return res;
    }

    getProjectQuestsFilteredByTraders(): Map<string | number, Map<string | number, RecordSchema>> {
        return groupBy(
            this.getProjectQuests(),
            (quest) => (quest && quest instanceof RecordSchema && (quest.get("traderId") as string)) || null
        );
    }

    async saveProjectQuests(projectArgs: ProjectArgs) {
        const dirtiesQuests = questDataStore.getAllDirties();

        const groupedDirtiesQuests = groupBy(dirtiesQuests, (quest) => quest.data.get("traderId") as string);

        for (const [traderId, quests] of this.getProjectQuestsFilteredByTraders().entries()) {
            if (projectArgs.saveWithOriginalChanges) {
                const groupedDirtiesQuestsByTrader = groupedDirtiesQuests.get(traderId);
                if (groupedDirtiesQuestsByTrader)
                    for (const [questId, quest] of groupedDirtiesQuestsByTrader.entries()) {
                        if (!(quest.data instanceof RecordSchema)) continue;
                        quests.set(questId, quest.data);
                    }
                groupedDirtiesQuests.delete(traderId);
            }
			await new Path(projectArgs.folderPath, `db/CustomQuests/${traderId}/Quests/quest.json`).saveFile(quests);
            await this.saveQuestAssorts(quests, new Path(projectArgs.folderPath, `db/CustomQuests/${traderId}/QuestAssort/assort.json`))
        }

        if (projectArgs.saveWithOriginalChanges) {
            for (const [traderId, quests] of groupedDirtiesQuests.entries()) {
                const res = new Map();
                for (const [questId, quest] of quests.entries()) {
                    res.set(questId, quest.data);
                }
                await new Path(projectArgs.folderPath, `db/CustomQuests/${traderId}/Quests/quest.json`).saveFile(res);
                await this.saveQuestAssorts(res, new Path(projectArgs.folderPath, `db/CustomQuests/${traderId}/QuestAssort/assort.json`))
            }
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

    async saveQuestAssorts(quests: Map<any, any>, filePath: Path) {
        const result: {
            started: Record<string, string>;
            success: Record<string, string>;
            fail: Record<string, string>;
        } = {
            started: {},
            success: {},
            fail: {},
        };

        const processRewards = (
            rewards: any,
            category: "started" | "success" | "fail",
            questId: string
        ): void => {
            if (!Array.isArray(rewards)) return;
            for (const reward of rewards) {
                if (!reward || typeof reward !== "object") continue;
                if (reward.type !== "AssortmentUnlock") continue;

                const assortmentId =
                    reward.target ?? reward.items?.[0]?._id;
                if (typeof assortmentId === "string" && assortmentId !== "") {
                    result[category][assortmentId] = questId;
                }
            }
        };

        for (const [questId, quest] of quests.entries()) {
            const record = quest instanceof RecordSchema ? quest : (quest as any)?.data;
            if (!(record instanceof RecordSchema)) continue;

            const rewards = record.get("rewards");
            if (!rewards || typeof rewards !== "object") continue;

            processRewards((rewards as any).Success, "success", String(questId));
            processRewards((rewards as any).Started, "started", String(questId));
            processRewards((rewards as any).Fail, "fail", String(questId));
        }

        await filePath.saveFile(result);
    }

    async saveProject(projectArgs: ProjectArgs) {
        await Promise.all([
            this.saveProjectQuests(projectArgs),
            this.saveLocales(projectArgs.folderPath),
        ]);
    }

    copy(data: RecordSchema): RecordSchema {
        return copyRecordSchema(data, currentProjectTag);
    }

    clearProject() {
        const questsMap = questDataStore.getMap();
        for (const questId of questDataStore.getByTagInStore(currentProjectTag).keys()) {
            questsMap.delete(questId);
        }

        const config = questDataStore.config;
        if (config) {
            if (!Array.isArray(config.file)) {
                config.file = [config.file];
            }

            config.file = config.file.filter((file) => !file.tags?.includes(currentProjectTag));
        }
    }
}

export default new Quests();
