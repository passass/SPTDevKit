// src/types/fields/conditions/AvailableForFinishCondition.ts

import { SchemaChoicer, type SchemaChoice, createSchemaChoiceForCondition } from "@/types/fields/fieldsSchemaChoicer.ts";
import { HandoverItemCondition } from "./HandoverItemCondition.ts";
import { CounterCreatorCondition } from "./CounterCreatorCondition.ts";
import { FindItemCondition } from "./FindItemCondition.ts";
import { QuestCondition } from "./QuestCondition.ts";
import { KillsCondition } from "./KillsCondition.ts";
import { LeaveItemAtLocationCondition } from "./LeaveItemAtLocationCondition.ts";
import { PlaceBeaconCondition } from "./PlaceBeaconCondition.ts";
import { VisitPlaceCondition } from "./VisitPlaceCondition.ts";
import { EquipmentCondition } from "./EquipmentCondition.ts";
import { HealthEffectCondition } from "./HealthEffectCondition.ts";
import { SkillCondition } from "./SkillCondition.ts";
import { TraderLoyaltyCondition } from "./TraderLoyaltyCondition.ts";
import { TraderStandingCondition } from "./TraderStandingCondition.ts";
import { HideoutAreaCondition } from "./HideoutAreaCondition.ts";
import { LaunchFlareCondition } from "./LaunchFlareCondition.ts";
import { UnderArtilleryFireCondition } from "./UnderArtilleryFireCondition.ts";
import { HealthBuffCondition } from "./HealthBuffCondition.ts";
import { SellItemToTraderCondition } from "./SellItemToTraderCondition.ts";
import { WeaponAssemblyCondition } from "./WeaponAssemblyCondition.ts";
import { ShotsCondition } from "./ShotsCondition.ts";
import { ExitNameCondition } from "./ExitNameCondition.ts";
import { InZoneCondition } from "./InZoneCondition.ts";
import { ArenaMatchPlaceCondition } from "./ArenaMatchPlaceCondition.ts";
import { ArenaGameModeCondition } from "./ArenaGameModeCondition.ts";
import { ArenaPlayerInTeamPlaceCondition } from "./ArenaPlayerInTeamPlaceCondition.ts";
import { GlobalVariableValueCondition } from "./GlobalVariableValueCondition.ts";
import { TimeCondition } from "./TimeCondition.ts";

export class AvailableForFinishCondition extends SchemaChoicer {
	static schemas: SchemaChoice[] = [
		createSchemaChoiceForCondition({ name: "HandoverItemCondition", schema: HandoverItemCondition }),
		createSchemaChoiceForCondition({ name: "CounterCreatorCondition", schema: CounterCreatorCondition }),
		createSchemaChoiceForCondition({ name: "FindItemCondition", schema: FindItemCondition }),
		createSchemaChoiceForCondition({ name: "QuestCondition", schema: QuestCondition }),
		createSchemaChoiceForCondition({ name: "KillsCondition", schema: KillsCondition }),
		createSchemaChoiceForCondition({ name: "ShotsCondition", schema: ShotsCondition }),
		createSchemaChoiceForCondition({ name: "LeaveItemAtLocationCondition", schema: LeaveItemAtLocationCondition }),
		createSchemaChoiceForCondition({ name: "PlaceBeaconCondition", schema: PlaceBeaconCondition }),
		createSchemaChoiceForCondition({ name: "VisitPlaceCondition", schema: VisitPlaceCondition }),
		createSchemaChoiceForCondition({ name: "EquipmentCondition", schema: EquipmentCondition }),
		createSchemaChoiceForCondition({ name: "HealthEffectCondition", schema: HealthEffectCondition }),
		createSchemaChoiceForCondition({ name: "SkillCondition", schema: SkillCondition }),
		createSchemaChoiceForCondition({ name: "TraderLoyaltyCondition", schema: TraderLoyaltyCondition }),
		createSchemaChoiceForCondition({ name: "TraderStandingCondition", schema: TraderStandingCondition }),
		createSchemaChoiceForCondition({ name: "HideoutAreaCondition", schema: HideoutAreaCondition }),
		createSchemaChoiceForCondition({ name: "LaunchFlareCondition", schema: LaunchFlareCondition }),
		createSchemaChoiceForCondition({ name: "UnderArtilleryFireCondition", schema: UnderArtilleryFireCondition }),
		createSchemaChoiceForCondition({ name: "HealthBuffCondition", schema: HealthBuffCondition }),
		createSchemaChoiceForCondition({ name: "SellItemToTraderCondition", schema: SellItemToTraderCondition }),
		createSchemaChoiceForCondition({ name: "WeaponAssemblyCondition", schema: WeaponAssemblyCondition }),
		createSchemaChoiceForCondition({ name: "ExitNameCondition", schema: ExitNameCondition }),
		createSchemaChoiceForCondition({ name: "InZoneCondition", schema: InZoneCondition }),
		createSchemaChoiceForCondition({ name: "ArenaMatchPlaceCondition", schema: ArenaMatchPlaceCondition }),
		createSchemaChoiceForCondition({ name: "ArenaGameModeCondition", schema: ArenaGameModeCondition }),
		createSchemaChoiceForCondition({ name: "ArenaPlayerInTeamPlaceCondition", schema: ArenaPlayerInTeamPlaceCondition }),
		createSchemaChoiceForCondition({ name: "GlobalVariableValueCondition", schema: GlobalVariableValueCondition }),
		createSchemaChoiceForCondition({ name: "TimeCondition", schema: TimeCondition }),
	];
}