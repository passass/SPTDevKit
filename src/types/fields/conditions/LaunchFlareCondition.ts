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