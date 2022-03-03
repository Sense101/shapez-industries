import { formatItemsPerSecond } from "shapez/core/utils";
import { enumDirection, Vector } from "shapez/core/vector";
import { enumColorMixingResults, enumColors } from "shapez/game/colors";
import { ItemAcceptorComponent } from "shapez/game/components/item_acceptor";
import { ItemEjectorComponent } from "shapez/game/components/item_ejector";
import { ItemProcessorComponent } from "shapez/game/components/item_processor";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant, MetaBuilding } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { enumSubShape, ShapeDefinition } from "shapez/game/shape_definition";
import { ModInterface } from "shapez/mods/mod_interface";
import { T } from "shapez/translations";
import { newHubGoalRewards } from "../new_hub_goals";
import {
    ItemProcessorSystem,
    MOD_ITEM_PROCESSOR_HANDLERS,
    ProcessorImplementationPayload,
} from "shapez/game/systems/item_processor";
import { ShapeItem } from "shapez/game/items/shape_item";
import { MOD_ITEM_PROCESSOR_SPEEDS } from "shapez/game/hub_goals";
import { globalConfig } from "shapez/core/config";
import { addModSubShapeType } from "../extensions/shape_definition_extension";
import { ShapeLayer } from "../extensions/shape_definition_extension";

/** @enum {string} */
export const enumCombinedShape = {
    circlestar: "circlestar",
    rectcircle: "rectcircle",
    starrect: "starrect",
    circlewindmill: "circlewindmill",
    rectwindmill: "rectwindmill",
    starwindmill: "starwindmill",
};

const s = enumSubShape;
const m = enumCombinedShape;
/** @enum {Object.<string, string>} */
const enumShapeCombiningResults = {
    [s.rect]: {
        [s.circle]: m.rectcircle,
        [s.star]: m.starrect,
        [s.windmill]: m.rectwindmill,
    },

    [s.circle]: {
        [s.rect]: m.rectcircle,
        [s.star]: m.circlestar,
        [s.windmill]: m.circlewindmill,
    },

    [s.star]: {
        [s.circle]: m.circlestar,
        [s.rect]: m.starrect,
        [s.windmill]: m.starwindmill,
    },

    [s.windmill]: {
        [s.circle]: m.circlewindmill,
        [s.star]: m.starwindmill,
        [s.rect]: m.rectwindmill,
    },

    // auto
    [enumCombinedShape.circlestar]: {},
    [enumCombinedShape.circlewindmill]: {},
    [enumCombinedShape.rectcircle]: {},
    [enumCombinedShape.rectwindmill]: {},
    [enumCombinedShape.starrect]: {},
    [enumCombinedShape.starwindmill]: {},
};

for (const key in enumShapeCombiningResults) {
    enumShapeCombiningResults[key][key] = key;
}

// autofill everything else
for (const combined in enumCombinedShape) {
    for (const shape in enumSubShape) {
        enumShapeCombiningResults[combined][shape] = combined;
        enumShapeCombiningResults[shape][combined] = combined;
    }
    for (const innerCombined in enumCombinedShape) {
        enumShapeCombiningResults[combined][innerCombined] = combined;
    }
}

const shapeCombinerProcessorType = "shape_combiner";

export class MetaShapeCombinerBuilding extends MetaBuilding {
    constructor() {
        super("shape_combiner");
    }

    static getAllVariantCombinations() {
        return [
            {
                name: "Shape Combiner",
                description: "Merges two shapes into one combined shape",
                variant: defaultBuildingVariant,
            },
        ];
    }

    getSilhouetteColor() {
        return "#0b8005";
    }

    getDimensions() {
        return new Vector(3, 1);
    }

    /**
     * @param {GameRoot} root
     * @returns {Array<[string, string]>}
     */
    getAdditionalStatistics(root) {
        const speed = getShapeCombinerSpeed(root);
        return [[T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(speed)]];
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(newHubGoalRewards.reward_shape_combiner);
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(
            new ItemProcessorComponent({
                processorType: shapeCombinerProcessorType,
                inputsPerCharge: 2,
                processingRequirement: shapeCombinerProcessorType,
            })
        );

        entity.addComponent(
            new ItemEjectorComponent({
                slots: [{ pos: new Vector(1, 0), direction: enumDirection.top }],
            })
        );
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                        filter: "shape",
                    },
                    {
                        pos: new Vector(2, 0),
                        direction: enumDirection.bottom,
                        filter: "shape",
                    },
                ],
            })
        );
    }
}

