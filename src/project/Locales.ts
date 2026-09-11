import type { RecordSchema } from "@/types/fields/fields";
import { getAllLocalizationKeys } from "@/utils/copyUtils";
import { availableLocales, gameLocalization, type locales } from "@/types/localization";
import { currentProjectTag, modTag, type ProjectArgs } from "../consts/ProjectConsts";
import { useDataStore } from "@/stores/dataStore";
import { Path } from "@/utils/pathUtils";
import { suffixes } from "@/types/localization";

export default new class Locales {
	async loadFromMod(projectArgs: ProjectArgs) {
		const dataStore = useDataStore();

		// загрузка локализации из квестов
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
                    dataStore?.addFileToStore(storeId, {
                        filename: localeFilePath.toString(),
                        tags: [...projectArgs.tags, "locales", traderId.basename()],
                    });
                }
            }
		}

		// загрузка кастомной общей локализации
        const localeFiles = await new Path(projectArgs.folderPath, "db/CustomLocales/*.json").findFiles();
        for (const localeFilePath of localeFiles) {
            const locale = localeFilePath.stem();
            if (!availableLocales.includes(locale)) continue;
            const storeId = `${locale}${suffixes.localizationSuffix}`;
            storeIds.add(storeId);
            dataStore?.addFileToStore(storeId, {
                filename: localeFilePath.toString(),
                tags: [currentProjectTag, "locales", locale],
            });
        }
        if (!projectArgs.notLoadImmediately) await dataStore?.loadMultiple(Array.from(storeIds.values()));
    }

	getAllLocalesFor(storeId: string): Map<locales, Map<string, string>> {
		const dataStore = useDataStore()
		const res: Map<locales, Map<string, string>> = new Map();
		for (const locale of availableLocales) {
			res.set(locale as locales, new Map<string, string>());
			for (const [id, instance] of dataStore.getByTagInStore(storeId, currentProjectTag).entries()) {
				for (const localeId of getAllLocalizationKeys(instance.data)) {
					res.get(locale as locales)!.set(
						localeId,
						gameLocalization.getText({
							localeId: localeId,
							locale: locale as locales,
							notCheckForDefaultLocalization: true,
						})
					);
				}
			}
		}
		return res;
	}
}
