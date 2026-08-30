import RecordEditor from "@/components/RecordEditor.vue";
import { Field, RecordSchema } from "../fields";
import { createLazySchemaChoicer } from "@/utils/lazySchemaLoader";
export class RewardsSchemas extends RecordSchema {
	static fields: Field[] = [
		Field.create({
			key: 'Success',
			label: 'Success',
			type: 'array',
			order: 1,
			arrayItemSchema: createLazySchemaChoicer(
				"questsSchemas.json",
				"*.rewards.Success",
				"SuccessReward"
			)
		}),
		Field.create({
			key: 'Started',
			label: 'Started',
			type: 'array',
			order: 2,
			arrayItemSchema: createLazySchemaChoicer(
				"questsSchemas.json",
				"*.rewards.Started",
				"StartedReward"
			)
		}),
		Field.create({
			key: 'Fail',
			label: 'Fail',
			type: 'array',
			order: 3,
			arrayItemSchema: createLazySchemaChoicer(
				"questsSchemas.json",
				"*.rewards.Fail",
				"FailReward"
			)
		}),
	];
}