// -------------------------------------------------------- //

/**
 * combines two shape definitions
 * @param {ShapeDefinition} definition1
 * @param {ShapeDefinition} definition2
 */
function combineDefinitions(definition1, definition2) {
    let outDefinition = new ShapeDefinition({ layers: [] });

    const maxLayers = Math.max(definition1.layers.length, definition2.layers.length);

    for (let i = 0; i < maxLayers; ++i) {
        //handle one layer at a time
        /** @type {ShapeLayer} */
        const shape1 = definition1.layers[i];
        /** @type {ShapeLayer} */
        const shape2 = definition2.layers[i];
        /** @type {ShapeLayer} */
        let layerResult = [null, null, null, null];

        if (shape1 && shape2) {
            for (let quad = 0; quad < 4; ++quad) {
                let outColor;
                let outShape;

                if (shape1[quad] && shape2[quad]) {
                    const color1 = shape1[quad].color;
                    const color2 = shape2[quad].color;
                    const subShape1 = shape1[quad].subShape;
                    const subShape2 = shape2[quad].subShape;

                    //mix the colors!
                    if (color1 == enumColors.uncolored) {
                        outColor = enumColorMixingResults[color2][color1];
                    } else {
                        outColor = enumColorMixingResults[color1][color2];
                    }

                    outShape = enumShapeCombiningResults[subShape1][subShape2];
                } else if (shape1[quad]) {
                    outShape = shape1[quad].subShape;
                    outColor = shape1[quad].color;
                } else if (shape2[quad]) {
                    outShape = shape2[quad].subShape;
                    outColor = shape2[quad].color;
                }

                if (outColor && outShape) {
                    const shape1linkedBefore = shape1[quad]?.linkedBefore;
                    const shape2linkedBefore = shape2[quad]?.linkedBefore;

                    const shape1linkedAfter = shape1[quad]?.linkedAfter;
                    const shape2linkedAfter = shape2[quad]?.linkedAfter;
                    layerResult[quad] = {
                        linkedBefore: shape1linkedBefore || shape2linkedBefore,
                        linkedAfter: shape1linkedAfter || shape2linkedAfter,
                        subShape: outShape,
                        color: outColor,
                    };
                }
            }
        } else {
            layerResult = shape1 ? shape1 : shape2;
        }

        outDefinition.layers.push(layerResult);
    }

    return outDefinition;
}

/**
 * Generates a definition for combining two shapes together
 * @param {GameRoot} root
 * @param {ShapeDefinition} definition1
 * @param {ShapeDefinition} definition2
 * @returns {ShapeDefinition}
 */
function shapeActionCombine(root, definition1, definition2) {
    const definitionMgr = root.shapeDefinitionMgr;
    const key = "combine/" + definition1.getHash() + "/" + definition2.getHash();
    if (definitionMgr.operationCache[key]) {
        return /** @type {ShapeDefinition} */ (definitionMgr.operationCache[key]);
    }
    const combined = combineDefinitions(definition1, definition2);
    return /** @type {ShapeDefinition} */ (
        definitionMgr.operationCache[key] = definitionMgr.registerOrReturnHandle(combined)
    );
}

/**
 * @this {ItemProcessorSystem}
 * @param {ProcessorImplementationPayload} payload
 */
function process_SHAPE_COMBINER(payload) {
    const item1 = /** @type {ShapeItem} */ (payload.items.get(0));
    const item2 = /** @type {ShapeItem} */ (payload.items.get(1));

    assert(item1 instanceof ShapeItem, "Input for item 1 is not a shape");
    assert(item2 instanceof ShapeItem, "Input for item 2 is not a shape");

    const combinedDefinition = shapeActionCombine(this.root, item1.definition, item2.definition);

    payload.outItems.push({
        item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(combinedDefinition),
    });
}

/**
 * @param {GameRoot} root
 */
function getShapeCombinerSpeed(root) {
    return (globalConfig.beltSpeedItemsPerSecond / 6) * root.hubGoals.upgradeImprovements.processors;
}

