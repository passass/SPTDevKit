import { useDataStore } from "@/stores/dataStore";
import { FileConfig } from "@/stores/fileStore.ts";

export type locales = 'ru' | 'en';

export const availableLocales: Array<string> = ['ru', 'en']

export const stringOrEmptyString = (value: string | null | undefined): string => (typeof value === "string" ? value : "")
export const choiceStrings = (...args: Array<string | null | undefined>): string => {
	for (const substr of args) {
		if (typeof substr === "string" && substr !== '')
			return substr
	}
	return ""
}

export const suffixes: Record<string, string> = {
	localizationSuffix: '_localization',
	uiLocalizationSuffix: '_ui_localization',
}

export class GameLocalization {
	locales: Map<string, FileConfig<Record<string, string>>> = new Map()
	dataStore: ReturnType<typeof useDataStore> | null = null

	loadLocales() {
		this.dataStore = useDataStore()
		for (const locale of availableLocales) {
			for (const suffix of Object.values(suffixes)) {
				this.dataStore.register(`${locale}${suffix}`, {
					filename: `${locale}${suffix}.json`
				})
				console.log('load file', `${locale}${suffix}.json`)
			}
		}
		
	}

	getUIText = (
		localeId: string | string[]
		, locale?: locales
	) => this.getText(
		localeId
		, locale
		, "uiLocalizationSuffix"
	)

	getText(
		localeId: string | string[]
		, locale?: locales
		, suffixKey: keyof typeof suffixes = "localizationSuffix"
	): string {
		
		if (typeof locale !== 'string' || !availableLocales.includes(locale))
			locale = 'en'

		const suffix = suffixes[suffixKey]

		if (Array.isArray(localeId)) {
			for (const _localeId of localeId) {
				const translated = this.dataStore?.safeGet<string>(
					[`${locale}${suffix}`, `en${suffix}`]
					, _localeId
				)
				if (translated)
					return translated;
			}
			return localeId[0]
		}

		console.log("check for", `${locale}${suffix}`)
		const translated = this.dataStore?.safeGet<string>(
			[`${locale}${suffix}`, `en${suffix}`]
			, localeId
			, localeId
		)
		return translated ?? '';
	}
}

export const gameLocalization = new GameLocalization()