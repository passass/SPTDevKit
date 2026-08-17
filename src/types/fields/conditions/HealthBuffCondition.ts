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