/**
 * @param {ModInterface} modInterface
 */
export function registerShapeCombinerProcessorType(modInterface) {
    MOD_ITEM_PROCESSOR_HANDLERS[shapeCombinerProcessorType] = process_SHAPE_COMBINER;
    MOD_ITEM_PROCESSOR_SPEEDS[shapeCombinerProcessorType] = root => getShapeCombinerSpeed(root);
}

// ---------------------------------- //

/**
 * @param {ModInterface} modInterface
 */
export function addShapeCombinerProcessRequirement(modInterface) {
    modInterface.replaceMethod(ItemProcessorSystem, "canProcess", function ($original, [entity]) {
        const processorComp = entity.components.ItemProcessor;
        if (processorComp.processingRequirement == shapeCombinerProcessorType) {
            if (processorComp.inputCount < 2) {
                return false;
            }
            const shapeItem1 = /** @type {ShapeItem} */ (processorComp.inputSlots.get(0));
            const shapeItem2 = /** @type {ShapeItem} */ (processorComp.inputSlots.get(1));
            const layers1 = shapeItem1.definition.layers;
            const layers2 = shapeItem2.definition.layers;
            for (let i = 0; i < layers1.length; i++) {
                const layer1 = layers1[i];
                const layer2 = layers2[i];
                if (!(layer1 && layer2)) {
                    continue;
                }
                for (let j = 0; j < layer1.length; j++) {
                    if (layer1[j] && layer2[j]) {
                        // both quads exist
                        if (
                            layer1[j].linkedBefore ^ layer2[j].linkedBefore ||
                            layer1[j].linkedAfter ^ layer2[j].linkedAfter
                        ) {
                            // non-matching shapes
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        return $original(entity);
    });
}

// -------------------------------------------------------- //

/**
 * This works, I dont want to touch it again
 * @param {ModInterface} modInterface
 */
export function addCombinedShapeDefinitions(modInterface) {
    // circle-star
    addModSubShapeType(enumCombinedShape.circlestar, "1", function ({ context, dims }) {
        const moveInwards = dims * 0.1;
        const starPosition = dims * 0.55;
        context.lineTo(0, -dims);
        context.arc(0, 0, dims, -Math.PI * 0.5, -Math.PI * 0.35);
        context.lineTo(dims, -dims);
        context.lineTo(dims - moveInwards, -dims + starPosition);
        context.arc(0, 0, dims, -Math.PI * 0.13, 0);
    });
    // rect-circle
    addModSubShapeType(enumCombinedShape.rectcircle, "2", function ({ context, dims }) {
        const moveInwards = dims * 0.3;

        context.lineTo(0, -dims);
        context.lineTo(moveInwards, -dims);
        context.arc(moveInwards, -moveInwards, dims - moveInwards, -Math.PI * 0.5, 0);
        context.lineTo(dims, 0);
    });
    // star-rect
    addModSubShapeType(enumCombinedShape.starrect, "3", function ({ context, dims }) {
        const moveInwards = 0.05;
        context.lineTo(0, -dims);
        context.lineTo(moveInwards, -dims);
        context.lineTo(dims, -moveInwards);
        context.lineTo(dims, 0);
    });
    // circle-windmill
    addModSubShapeType(enumCombinedShape.circlewindmill, "4", function ({ context, dims }) {
        const moveInwards = dims * 0.5;
        context.lineTo(0, -moveInwards);
        context.lineTo(moveInwards, -dims);
        context.arcTo(dims, -dims, dims, -moveInwards, moveInwards);
        context.lineTo(dims, 0);
    });
    // rect-windmill
    addModSubShapeType(enumCombinedShape.rectwindmill, "5", function ({ context, dims }) {
        const moveInwards = dims * 0.2;
        context.lineTo(0, -dims + moveInwards);
        context.lineTo(dims, -dims + moveInwards);
        context.lineTo(dims, 0);
    });
    // star-windmill
    addModSubShapeType(enumCombinedShape.starwindmill, "6", function ({ context, dims }) {
        const moveInwards = dims * 0.6;
        context.lineTo(0, -dims);
        context.lineTo(dims, -dims);
        context.lineTo(moveInwards, 0);
    });
}
