import { formatItemsPerSecond } from "shapez/core/utils";
import { enumDirection, Vector } from "shapez/core/vector";
import { enumCutterVariants, MetaCutterBuilding } from "shapez/game/buildings/cutter";
import { enumItemProcessorTypes } from "shapez/game/components/item_processor";
import { enumPinSlotType, WiredPinsComponent } from "shapez/game/components/wired_pins";
import { Entity } from "shapez/game/entity";
import { MOD_ITEM_PROCESSOR_SPEEDS } from "shapez/game/hub_goals";
import { isTruthyItem } from "shapez/game/items/boolean_item";
import { ShapeItem } from "shapez/game/items/shape_item";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ItemProcessorSystem, MOD_ITEM_PROCESSOR_HANDLERS } from "shapez/game/systems/item_processor";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { ModInterface } from "shapez/mods/mod_interface";
import { T } from "shapez/translations";
import { newHubGoalRewards } from "../new_hub_goals";

export const laserCutterVariant = "laser";
const laserCutterProcessorType = "cutter_laser";

export const CutterExtension = ({ $old }) => ({
    getAvailableVariants(root) {
        /** @type {Array<string>} */
        let available = [defaultBuildingVariant];
        if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_cutter_quad)) {
            available.push(enumCutterVariants.quad);
        }
        if (root.hubGoals.isRewardUnlocked(newHubGoalRewards.reward_laser_cutter)) {
            available.push(laserCutterVariant);
        }
        return available;
    },

    /**
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        const hasPins = entity.components.WiredPins;
        if (variant == laserCutterVariant) {
            if (!hasPins) {
                entity.addComponent(
                    new WiredPinsComponent({
                        // in the order of shape corners
                        slots: [
                            {
                                pos: new Vector(1, 0),
                                type: enumPinSlotType.logicalAcceptor,
                                direction: enumDirection.top,
                            },
                            {
                                pos: new Vector(1, 0),
                                type: enumPinSlotType.logicalAcceptor,
                                direction: enumDirection.bottom,
                            },
                            {
                                pos: new Vector(0, 0),
                                type: enumPinSlotType.logicalAcceptor,
                                direction: enumDirection.bottom,
                            },
                            {
                                pos: new Vector(0, 0),
                                type: enumPinSlotType.logicalAcceptor,
                                direction: enumDirection.top,
                            },
                        ],
                    })
                );
            }
            entity.components.ItemEjector.setSlots([
                { pos: new Vector(1, 0), direction: enumDirection.right },
                { pos: new Vector(1, 0), direction: enumDirection.bottom },
            ]);
            entity.components.ItemAcceptor.setSlots([
                { pos: new Vector(0, 0), direction: enumDirection.left, filter: "shape" },
            ]);

            entity.components.ItemProcessor.type = laserCutterProcessorType;
        } else {
            if (hasPins) {
                entity.removeComponent(WiredPinsComponent);
            }

            $old.updateVariants(...arguments);
        }
    },
});

// --------------------------- //

/**
 * @this {ItemProcessorSystem}
 * @param {import("shapez/game/systems/item_processor").ProcessorImplementationPayload} payload
 */
function process_CUTTER_LASER(payload) {
    const item = /** @type {ShapeItem} */ (payload.items.get(0));

    const pinsComp = payload.entity.components.WiredPins;
    let wantedCorners = [0, 1, 2, 3];
    let unwantedCorners = [];
    for (let i = 0; i < 4; ++i) {
        const network = pinsComp.slots[i].linkedNetwork;
        const networkValue = network && network.hasValue() ? network.currentValue : null;
        if (networkValue && isTruthyItem(networkValue)) {
            wantedCorners.splice(i - 4 + wantedCorners.length, 1);
            unwantedCorners.push(i);
        }
    }

    const inputDefinition = item.definition;

    const outDefinitions = [
        inputDefinition.cloneFilteredByQuadrants(wantedCorners),
        inputDefinition.cloneFilteredByQuadrants(unwantedCorners),
    ];

    for (let i = 0; i < outDefinitions.length; ++i) {
        if (!outDefinitions[i].isEntirelyEmpty()) {
            payload.outItems.push({
                item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(outDefinitions[i]),
                requiredSlot: i,
            });
        }
    }
}

/**
 * @param {ModInterface} modInterface
 */
export function addLaserCutterProcessorType(modInterface) {
    MOD_ITEM_PROCESSOR_HANDLERS[laserCutterProcessorType] = process_CUTTER_LASER;
    MOD_ITEM_PROCESSOR_SPEEDS[laserCutterProcessorType] = root =>
        root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes.cutter);
}

// --------------------------- //

/**
 * @param {ModInterface} modInterface
 */
export function addNewCutterVariants(modInterface) {
    modInterface.addVariantToExistingBuilding(
        //@ts-ignore
        MetaCutterBuilding,
        laserCutterVariant,
        {
            name: "Laser Cutter",
            description:
                "Cuts shapes with laser precision, removing the corners indicated on the wires layer.",
            dimensions: new Vector(2, 1),
            additionalStatistics(root) {
                return [
                    [
                        T.ingame.buildingPlacement.infoTexts.speed,
                        formatItemsPerSecond(
                            root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes.cutter)
                        ),
                    ],
                ];
            },
        }
    );
}
