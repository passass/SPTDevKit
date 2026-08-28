import { useDataStore } from "@/stores/dataStore";
import { FileConfig } from "@/stores/fileStore.ts";
import { idsFields, RecordSchema } from "./fields/fields";
import { ref, type Ref } from "vue";

export const availableLocales: Array<string> = ["ru", "en"];
export type locales = "ru" | "en";

export const stringOrEmptyString = (value: string | null | undefined): string =>
	typeof value === "string" ? value : "";
export const choiceStrings = (
	...args: Array<string | null | undefined>
): string => {
	for (const substr of args) {
		if (typeof substr === "string" && substr !== "") return substr;
	}
	return "";
};

export const suffixes: Record<string, string> = {
	localizationSuffix: "_localization",
	uiLocalizationSuffix: "_ui_localization",
};

export interface localizationTextParams {
	localeId: string | string[];
	suffixKey?: keyof typeof suffixes;
	default?: string;
	locale?: locales;
	notCheckForDefaultLocalization?: boolean;
}

export class GameLocalization {
	locales: Map<string, FileConfig<Record<string, string>>> = new Map();
	currentLocale: Ref<locales> = ref('ru');
	dataStore: ReturnType<typeof useDataStore> | null = null;

	getObjectLocalization(config: {
		instance: any;
		locale?: locales;
		localeId?: string[]
	}): string {
		let def: any = undefined
		let itemId = ``
		if (typeof config.instance === "object") {
			const data = (config.instance instanceof RecordSchema) ? config.instance.data : config.instance 
			if (config.instance?.storeId === "traders" && data.nickname) {
				def = data.nickname
			}

			if (config.instance instanceof RecordSchema) {
				itemId = config.instance.getId() ?? itemId
			} else {
				itemId = data[idsFields.filter((id) => id in data)[0]]
			}
		}

		return gameLocalization.getText({
			localeId: config.localeId ?? [
				`${itemId} Name`,
				`${itemId} name`,
				`${itemId}`,
				`${itemId} Nickname`,
			],
			locale: config.locale ?? this.currentLocale.value,
			default: def,
		});
	}

	loadLocales() {
		this.dataStore = useDataStore();
		for (const locale of availableLocales) {
			for (const suffix of Object.values(suffixes)) {
				this.dataStore.register(`${locale}${suffix}`, {
					file: {
						filename: `${locale}${suffix}.json`,
					},
				});
			}
		}
	}

	updateLocaleText(params: localizationTextParams, newText: string) {
		if (Array.isArray(params.localeId)) {
			for (const _localeId of params.localeId) {
				const newLocalizationTextParams: localizationTextParams = {
					...params,
				};
				newLocalizationTextParams.localeId = _localeId;

				this.updateLocaleText(newLocalizationTextParams, newText);
			}
			return;
		}

		const suffix = suffixes[params.suffixKey ?? "localizationSuffix"];
		this.dataStore?.set(
			`${params.locale}${suffix}`,
			params.localeId,
			newText,
		);
	}

	getUIText = (params: localizationTextParams) =>
		this.getText({
			localeId: params.localeId,
			locale: params.locale,
			suffixKey: "uiLocalizationSuffix",
			default: params.default,
		});

	getText(params: localizationTextParams): string {
		let locale = params.locale ?? this.currentLocale.value;
		let suffixKey = params.suffixKey ?? "localizationSuffix";
		let localeId = params.localeId;

		if (typeof locale !== "string" || !availableLocales.includes(locale))
			locale = "en";

		const suffix = suffixes[suffixKey];

		if (Array.isArray(localeId)) {
			for (const _localeId of localeId) {
				const translated = this.dataStore?.safeGet<string>(
					[`${locale}${suffix}`, `en${suffix}`],
					_localeId,
				);
				if (translated) return translated;
			}
			return params.default ?? localeId[0];
		}

		const localizations = [`${locale}${suffix}`]
		
		if (!params.notCheckForDefaultLocalization)
			localizations.push(`en${suffix}`)

		const translated = this.dataStore?.safeGet<string>(
			localizations,
			localeId,
			params.default ?? localeId,
		);

		return translated ?? "";
	}
}

export const gameLocalization = new GameLocalization();
