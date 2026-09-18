// src/types/fieldsQuests.ts

import Project from "@/project/Project";
import { RecordSchema, Field, AdvSelectField, LocalizationField } from "../fields/fields";
import { HiddenField, UnneccesaryField } from "../fields/fieldsClasses";

import { IdField } from "../fields/fieldsClasses";
import type { FieldContext } from "../fields/fieldsConsts";
import { QuestConditions } from "./questsConditions";
import { RewardsSchemas } from "./rewards";
import { Path } from "@/utils/pathUtils";
import { customRef, defineComponent } from "vue";
import { questDataStore } from "@/project/Quests";
import { getValuesByPath } from "@/utils/utils";
import { gameLocalization, uitext } from "../localization";

/**
 * Схема для квеста из EFT
 */
export class QuestSchema extends RecordSchema {
    getRenderComponent() {
        const schema = this;
        return defineComponent({
            name: "MyCustomEditor",
            props: ["recordSchema", "navigate", "listTabs"],
            setup(props, { emit, slots, attrs, expose }) {
                const targetQuestId = props.recordSchema.get("_id");
                const nextQuests: Array<{ loc: string; id: string }> = [];
                for (const [questId, quest] of questDataStore.getMap().entries()) {
                    if (
                        quest.data instanceof RecordSchema &&
                        getValuesByPath(
                            quest.data.toJSON(),
                            "conditions.AvailableForStart.*[conditionType=Quest].target"
                        ).includes(targetQuestId)
                    ) {
                        const id = String(questId);
                        nextQuests.push({
                            id,
                            loc: gameLocalization.getText({
                                localeId: [`${id} Name`, `${id} name`, id],
                                default: id,
                            }),
                        });
                    }
                }
                if (nextQuests.length > 0)
                    return () => {
                        const items: any[] = [];
                        for (let i = 0; i < nextQuests.length; i++) {
                            const quest = nextQuests[i];
							items.push(<span class="link-style-text" onClick={() => {
								props.listTabs.clearSearch()
								props.listTabs.selectTab(quest.id)
							}} key={i}>{quest.loc}</span>);
                            if (i < nextQuests.length - 1) {
                                items.push(<span key={`sep-${i}`}>, </span>);
                            }
                        }
                        return (
                            <div>
                                {uitext("questsAvailableAfterthis")}: {items}
                            </div>
                        );
                    };
                else return () => <></>;
            },
        });
    }

