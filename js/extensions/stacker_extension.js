import { Loader } from "shapez/core/loader";
import { formatItemsPerSecond } from "shapez/core/utils";
import { enumDirection, Vector } from "shapez/core/vector";
import { MetaStackerBuilding } from "shapez/game/buildings/stacker";
import { enumItemProcessorTypes } from "shapez/game/components/item_processor";
import { Entity } from "shapez/game/entity";
import { MOD_ITEM_PROCESSOR_SPEEDS } from "shapez/game/hub_goals";
import { ShapeItem } from "shapez/game/items/shape_item";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { ItemProcessorSystem, MOD_ITEM_PROCESSOR_HANDLERS } from "shapez/game/systems/item_processor";
import { ModInterface } from "shapez/mods/mod_interface";
import { T } from "shapez/translations";
import { newHubGoalRewards } from "../new_hub_goals";

export const quadStackerVariant = "quad";
const shapeCombinerProcessorType = "stacker-quad";

export const StackerExtension = ({ $old }) => ({
    getPreviewSprite(rotationVariant, variant) {
        return this.getSpriteFromLoader(rotationVariant, variant);
    },
    getSprite(rotationVariant, variant) {
        return this.getSpriteFromLoader(rotationVariant, variant);
    },
    getBlueprintSprite(rotationVariant, variant) {
        return this.getSpriteFromLoader(rotationVariant, variant, true);
    },
    getSpriteFromLoader(rotationVariant, variant, blueprint = false) {
        const basePath = blueprint ? "sprites/blueprints/" : "sprites/buildings/";

        return Loader.getSprite(
            basePath + this.id + (variant === defaultBuildingVariant ? "" : "-" + variant) + ".png"
        );
    },

    getAvailableVariants(root) {
        if (root.hubGoals.isRewardUnlocked(newHubGoalRewards.reward_quad_stacker)) {
            return [defaultBuildingVariant, quadStackerVariant];
        }
        return [defaultBuildingVariant];
    },

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        const processorComp = entity.components.ItemProcessor;
        const acceptorComp = entity.components.ItemAcceptor;

        const quad = variant == quadStackerVariant;
        if (quad) {
            processorComp.type = shapeCombinerProcessorType;
            processorComp.processingRequirement = shapeCombinerProcessorType;
            acceptorComp.setSlots([
                {
                    pos: new Vector(0, 0),
                    direction: enumDirection.left,
                    filter: "shape",
                },
                {
                    pos: new Vector(0, 0),
                    direction: enumDirection.bottom,
                    filter: "shape",
                },
                {
                    pos: new Vector(1, 0),
                    direction: enumDirection.bottom,
                    filter: "shape",
                },
                {
                    pos: new Vector(2, 0),
                    direction: enumDirection.bottom,
                    filter: "shape",
                },
            ]);
        } else {
            processorComp.type = enumItemProcessorTypes.stacker;
            processorComp.processingRequirement = null;

            acceptorComp.setSlots([
                {
                    pos: new Vector(0, 0),
                    direction: enumDirection.bottom,
                    filter: "shape",
                },
                {
                    pos: new Vector(1, 0),
                    direction: enumDirection.bottom,
                    filter: "shape",
                },
            ]);
        }
    },
});

// ---------------------------------- //

/**
 * @param {ModInterface} modInterface
 */
export function addQuadStackerProcessRequirement(modInterface) {
    modInterface.replaceMethod(ItemProcessorSystem, "canProcess", function ($original, [entity]) {
        const processorComp = entity.components.ItemProcessor;
        if (processorComp.processingRequirement == shapeCombinerProcessorType) {
            // First slot is the shape, so if it's not there we can't do anything
            const baseItem = /** @type {ShapeItem} */ (processorComp.inputSlots.get(0));
            if (!baseItem) {
                return false;
            }

            for (let i = 1; i < 3; i++) {
                const item = /** @type {ShapeItem} */ (processorComp.inputSlots.get(i));
                if (item) {
                    return true;
                }
            }

            return false;
        }
        return $original(entity);
    });
}

// ---------------------------------- //

/**
 * @this {ItemProcessorSystem}
 * @param {import("shapez/game/systems/item_processor").ProcessorImplementationPayload} payload
 */
function process_STACKER_QUAD(payload) {
    const baseItem = /** @type {ShapeItem} */ (payload.items.get(0));

    /** @type {Array<ShapeItem>} */
    const items = [null, null, null];
    for (let i = 0; i < items.length; i++) {
        const item = /** @type {ShapeItem} */ (payload.items.get(i + 1));
        if (item) {
            items[i] = item;
        }
    }

    let outDefinition = baseItem.definition;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item) {
            outDefinition = this.root.shapeDefinitionMgr.shapeActionStack(outDefinition, item.definition);
        }
    }

    payload.outItems.push({
        item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(outDefinition),
    });
}

/**
 * @param {ModInterface} modInterface
 */
export function addQuadStackerProcessorType(modInterface) {
    MOD_ITEM_PROCESSOR_HANDLERS[shapeCombinerProcessorType] = process_STACKER_QUAD;
    MOD_ITEM_PROCESSOR_SPEEDS[shapeCombinerProcessorType] = root =>
        root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes.stacker);
}

// ---------------------------------- //

/**
 * @param {ModInterface} modInterface
 */
export function addNewStackerVariants(modInterface) {
    modInterface.addVariantToExistingBuilding(
        //@ts-ignore
        MetaStackerBuilding,
        quadStackerVariant,
        {
            name: "Quad Stacker",
            description:
                "Stacks the three lower inputs onto the primary left input. Only one of the lower inputs is required, the rest are optional.",
            dimensions: new Vector(3, 1),
            additionalStatistics(root) {
                return [
                    [
                        T.ingame.buildingPlacement.infoTexts.speed,
                        formatItemsPerSecond(
                            root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes.stacker)
                        ),
                    ],
                ];
            },
        }
    );
}
