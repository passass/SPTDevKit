import LoadWeaponBuildInput from "@/components/inputs/LoadWeaponBuildInput.vue";
import LocalizationInput from "@/components/inputs/LocalizationInput.vue";
import AdvancedSelectInput from "@/components/inputs/AdvancedSelectInput.vue";
import CompareInput from "@/components/inputs/CompareInput.vue";
import ParentInput from "@/components/inputs/ParentInput.vue";
import OptionsInput from "@/components/inputs/OptionsInput.vue";
import ArrayInput from "@/components/inputs/ArrayInput.vue";
import { Field, type SchemaData } from "@/types/fields/fields";
import { type WeaponBuildItem } from "@/stores/profileStore";
import { type Component, h } from "vue";
import { gameLocalization } from "@/types/localization";
import { RecordSchema } from "@/types/fields/fields";

interface RenderRule {
    condition: (field: Field, recordSchema: RecordSchema) => boolean;
    component?: (field: Field, recordSchema: RecordSchema) => Component;
	componentTemplate?: Component | string;
    componentTemplateProps?: Record<string, any>;
}

function getObjectSummary(value: Record<string, any>): string {
    if (!value) return "{}";
    const keys = value instanceof RecordSchema ? Object.keys(value.data) : Object.keys(value);
    if (keys.length === 0) return "{}";

    // Берем первые 3 ключа и переводим их
    const previewKeys = keys.slice(0, 3);
    const translatedKeys = previewKeys.map((key) => {
        const translated = gameLocalization.getUIText({
            localeId: key,
            default: key,
        });
        return translated;
    });

    const preview = translatedKeys.join(", ");
    return keys.length > 3 ? `{ ${preview}... (${keys.length} полей) }` : `{ ${preview} }`;
}

const compareInputFields: string[] = ["compareMethod", "value"];
function isCompareInput(field: Field): boolean {
    return (
        field.nestedSchema &&
        (field.nestedSchema as any)?.fields?.length === 2 &&
        (field.nestedSchema as any)?.getFieldByKeyStatic("compareMethod") &&
        (field.nestedSchema as any)?.getFieldByKeyStatic("value")
    );
}

function getRewardDisplay(items: WeaponBuildItem[]): string {
    const rootItems = items.filter((item) => !item.parentId);
    if (rootItems.length === 0) return "";

    const grouped: Record<string, { tpl: string; count: number }> = {};
    for (const item of rootItems) {
        const tpl = item._tpl;
        if (!grouped[tpl]) grouped[tpl] = { tpl, count: 0 };
        grouped[tpl].count += item?.upd?.StackObjectsCount ?? 1;
    }

    const parts: string[] = [];
    for (const [tpl, data] of Object.entries(grouped)) {
        const name = gameLocalization.getObjectLocalization({ instance: { _id: tpl } });
        const count = data.count;
        const display = count > 1 ? `${name} x ${count}` : name;
        parts.push(display);
    }
    return parts.join(", ");
}

const renderRules: RenderRule[] = [
    {
        condition: (field: Field, recordSchema: RecordSchema) => field.key === "items" && field.isArray(),
        component: (field: Field, recordSchema: RecordSchema) => (
            <>
                <LoadWeaponBuildInput field={field} data={recordSchema.getData()} />
                {recordSchema.get(field.key)?.filter((item: WeaponBuildItem) => !item.parentId).length > 0 && (
                    <div class="weapon-build-reward">
                        <span class="weapon-build-reward__label">Предметы:</span>
                        <span class="weapon-build-reward__value">{getRewardDisplay(recordSchema.get(field.key))}</span>
                    </div>
                )}
            </>
        ),
    },
    {
        condition: (field: Field) => field.type === "localization",
        componentTemplate: LocalizationInput,
    },
    {
        condition: (field: Field) => field.type === "advancedSelect",
        componentTemplate: AdvancedSelectInput,
    },
    {
        condition: (field: Field) => isCompareInput(field),
        componentTemplate: CompareInput,
    },
    {
        condition: (field: Field) => field.key === "parentId",
        componentTemplate: ParentInput,
    },

    {
        condition: (field: Field, recordSchema: RecordSchema) =>
            compareInputFields.includes(field.key),
        component: (field: Field, recordSchema: RecordSchema) => {
            // Внутри был ещё один v-if для field.key === 'value'
			if (field.key === "value") {
                return (
                    <div>
                        <CompareInput data={recordSchema.data} />
                    </div>
                );
            }
            return <></>;
        },
    },
    {
        condition: (field: Field, recordSchema: RecordSchema) => !!(field.type === "text" || field.hidden),
        componentTemplate: "input",
        componentTemplateProps: { type: "text" },
    },

    {
        condition: (field: Field, recordSchema: RecordSchema) => field.type === "number",
        componentTemplate: "input",
        componentTemplateProps: { type: "number" },
    },

    {
        condition: (field: Field) => field.type === "boolean",
        componentTemplate: "input",
        componentTemplateProps: { type: "checkbox" },
    },

    // 10. field.type === 'textarea'
    {
        condition: (field: Field) => field.type === "textarea",
        componentTemplate: 'textarea',
        componentTemplateProps: { rows: 3 },
    },

    // 11. field.type === 'select'
    {
        condition: (field: Field) => field.type === "select",
        componentTemplate: OptionsInput
    },

    // 12. field.isArray() (но это уже не 'items', потому что первое правило перехватило бы)
    {
        condition: (field: Field) => field.isArray(),
		componentTemplate: ArrayInput,
    },

    // 13. field.type === 'object'
    {
        condition: (field: Field) => field.type === "object",
        component: (field: Field, recordSchema: RecordSchema) => (
            <div class="object-summary">{getObjectSummary(recordSchema.data[field.key])}</div>
        ),
    },
];

export function fieldsRenderer(recordSchema: RecordSchema, field: Field) {
    for (const renderRule of renderRules) {
        if (renderRule.condition(field, recordSchema)) {
			if (renderRule.componentTemplate) {
				const OnInput = (e: Event): void => {
					recordSchema.set(field, (e.target as HTMLInputElement)?.value as any);
				}
				const initValue = recordSchema.get(field);

	            return h(renderRule.componentTemplate, {
	                field: field,
					recordSchema: recordSchema,
					data: recordSchema.data,
					placeholder: field.placeholder,
					disabled: !field.editable,

					modelValue: initValue,
					value: initValue,
					checked: initValue,
					'v-model': initValue,

     				"onChange": OnInput,
     				"onInput": OnInput,
	                "onUpdate:modelValue": OnInput,
					...renderRule.componentTemplateProps
	            });
            }

            if (renderRule.component) {
                return renderRule.component(field, recordSchema);
            }
        }
    }
    // return renderRules.find((rule) => rule.condition(field, recordSchema))?.component(field, recordSchema);
}