    static fields: Field[] = [
        // ===== ОСНОВНАЯ ИНФОРМАЦИЯ =====
        IdField.create({
            key: "_id",
        }),
        Field.create({
            key: "QuestName",
            type: "text",
            order: 2,
        }),

        // ===== ЛОКАЛИЗУЕМЫЕ ПОЛЯ =====
        LocalizationField.create({
            key: "name",
            order: 3,
            editable: false,
        }),
        LocalizationField.create({
            key: "description",
            order: 4,
        }),
        LocalizationField.create({
            key: "note",
            order: 5,
        }),
        LocalizationField.create({
            key: "acceptPlayerMessage",
            order: 6,
        }),
        LocalizationField.create({
            key: "declinePlayerMessage",
            order: 7,
        }),
        LocalizationField.create({
            key: "completePlayerMessage",
            order: 8,
        }),
        LocalizationField.create({
            key: "successMessageText",
            order: 9,
        }),
        LocalizationField.create({
            key: "failMessageText",
            order: 10,
        }),
        LocalizationField.create({
            key: "startedMessageText",
            order: 11,
        }),
        LocalizationField.create({
            key: "changeQuestMessageText",
            order: 12,
        }),

        // ===== СТАТУС И НАСТРОЙКИ =====
        HiddenField.create({
            key: "status",
            type: "number",
            order: 13,
            defaultValue: 0,
        }),
        Field.create({
            key: "type",
            type: "select",
            options: [
                "Merchant",
                "Standing",
                "Experience",
                "WeaponAssembly",
                "Loyalty",
                "PickUp",
                "Multi",
                "Skill",
                "Discover",
                "Elimination",
                "Exploration",
                "Completion",
            ],
            order: 14,
        }),
        Field.create({
            key: "side",
            type: "select",
            options: ["Pmc", "Scav", "Both"],
            order: 15,
            defaultValue: "Pmc",
        }),
        Field.create({
            key: "location",
            type: "select",
            order: 16,
            defaultValue: "any",
            options: [
                "5704e3c2d2720bac5b8b4567",
                "56f40101d2720b2a4d8b45d6",
                "any",
                "653e6760052c01c1c805532f",
                "6733700029c367a3d40b02af",
                "59fc81d786f774390775787e",
                "5b0fc42d86f7744a585f9105",
                "5714dbc024597771384a510d",
                "55f2d3fd4bdc2d5f408b4567",
                "marathon",
                "5704e554d2720bac5b8b456e",
                "5704e5fad2720bc05b8b4567",
                "5714dc692459777137212e12",
                "5704e4dad2720bb55b8b4567",
            ],
        }),
        Field.create({
            key: "instantComplete",
            type: "boolean",
            order: 17,
            defaultValue: false,
        }),
        Field.create({
            key: "restartable",
            type: "boolean",
            order: 18,
            defaultValue: false,
        }),
        Field.create({
            key: "secretQuest",
            type: "boolean",
            order: 19,
            defaultValue: false,
        }),
        Field.create({
            key: "isKey",
            type: "boolean",
            order: 20,
            defaultValue: false,
        }),

        // ===== УСЛОВИЯ =====
        Field.create({
            key: "conditions",
            type: "object",
            order: 21,
            nestedSchema: QuestConditions,
            alwaysFillWithDefault: true,
        }),

        // ===== НАГРАДЫ =====
        Field.create({
            key: "rewards",
            type: "object",
            nestedSchema: RewardsSchemas,
            order: 22,

            alwaysFillWithDefault: true,
        }),

        // ===== ТОРГОВЕЦ =====
        AdvSelectField.create({
            key: "traderId",
            type: "advancedSelect",
            order: 23,
            storeId: "traders",
        }),

        // ===== ИЗОБРАЖЕНИЕ =====
        Field.create({
            key: "image",
            type: "text",
            order: 24,

            extraEmits: {
                onImageSelected: (
                    fieldContext: FieldContext,
                    payload: {
                        success: boolean;
                        canceled?: boolean;
                        path?: string;
                        error?: string;
                    }
                ) => {
                    if (payload.success && payload.path) {
                        const imagePath = new Path(payload.path);
                        const traderId = fieldContext.recordSchema.get("traderId");
                        const questId = fieldContext.recordSchema.get("_id");
                        const currentProjectFolder = Project.currentProjectFolder;

                        if (!traderId || !currentProjectFolder || !questId) return;

                        const fileName = `${questId}${imagePath.extname()}`;
                        const savePath = new Path(
                            currentProjectFolder,
                            `db/CustomQuests/${traderId}/Images/${fileName}`
                        );

                        window.electronAPI.copyFile(imagePath.toString(), savePath.toString());

                        fieldContext.recordSchema.set(fieldContext.field, `/files/quest/icon/${fileName}`);
                    }
                },
            },
        }),

        // ===== ДОПОЛНИТЕЛЬНО =====
        Field.create({
            key: "canShowNotificationsInGame",
            type: "boolean",
            order: 25,
            defaultValue: true,
        }),
        UnneccesaryField.create({
            key: "progressSource",
            type: "text",
            order: 26,
            defaultValue: "eft",
        }),
        UnneccesaryField.create({
            key: "acceptanceAndFinishingSource",
            type: "text",
            order: 27,
            defaultValue: "eft",
        }),
        UnneccesaryField.create({
            key: "gameModes",
            type: "array",
            order: 28,
            defaultValue: [],
        }),
        UnneccesaryField.create({
            key: "arenaLocations",
            type: "array",
            order: 29,
            defaultValue: [],
        }),
        UnneccesaryField.create({
            key: "rankingModes",
            type: "array",
            order: 30,
            defaultValue: [],
        }),
    ];
}
