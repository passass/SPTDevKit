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

export interface localizationTextParams {
	localeId: string | string[]
	locale?: locales
	suffixKey?: keyof typeof suffixes
	default?: string
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
			}
		}
	}

	updateLocaleText(params: localizationTextParams, newText: string) {
		if (Array.isArray(params.localeId)) {
			for (const _localeId of params.localeId) {
				const newLocalizationTextParams: localizationTextParams = {...params}
				newLocalizationTextParams.localeId = _localeId
				
				this.updateLocaleText(newLocalizationTextParams, newText)
			}
			return
		}

		const suffix = suffixes[params.suffixKey ?? "localizationSuffix"]
		this.dataStore?.set(
			`${params.locale}${suffix}`
			, params.localeId
			, newText
		);
	}

	getUIText = (
		localeId: string | string[]
		, locale?: locales
	) => this.getText({
		localeId: localeId
		, locale: locale
		, suffixKey: "uiLocalizationSuffix"
	})

	getText(params: localizationTextParams): string {
		let locale = params.locale
		let suffixKey = params.suffixKey ?? "localizationSuffix"
		let localeId = params.localeId

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

		const translated = this.dataStore?.safeGet<string>(
			[`${locale}${suffix}`, `en${suffix}`]
			, localeId
			, params.default ?? localeId
		)
		return translated ?? '';
	}
}

export const gameLocalization = new GameLocalization()