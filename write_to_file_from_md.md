```typescript
// src/types/fields/conditions/VisitPlaceCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class VisitPlaceCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'Цель (зона)',
			type: 'text',
			order: 7,
		}),
		Field.create({
			key: 'value',
			label: 'Количество',
			type: 'number',
			order: 8,
			defaultValue: 1
		}),
	];
}
```

```typescript
// src/types/fields/conditions/ExitNameCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class ExitNameCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'exitName',
			label: 'Название выхода',
			type: 'text',
			order: 7,
		}),
	];
}
```

```typescript
// src/types/fields/conditions/InZoneCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class InZoneCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'zoneIds',
			label: 'ID зон',
			type: 'array',
			order: 7,
			defaultValue: []
		}),
	];
}
```

```typescript
// src/types/fields/conditions/LeaveItemAtLocationCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field, ItemField } from "@/types/fields/fields";

export class LeaveItemAtLocationCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		ItemField.create({
			key: 'target',
			label: 'Цель (ID предмета)',
			order: 7,
			type: 'arrayItemChoice',
			storeId: "items",
		}),
		Field.create({
			key: 'value',
			label: 'Количество',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'zoneId',
			label: 'ID зоны',
			type: 'text',
			order: 9,
		}),
		Field.create({
			key: 'plantTime',
			label: 'Время установки (сек)',
			type: 'number',
			order: 10,
			defaultValue: 0
		}),
		Field.create({
			key: 'onlyFoundInRaid',
			label: 'Только найдено в рейде',
			type: 'boolean',
			order: 11,
			defaultValue: false
		}),
		Field.create({
			key: 'dogtagLevel',
			label: 'Уровень жетона',
			type: 'number',
			order: 12,
			defaultValue: 0
		}),
		Field.create({
			key: 'minDurability',
			label: 'Мин. прочность',
			type: 'number',
			order: 13,
			defaultValue: 0
		}),
		Field.create({
			key: 'maxDurability',
			label: 'Макс. прочность',
			type: 'number',
			order: 14,
			defaultValue: 100
		}),
		Field.create({
			key: 'globalQuestCounterId',
			label: 'ID глобального счетчика квеста',
			type: 'text',
			order: 15,
			defaultValue: ''
		})
	];
}
```

```typescript
// src/types/fields/conditions/PlaceBeaconCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field, ItemField } from "@/types/fields/fields";

export class PlaceBeaconCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		ItemField.create({
			key: 'target',
			label: 'Цель (ID предмета)',
			order: 7,
			type: 'arrayItemChoice',
			storeId: "items",
		}),
		Field.create({
			key: 'value',
			label: 'Количество',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'zoneId',
			label: 'ID зоны',
			type: 'text',
			order: 9,
		}),
		Field.create({
			key: 'plantTime',
			label: 'Время установки (сек)',
			type: 'number',
			order: 10,
			defaultValue: 0
		}),
		Field.create({
			key: 'globalQuestCounterId',
			label: 'ID глобального счетчика квеста',
			type: 'text',
			order: 11,
			defaultValue: ''
		})
	];
}
```

