import { globalConfig } from "shapez/core/config";
import { formatItemsPerSecond } from "shapez/core/utils";
import { enumDirection, Vector } from "shapez/core/vector";
import { enumColors, enumColorsToHexCode } from "shapez/game/colors";
import { ItemAcceptorComponent } from "shapez/game/components/item_acceptor";
import { ItemEjectorComponent } from "shapez/game/components/item_ejector";
import { ItemProcessorComponent } from "shapez/game/components/item_processor";
import { Entity } from "shapez/game/entity";
import { MOD_ITEM_PROCESSOR_SPEEDS } from "shapez/game/hub_goals";
import { ShapeItem } from "shapez/game/items/shape_item";
import { defaultBuildingVariant, MetaBuilding } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { ShapeDefinition } from "shapez/game/shape_definition";
import { ItemProcessorSystem, MOD_ITEM_PROCESSOR_HANDLERS } from "shapez/game/systems/item_processor";
import { ModInterface } from "shapez/mods/mod_interface";
import { T } from "shapez/translations";
import { newHubGoalRewards } from "../new_hub_goals";

const shapeCompressorProcessorType = "shape_compressor";

export class MetaShapeCompressorBuilding extends MetaBuilding {
    constructor() {
        super("shape_compressor");
    }

    static getAllVariantCombinations() {
        return [
            {
                name: "Smelter",
                description:
                    "Superheats shape layers until they melt together into one. Drains away all color while processing.",
                variant: defaultBuildingVariant,
            },
        ];
    }

    getSilhouetteColor() {
        return "#0b8005"; //temp
    }

    getDimensions() {
        return new Vector(1, 2);
    }

    /**
     * @param {GameRoot} root
     * @returns {Array<[string, string]>}
     */
    getAdditionalStatistics(root) {
        const speed = getShapeCompressorSpeed(root);
        return [[T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(speed)]];
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(newHubGoalRewards.reward_shape_compressor);
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(
            new ItemProcessorComponent({
                processorType: shapeCompressorProcessorType,
                inputsPerCharge: 1,
            })
        );

        entity.addComponent(
            new ItemEjectorComponent({
                slots: [{ pos: new Vector(0, 0), direction: enumDirection.top }],
            })
        );
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [
                    {
                        pos: new Vector(0, 1),
                        direction: enumDirection.bottom,
                        filter: "shape",
                    },
                ],
            })
        );
    }
}

// ----------------------------------------- //

/**
 * Generates a definition for compressing a shape
 * @param {GameRoot} root
 * @param {ShapeDefinition} definition
 * @returns {ShapeDefinition}
 */
function shapeActionCompress(root, definition) {
    const definitionMgr = root.shapeDefinitionMgr;
    const key = "compress/" + definition.getHash();
    if (definitionMgr.operationCache[key]) {
        return /** @type {ShapeDefinition} */ (definitionMgr.operationCache[key]);
    }

    /** @type {import("../extensions/shape_definition_extension").ShapeLayer[]} */
    const newDefinition = definition.getClonedLayers();
    for (let i = 0; i < newDefinition.length; i++) {
        const layer = newDefinition[i];
        for (let quadIndex = 0; quadIndex < 4; ++quadIndex) {
            const quad = layer[quadIndex];
            if (quad) {
                quad.color = enumColors.uncolored;
                const lastItem = layer[(quadIndex + 3) % 4];
                const nextItem = layer[(quadIndex + 1) % 4];

                if (lastItem) {
                    quad.linkedBefore = true;
                }
                if (nextItem) {
                    quad.linkedAfter = true;
                }
            }
        }
    }
    return /** @type {ShapeDefinition} */ (
        definitionMgr.operationCache[key] = definitionMgr.registerOrReturnHandle(
            // @ts-ignore Yes, mine is different
            new ShapeDefinition({ layers: newDefinition })
        )
    );
}

/**
 * @this {ItemProcessorSystem}
 * @param {import("shapez/game/systems/item_processor").ProcessorImplementationPayload} payload
 */
function process_SHAPE_COMPRESSOR(payload) {
    const item = /** @type {ShapeItem} */ (payload.items.get(0));

    assert(item instanceof ShapeItem, "Input for item 1 is not a shape");

    const combinedDefinition = shapeActionCompress(this.root, item.definition);

    payload.outItems.push({
        item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(combinedDefinition),
    });
}

/**
 * @param {GameRoot} root
 */
function getShapeCompressorSpeed(root) {
    return (globalConfig.beltSpeedItemsPerSecond / 10) * root.hubGoals.upgradeImprovements.processors;
}

/**
 * @param {ModInterface} modInterface
 */
export function registerShapeCompressorProcessorType(modInterface) {
    MOD_ITEM_PROCESSOR_HANDLERS[shapeCompressorProcessorType] = process_SHAPE_COMPRESSOR;
    MOD_ITEM_PROCESSOR_SPEEDS[shapeCompressorProcessorType] = root => getShapeCompressorSpeed(root);
}
