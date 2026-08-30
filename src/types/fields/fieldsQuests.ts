// src/types/fieldsQuests.ts

import { RecordSchema, Field, UnneccesaryField, HiddenField, AdvSelectField, LocalizationField } from "./fields";
import { IdField } from "./fieldsClasses";
import { QuestConditions } from "./fieldsQuestsConditions";
import { RewardsSchemas } from "./rewards/rewards";

/**
 * Схема для квеста из EFT
 */
export class QuestSchema extends RecordSchema {
	static fields: Field[] = [
		// ===== ОСНОВНАЯ ИНФОРМАЦИЯ =====
		IdField.create({
			key: "_id"
		}),
		Field.create({
			key: 'QuestName',
			label: '📝 Техническое название',
			description: 'Внутреннее название квеста',
			type: 'text',
			order: 2
		}),

		// ===== ЛОКАЛИЗУЕМЫЕ ПОЛЯ =====
		LocalizationField.create({
			key: 'name',
			label: '📄 Название (локализация)',
			description: 'Ключ локализации для названия квеста',
			order: 3,
			editable: false,
		}),
		LocalizationField.create({
			key: 'description',
			label: '📄 Описание (локализация)',
			description: 'Ключ локализации для описания квеста',
			order: 4
		}),
		LocalizationField.create({
			key: 'note',
			label: '📝 Заметка (локализация)',
			description: 'Ключ локализации для заметки квеста',
			order: 5
		}),
		LocalizationField.create({
			key: 'acceptPlayerMessage',
			label: '💬 Сообщение принятия (локализация)',
			description: 'Ключ локализации сообщения при принятии квеста',
			order: 6
		}),
		LocalizationField.create({
			key: 'declinePlayerMessage',
			label: '💬 Сообщение отказа (локализация)',
			description: 'Ключ локализации сообщения при отказе от квеста',
			order: 7
		}),
		LocalizationField.create({
			key: 'completePlayerMessage',
			label: '💬 Сообщение выполнения (локализация)',
			description: 'Ключ локализации сообщения при выполнении квеста',
			order: 8
		}),
		LocalizationField.create({
			key: 'successMessageText',
			label: '✅ Текст успеха (локализация)',
			description: 'Ключ локализации текста успешного выполнения',
			order: 9
		}),
		LocalizationField.create({
			key: 'failMessageText',
			label: '❌ Текст провала (локализация)',
			description: 'Ключ локализации текста провала квеста',
			order: 10
		}),
		LocalizationField.create({
			key: 'startedMessageText',
			label: '▶️ Текст начала (локализация)',
			description: 'Ключ локализации текста начала квеста',
			order: 11
		}),
		LocalizationField.create({
			key: 'changeQuestMessageText',
			label: '🔄 Текст изменения (локализация)',
			description: 'Ключ локализации текста изменения квеста',
			order: 12
		}),

		// ===== СТАТУС И НАСТРОЙКИ =====
		HiddenField.create({
			key: 'status',
			label: '📊 Статус',
			description: 'Текущий статус квеста',
			type: 'number',
			order: 13,
			defaultValue: 0
		}),
		Field.create({
			key: 'type',
			label: '🎯 Тип квеста',
			description: 'Тип квеста (Elimination, PickUp и т.д.)',
			type: 'select',
			options: [
				'Merchant'
				, 'Standing'
				, 'Experience'
				, 'WeaponAssembly'
				, 'Loyalty'
				, 'PickUp'
				, 'Multi'
				, 'Skill'
				, 'Discover'
				, 'Elimination'
				, 'Exploration'
				, 'Completion'
			],
			order: 14
		}),
		Field.create({
			key: 'side',
			label: '🎖️ Сторона',
			description: 'Для кого доступен квест (Pmc, Scav)',
			type: 'select',
			options: ['Pmc', 'Scav', 'Both'],
			order: 15,
			defaultValue: 'Pmc'
		}),
		Field.create({
			key: 'location',
			label: '📍 Локация',
			description: 'Локация для выполнения квеста',
			type: 'select',
			order: 16,
			defaultValue: 'any',
			options: [
				'5704e3c2d2720bac5b8b4567'
				, '56f40101d2720b2a4d8b45d6'
				, 'any'
				, '653e6760052c01c1c805532f'
				, '6733700029c367a3d40b02af'
				, '59fc81d786f774390775787e'
				, '5b0fc42d86f7744a585f9105'
				, '5714dbc024597771384a510d'
				, '55f2d3fd4bdc2d5f408b4567'
				, 'marathon'
				, '5704e554d2720bac5b8b456e'
				, '5704e5fad2720bc05b8b4567'
				, '5714dc692459777137212e12'
				, '5704e4dad2720bb55b8b4567'
			]
		}),
		Field.create({
			key: 'instantComplete',
			label: '⚡ Мгновенное выполнение',
			description: 'Выполняется мгновенно',
			type: 'boolean',
			order: 17,
			defaultValue: false
		}),
		Field.create({
			key: 'restartable',
			label: '🔄 Перезапускаемый',
			description: 'Можно ли перезапустить квест',
			type: 'boolean',
			order: 18,
			defaultValue: false
		}),
		Field.create({
			key: 'secretQuest',
			label: '🤫 Секретный квест',
			description: 'Скрытый квест',
			type: 'boolean',
			order: 19,
			defaultValue: false
		}),
		Field.create({
			key: 'isKey',
			label: '🔑 Ключевой квест',
			description: 'Является ли ключевым квестом',
			type: 'boolean',
			order: 20,
			defaultValue: false
		}),

		// ===== УСЛОВИЯ =====
		Field.create({
			key: 'conditions',
			label: '📋 Условия',
			description: 'Условия для начала и выполнения',
			type: 'object',
			order: 21,
			nestedSchema: QuestConditions
		}),

		// ===== НАГРАДЫ =====
		Field.create({
			key: 'rewards',
			label: '🎁 Награды',
			description: 'Награды за выполнение квеста',
			type: 'object',
			nestedSchema: RewardsSchemas,
			order: 22
		}),

		// ===== ТОРГОВЕЦ =====
		AdvSelectField.create({
			key: 'traderId',
			label: '🏪 ID Торговца',
			description: 'ID торговца, выдающего квест',
			type: 'advancedSelect',
			order: 23,
			storeId: "traders",
		}),

		// ===== ИЗОБРАЖЕНИЕ =====
		Field.create({
			key: 'image',
			label: '🖼️ Изображение',
			description: 'Путь к иконке квеста',
			type: 'text',
			order: 24
		}),

		// ===== ДОПОЛНИТЕЛЬНО =====
		Field.create({
			key: 'canShowNotificationsInGame',
			label: '🔔 Уведомления в игре',
			description: 'Показывать уведомления в игре',
			type: 'boolean',
			order: 25,
			defaultValue: true
		}),
		UnneccesaryField.create({
			key: 'progressSource',
			label: '📊 Источник прогресса',
			description: 'Источник обновления прогресса',
			type: 'text',
			order: 26,
			defaultValue: 'eft'
		}),
		UnneccesaryField.create({
			key: 'acceptanceAndFinishingSource',
			label: '📊 Источник принятия',
			description: 'Источник принятия и завершения',
			type: 'text',
			order: 27,
			defaultValue: 'eft'
		}),
		UnneccesaryField.create({
			key: 'gameModes',
			label: '🎮 Режимы игры',
			description: 'Доступные режимы игры',
			type: 'array',
			order: 28,
			defaultValue: []
		}),
		UnneccesaryField.create({
			key: 'arenaLocations',
			label: '🏟️ Арены',
			description: 'Локации арен',
			type: 'array',
			order: 29,
			defaultValue: []
		}),
		UnneccesaryField.create({
			key: 'rankingModes',
			label: '🏆 Рейтинговые режимы',
			description: 'Режимы для рейтинга',
			type: 'array',
			order: 30,
			defaultValue: []
		})
	];
}
