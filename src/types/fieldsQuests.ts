// src/types/quest-schema.ts
import { RecordSchema, Field } from "@/types/fields";

/**
 * Схема для квеста из EFT
 */
export class QuestSchema extends RecordSchema {
	static fields: Field[] = [
		// ===== ОСНОВНАЯ ИНФОРМАЦИЯ =====
		Field.create({
			key: '_id',
			label: '🔑 ID Квеста',
			description: 'Уникальный идентификатор квеста',
			type: 'text',
			editable: false,
			order: 1
		}),
		Field.create({
			key: 'QuestName',
			label: '📝 Название квеста',
			description: 'Внутреннее название квеста',
			type: 'text',
			order: 2
		}),
		Field.create({
			key: 'name',
			label: '📄 Локализованное имя',
			description: 'Ключ локализации для имени',
			type: 'text',
			order: 3
		}),
		Field.create({
			key: 'description',
			label: '📄 Описание',
			description: 'Ключ локализации для описания',
			type: 'text',
			order: 4
		}),
		Field.create({
			key: 'note',
			label: '📝 Заметка',
			description: 'Ключ локализации для заметки',
			type: 'text',
			order: 5
		}),

		// ===== СТАТУС И НАСТРОЙКИ =====
		Field.create({
			key: 'status',
			label: '📊 Статус',
			description: 'Текущий статус квеста',
			type: 'number',
			order: 6,
			defaultValue: 0
		}),
		Field.create({
			key: 'type',
			label: '🎯 Тип квеста',
			description: 'Тип квеста (Elimination, PickUp и т.д.)',
			type: 'text',
			order: 7
		}),
		Field.create({
			key: 'side',
			label: '🎖️ Сторона',
			description: 'Для кого доступен квест (Pmc, Scav)',
			type: 'select',
			options: ['Pmc', 'Scav', 'Both'],
			order: 8,
			defaultValue: 'Pmc'
		}),
		Field.create({
			key: 'location',
			label: '📍 Локация',
			description: 'Локация для выполнения квеста',
			type: 'text',
			order: 9,
			defaultValue: 'any'
		}),
		Field.create({
			key: 'instantComplete',
			label: '⚡ Мгновенное выполнение',
			description: 'Выполняется мгновенно',
			type: 'boolean',
			order: 10,
			defaultValue: false
		}),
		Field.create({
			key: 'restartable',
			label: '🔄 Перезапускаемый',
			description: 'Можно ли перезапустить квест',
			type: 'boolean',
			order: 11,
			defaultValue: false
		}),
		Field.create({
			key: 'secretQuest',
			label: '🤫 Секретный квест',
			description: 'Скрытый квест',
			type: 'boolean',
			order: 12,
			defaultValue: false
		}),
		Field.create({
			key: 'isKey',
			label: '🔑 Ключевой квест',
			description: 'Является ли ключевым квестом',
			type: 'boolean',
			order: 13,
			defaultValue: false
		}),

		// ===== ТЕКСТЫ СООБЩЕНИЙ =====
		Field.create({
			key: 'acceptPlayerMessage',
			label: '💬 Сообщение принятия',
			description: 'Ключ локализации сообщения при принятии',
			type: 'text',
			order: 14
		}),
		Field.create({
			key: 'declinePlayerMessage',
			label: '💬 Сообщение отказа',
			description: 'Ключ локализации сообщения при отказе',
			type: 'text',
			order: 15
		}),
		Field.create({
			key: 'completePlayerMessage',
			label: '💬 Сообщение выполнения',
			description: 'Ключ локализации сообщения при выполнении',
			type: 'text',
			order: 16
		}),
		Field.create({
			key: 'successMessageText',
			label: '💬 Текст успеха',
			description: 'Ключ локализации текста успеха',
			type: 'text',
			order: 17
		}),
		Field.create({
			key: 'failMessageText',
			label: '💬 Текст провала',
			description: 'Ключ локализации текста провала',
			type: 'text',
			order: 18
		}),
		Field.create({
			key: 'startedMessageText',
			label: '💬 Текст начала',
			description: 'Ключ локализации текста начала',
			type: 'text',
			order: 19
		}),
		Field.create({
			key: 'changeQuestMessageText',
			label: '💬 Текст изменения',
			description: 'Ключ локализации текста изменения',
			type: 'text',
			order: 20
		}),

		// ===== УСЛОВИЯ =====
		Field.create({
			key: 'conditions',
			label: '📋 Условия',
			description: 'Условия для начала и выполнения',
			type: 'object',
			order: 21
		}),

		// ===== НАГРАДЫ =====
		Field.create({
			key: 'rewards',
			label: '🎁 Награды',
			description: 'Награды за выполнение квеста',
			type: 'object',
			order: 22
		}),

		// ===== ТОРГОВЕЦ =====
		Field.create({
			key: 'traderId',
			label: '🏪 ID Торговца',
			description: 'ID торговца, выдающего квест',
			type: 'text',
			order: 23
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
		Field.create({
			key: 'progressSource',
			label: '📊 Источник прогресса',
			description: 'Источник обновления прогресса',
			type: 'text',
			order: 26,
			defaultValue: 'eft'
		}),
		Field.create({
			key: 'acceptanceAndFinishingSource',
			label: '📊 Источник принятия',
			description: 'Источник принятия и завершения',
			type: 'text',
			order: 27,
			defaultValue: 'eft'
		}),
		Field.create({
			key: 'gameModes',
			label: '🎮 Режимы игры',
			description: 'Доступные режимы игры',
			type: 'array',
			order: 28,
			defaultValue: []
		}),
		Field.create({
			key: 'arenaLocations',
			label: '🏟️ Арены',
			description: 'Локации арен',
			type: 'array',
			order: 29,
			defaultValue: []
		}),
		Field.create({
			key: 'rankingModes',
			label: '🏆 Рейтинговые режимы',
			description: 'Режимы для рейтинга',
			type: 'array',
			order: 30,
			defaultValue: []
		})
	];
}

// ===== ТИПЫ ДЛЯ ВЛОЖЕННЫХ ОБЪЕКТОВ =====

export interface QuestCondition {
	id: string;
	index: number;
	parentId: string;
	conditionType: string;
	dynamicLocale: boolean;
	globalQuestCounterId: string;
	visibilityConditions: any[];
	value?: number;
	compareMethod?: string;
	target?: string | string[];
	completeInSeconds?: number;
	counter?: any;
	doNotResetIfCounterCompleted?: boolean;
	isNecessary?: boolean;
	isResetOnConditionFailed?: boolean;
	oneSessionOnly?: boolean;
	availableAfter?: number;
	dispersion?: number;
	status?: number[];
}

export interface QuestConditions {
	AvailableForStart: QuestCondition[];
	AvailableForFinish: QuestCondition[];
	Fail: QuestCondition[];
}

export interface QuestRewardItem {
	_id: string;
	_tpl: string;
	parentId?: string;
	slotId?: string;
	upd?: {
		StackObjectsCount?: number;
		SpawnedInSession?: boolean;
		FireMode?: { FireMode: string };
		Foldable?: { Folded: boolean };
	};
}

export interface QuestReward {
	id: string;
	type: string;
	value?: number;
	target?: string;
	isHidden: boolean;
	unknown: boolean;
	items?: QuestRewardItem[];
	traderId?: string;
	loyaltyLevel?: number;
	findInRaid?: boolean;
	isEncoded?: boolean;
	availableInGameEditions?: string[];
	gameMode?: string[];
}

export interface QuestRewards {
	Success: QuestReward[];
	Fail: QuestReward[];
	Started: QuestReward[];
}

export interface QuestData {
	_id: string;
	QuestName: string;
	acceptPlayerMessage: string;
	acceptanceAndFinishingSource: string;
	arenaLocations: string[];
	canShowNotificationsInGame: boolean;
	changeQuestMessageText: string;
	completePlayerMessage: string;
	conditions: QuestConditions;
	declinePlayerMessage: string;
	description: string;
	failMessageText: string;
	gameModes: string[];
	image: string;
	instantComplete: boolean;
	isKey: boolean;
	location: string;
	name: string;
	note: string;
	progressSource: string;
	rankingModes: string[];
	restartable: boolean;
	rewards: QuestRewards;
	secretQuest: boolean;
	side: 'Pmc' | 'Scav' | 'Both';
	startedMessageText: string;
	status: number;
	successMessageText: string;
	traderId: string;
	type: string;
}