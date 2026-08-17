import { useDataStore } from "@/stores/dataStore";
import { FileConfig, useFileDataStore } from "@/stores/fileStore.ts";

export type locales = 'ru' | 'en';

export const availableLocales: Array<string> = ['ru', 'en']
export const localeFiles: Map<string, string> = new Map()
for (const locale of availableLocales) {
	localeFiles.set(locale, `${locale}_localization.json`)
}

export const stringOrEmptyString = (value: string | null | undefined): string => (typeof value === "string" ? value : "")
export const choiceStrings = (...args: Array<string | null | undefined>): string => {
	for (const substr of args) {
		if (typeof substr === "string" && substr !== '')
			return substr
	}
	return ""
}

export class GameLocalization {
	locales: Map<string, FileConfig<Record<string, string>>> = new Map()
	dataStore: ReturnType<typeof useDataStore> | null = null

	loadLocales() {
		this.dataStore = useDataStore()
		for (const [locale, filename] of localeFiles.entries()) {
			this.dataStore.register(`${locale}_localization`, {
				filename: filename
			})
		}
		
	}

	getText(localeId: string, locale: locales): string;
	getText(localeId: string): string;
	getText(localeId: string[], locale: locales): string;
	getText(localeId: string[]): string;

	getText(localeId: string | string[], locale?: locales): string {
		if (typeof locale !== 'string' || !availableLocales.includes(locale))
			locale = 'en'

		if (Array.isArray(localeId)) {
			for (const _localeId of localeId) {
				const translated = this.dataStore?.safeGet<string>(
					[`${locale}_localization`, `en_localization`]
					, _localeId
				)
				if (translated)
					return translated;
			}
			return localeId[0]
		}

		const translated = this.dataStore?.safeGet<string>(
			[`${locale}_localization`, `en_localization`]
			, localeId
			, localeId
		)
		return translated ?? '';
	}
}

export const gameLocalization = new GameLocalization()