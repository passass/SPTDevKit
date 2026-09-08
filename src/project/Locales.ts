import type { RecordSchema } from "@/types/fields/fields";
import { getAllLocalizationKeys } from "@/utils/copyUtils";
import { availableLocales, gameLocalization, type locales } from "@/types/localization";
import { currentProjectTag } from "@/project/Project";
import { useDataStore } from "@/stores/dataStore";

export default new class Locales {
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