```typescript
// src/types/fields/conditions/KillsCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class KillsCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'Цель (Any, AnyPmc, Bear, Usec, Savage)',
			type: 'select',
			options: ['Any', 'AnyPmc', 'Bear', 'Usec', 'Savage'],
			order: 7,
		}),
		Field.create({
			key: 'value',
			label: 'Количество',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'select',
			options: ['>=', '<=', '==', '>', '<'],
			order: 9,
			defaultValue: '>='
		}),
		Field.create({
			key: 'distance',
			label: 'Дистанция',
			type: 'object',
			order: 10,
			nestedSchema: class DistanceSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'daytime',
			label: 'Время суток',
			type: 'object',
			order: 11,
			nestedSchema: class DaytimeSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'from', type: 'number', label: 'С часа', defaultValue: 0 }),
					Field.create({ key: 'to', type: 'number', label: 'До часа', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'bodyPart',
			label: 'Части тела',
			type: 'array',
			order: 12,
			defaultValue: [],
			options: ['Head', 'Chest', 'Stomach', 'LeftArm', 'RightArm', 'LeftLeg', 'RightLeg']
		}),
		Field.create({
			key: 'weapon',
			label: 'ID оружия',
			type: 'array',
			order: 13,
			defaultValue: []
		}),
		Field.create({
			key: 'weaponCaliber',
			label: 'Калибр оружия',
			type: 'array',
			order: 14,
			defaultValue: []
		}),
		Field.create({
			key: 'weaponModsExclusive',
			label: 'Моды оружия (исключающие)',
			type: 'array',
			order: 15,
			defaultValue: []
		}),
		Field.create({
			key: 'weaponModsInclusive',
			label: 'Моды оружия (включающие)',
			type: 'array',
			order: 16,
			defaultValue: []
		}),
		Field.create({
			key: 'enemyEquipmentExclusive',
			label: 'Экипировка врага (исключающая)',
			type: 'array',
			order: 17,
			defaultValue: []
		}),
		Field.create({
			key: 'enemyEquipmentInclusive',
			label: 'Экипировка врага (включающая)',
			type: 'array',
			order: 18,
			defaultValue: []
		}),
		Field.create({
			key: 'enemyHealthEffects',
			label: 'Эффекты здоровья врага',
			type: 'array',
			order: 19,
			defaultValue: []
		}),
		Field.create({
			key: 'savageRole',
			label: 'Роли Scav',
			type: 'array',
			order: 20,
			defaultValue: []
		}),
		Field.create({
			key: 'resetOnSessionEnd',
			label: 'Сброс при завершении сессии',
			type: 'boolean',
			order: 21,
			defaultValue: false
		}),
	];
}
```

```typescript
// src/types/fields/conditions/ShotsCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class ShotsCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'Цель (Any)',
			type: 'select',
			options: ['Any', 'AnyPmc', 'Bear', 'Usec', 'Savage'],
			order: 7,
		}),
		Field.create({
			key: 'value',
			label: 'Количество',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'select',
			options: ['>=', '<=', '=='],
			order: 9,
			defaultValue: '>='
		}),
		Field.create({
			key: 'distance',
			label: 'Дистанция',
			type: 'object',
			order: 10,
			nestedSchema: class DistanceSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'daytime',
			label: 'Время суток',
			type: 'object',
			order: 11,
			nestedSchema: class DaytimeSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'from', type: 'number', label: 'С часа', defaultValue: 0 }),
					Field.create({ key: 'to', type: 'number', label: 'До часа', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'bodyPart',
			label: 'Части тела',
			type: 'array',
			order: 12,
			defaultValue: [],
			options: ['Head', 'Chest', 'Stomach', 'LeftArm', 'RightArm', 'LeftLeg', 'RightLeg']
		}),
		Field.create({
			key: 'weapon',
			label: 'ID оружия',
			type: 'array',
			order: 13,
			defaultValue: []
		}),
		Field.create({
			key: 'weaponCaliber',
			label: 'Калибр оружия',
			type: 'array',
			order: 14,
			defaultValue: []
		}),
		Field.create({
			key: 'weaponModsExclusive',
			label: 'Моды оружия (исключающие)',
			type: 'array',
			order: 15,
			defaultValue: []
		}),
		Field.create({
			key: 'weaponModsInclusive',
			label: 'Моды оружия (включающие)',
			type: 'array',
			order: 16,
			defaultValue: []
		}),
		Field.create({
			key: 'enemyEquipmentExclusive',
			label: 'Экипировка врага (исключающая)',
			type: 'array',
			order: 17,
			defaultValue: []
		}),
		Field.create({
			key: 'enemyEquipmentInclusive',
			label: 'Экипировка врага (включающая)',
			type: 'array',
			order: 18,
			defaultValue: []
		}),
		Field.create({
			key: 'enemyHealthEffects',
			label: 'Эффекты здоровья врага',
			type: 'array',
			order: 19,
			defaultValue: []
		}),
		Field.create({
			key: 'savageRole',
			label: 'Роли Scav',
			type: 'array',
			order: 20,
			defaultValue: []
		}),
		Field.create({
			key: 'resetOnSessionEnd',
			label: 'Сброс при завершении сессии',
			type: 'boolean',
			order: 21,
			defaultValue: false
		}),
	];
}
```

```typescript
// src/types/fields/conditions/EquipmentCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class EquipmentCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'equipmentInclusive',
			label: 'Экипировка (включающая)',
			type: 'array',
			order: 7,
			defaultValue: []
		}),
		Field.create({
			key: 'equipmentExclusive',
			label: 'Экипировка (исключающая)',
			type: 'array',
			order: 8,
			defaultValue: []
		}),
		Field.create({
			key: 'IncludeNotEquippedItems',
			label: 'Включать неэкипированные предметы',
			type: 'boolean',
			order: 9,
			defaultValue: false
		}),
	];
}
```

