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