```typescript
// src/types/fields/conditions/HealthEffectCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class HealthEffectCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'bodyPartsWithEffects',
			label: 'Части тела с эффектами',
			type: 'array',
			order: 7,
			defaultValue: [],
			arrayItemSchema: class BodyPartsWithEffectsSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'bodyParts', type: 'array', label: 'Части тела', defaultValue: [], options: ['Head', 'Chest', 'Stomach', 'LeftArm', 'RightArm', 'LeftLeg', 'RightLeg'] }),
					Field.create({ key: 'effects', type: 'array', label: 'Эффекты', defaultValue: [], options: ['Pain', 'Dehydration', 'Intoxication', 'Tremor', 'Stimulator', 'Stun'] }),
				]
			}
		}),
		Field.create({
			key: 'time',
			label: 'Время (сек)',
			type: 'object',
			order: 8,
			nestedSchema: class TimeCompareSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'energy',
			label: 'Энергия',
			type: 'object',
			order: 9,
			nestedSchema: class EnergySchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'hydration',
			label: 'Гидратация',
			type: 'object',
			order: 10,
			nestedSchema: class HydrationSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
	];
}
```

```typescript
// src/types/fields/conditions/SkillCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class SkillCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'Навык',
			type: 'select',
			options: ['Sniper', 'Health', 'StressResistance', 'Charisma', 'Vitality', 'Attention', 'Search'],
			order: 7,
		}),
		Field.create({
			key: 'value',
			label: 'Уровень',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'select',
			options: ['>=', '<=', '=='],
			order: 9,
			defaultValue: '>='
		}),
	];
}
```

```typescript
// src/types/fields/conditions/TraderLoyaltyCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field, ItemField } from "@/types/fields/fields";

export class TraderLoyaltyCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'ID торговца',
			type: 'text',
			order: 7,
		}),
		Field.create({
			key: 'value',
			label: 'Уровень лояльности',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'select',
			options: ['>=', '<=', '=='],
			order: 9,
			defaultValue: '>='
		}),
	];
}
```

```typescript
// src/types/fields/conditions/TraderStandingCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class TraderStandingCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'ID торговца',
			type: 'text',
			order: 7,
		}),
		Field.create({
			key: 'value',
			label: 'Репутация',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'select',
			options: ['>=', '<=', '=='],
			order: 9,
			defaultValue: '>='
		}),
	];
}
```

```typescript
// src/types/fields/conditions/HideoutAreaCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class HideoutAreaCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'areaType',
			label: 'Тип зоны',
			type: 'number',
			order: 7,
			defaultValue: 0
		}),
		Field.create({
			key: 'value',
			label: 'Уровень',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'select',
			options: ['>=', '<=', '=='],
			order: 9,
			defaultValue: '>='
		}),
	];
}
```

```typescript
// src/types/fields/conditions/LaunchFlareCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class LaunchFlareCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'Цель (зона)',
			type: 'text',
			order: 7,
		}),
	];
}
```

```typescript
// src/types/fields/conditions/UnderArtilleryFireCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class UnderArtilleryFireCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'Цель',
			type: 'text',
			order: 7,
			defaultValue: ''
		}),
	];
}
```

```typescript
// src/types/fields/conditions/HealthBuffCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class HealthBuffCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'Баффы',
			type: 'array',
			order: 7,
			defaultValue: [],
			options: ['Buffs_Obdolbos', 'Buffs_Frostbite']
		}),
	];
}
```

```typescript
// src/types/fields/conditions/ArenaPlayerInTeamPlaceCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class ArenaPlayerInTeamPlaceCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'select',
			options: ['>=', '<=', '==', '>', '<'],
			order: 7,
			defaultValue: '<='
		}),
		Field.create({
			key: 'value',
			label: 'Значение',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
	];
}
```

```typescript
// src/types/fields/conditions/GlobalVariableValueCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class GlobalVariableValueCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'ID переменной',
			type: 'text',
			order: 7,
		}),
		Field.create({
			key: 'value',
			label: 'Значение',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'select',
			options: ['>=', '<=', '==', '>', '<'],
			order: 9,
			defaultValue: '=='
		}),
	];
}
```

```typescript
// src/types/fields/conditions/TimeCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class TimeCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'compareMethod',
			label: 'Метод сравнения',
			type: 'select',
			options: ['>=', '<=', '==', '>', '<'],
			order: 7,
			defaultValue: '>='
		}),
		Field.create({
			key: 'value',
			label: 'Значение (сек)',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
	];
}
```

```typescript
// src/types/fields/conditions/SellItemToTraderCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field, ItemField } from "@/types/fields/fields";

export class SellItemToTraderCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		ItemField.create({
			key: 'target',
			label: 'ID предметов',
			order: 7,
			type: 'arrayItemChoice',
			storeId: "items",
		}),
		Field.create({
			key: 'value',
			label: 'Количество',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'traderId',
			label: 'ID торговца',
			type: 'text',
			order: 9,
		}),
		Field.create({
			key: 'dogtagLevel',
			label: 'Уровень жетона',
			type: 'number',
			order: 10,
			defaultValue: 0
		}),
		Field.create({
			key: 'onlyFoundInRaid',
			label: 'Только найдено в рейде',
			type: 'boolean',
			order: 11,
			defaultValue: false
		}),
		Field.create({
			key: 'minDurability',
			label: 'Мин. прочность',
			type: 'number',
			order: 12,
			defaultValue: 0
		}),
		Field.create({
			key: 'maxDurability',
			label: 'Макс. прочность',
			type: 'number',
			order: 13,
			defaultValue: 100
		}),
	];
}
```

```typescript
// src/types/fields/conditions/WeaponAssemblyCondition.ts

import { BaseCondition } from "./BaseCondition";
import { Field } from "@/types/fields/fields";

export class WeaponAssemblyCondition extends BaseCondition {
	static fields: Field[] = [
		...BaseCondition.fields,
		Field.create({
			key: 'target',
			label: 'ID оружия',
			type: 'array',
			order: 7,
			defaultValue: []
		}),
		Field.create({
			key: 'value',
			label: 'Количество',
			type: 'number',
			order: 8,
			defaultValue: 0
		}),
		Field.create({
			key: 'containsItems',
			label: 'Содержит предметы',
			type: 'array',
			order: 9,
			defaultValue: []
		}),
		Field.create({
			key: 'hasItemFromCategory',
			label: 'Имеет предмет из категории',
			type: 'array',
			order: 10,
			defaultValue: []
		}),
		Field.create({
			key: 'durability',
			label: 'Прочность',
			type: 'object',
			order: 11,
			nestedSchema: class DurabilitySchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'ergonomics',
			label: 'Эргономика',
			type: 'object',
			order: 12,
			nestedSchema: class ErgonomicsSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'recoil',
			label: 'Отдача',
			type: 'object',
			order: 13,
			nestedSchema: class RecoilSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '<=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'effectiveDistance',
			label: 'Эффективная дистанция',
			type: 'object',
			order: 14,
			nestedSchema: class EffectiveDistanceSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'weight',
			label: 'Вес',
			type: 'object',
			order: 15,
			nestedSchema: class WeightSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '<=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'width',
			label: 'Ширина',
			type: 'object',
			order: 16,
			nestedSchema: class WidthSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '<=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'height',
			label: 'Высота',
			type: 'object',
			order: 17,
			nestedSchema: class HeightSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '<=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'magazineCapacity',
			label: 'Емкость магазина',
			type: 'object',
			order: 18,
			nestedSchema: class MagazineCapacitySchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'baseAccuracy',
			label: 'Базовая точность',
			type: 'object',
			order: 19,
			nestedSchema: class BaseAccuracySchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'muzzleVelocity',
			label: 'Скорость пули',
			type: 'object',
			order: 20,
			nestedSchema: class MuzzleVelocitySchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
		Field.create({
			key: 'emptyTacticalSlot',
			label: 'Пустой тактический слот',
			type: 'object',
			order: 21,
			nestedSchema: class EmptyTacticalSlotSchema extends RecordSchema {
				static fields: Field[] = [
					Field.create({ key: 'compareMethod', type: 'select', options: ['>=', '<=', '=='], defaultValue: '>=', label: 'Метод сравнения' }),
					Field.create({ key: 'value', type: 'number', label: 'Значение', defaultValue: 0 }),
				]
			}
		}),
	];
}
```