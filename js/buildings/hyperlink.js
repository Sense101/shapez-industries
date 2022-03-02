import { drawRotatedSprite } from "shapez/core/draw_utils";
import { Loader } from "shapez/core/loader";
import { formatItemsPerSecond, generateMatrixRotations } from "shapez/core/utils";
import {
    enumAngleToDirection,
    enumDirection,
    enumDirectionToAngle,
    enumDirectionToVector,
    enumInvertedDirections,
    Vector,
} from "shapez/core/vector";
import { BeltPath } from "shapez/game/belt_path";
import { MetaHubBuilding } from "shapez/game/buildings/hub";
import { BeltUnderlaysComponent } from "shapez/game/components/belt_underlays";
import { ItemAcceptorComponent } from "shapez/game/components/item_acceptor";
import { ItemEjectorComponent } from "shapez/game/components/item_ejector";
import { StaticMapEntityComponent } from "shapez/game/components/static_map_entity";
import { Entity } from "shapez/game/entity";
import { HUDBuildingPlacer } from "shapez/game/hud/parts/building_placer";
import { defaultBuildingVariant, MetaBuilding } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { ItemEjectorSystem } from "shapez/game/systems/item_ejector";
import { ModInterface } from "shapez/mods/mod_interface";
import { SOUNDS } from "shapez/platform/sound";
import { T } from "shapez/translations";
import { HyperlinkComponent } from "../components/hyperlink";
import { HyperlinkAcceptorComponent } from "../components/hyperlink_acceptor";
import { HyperlinkEjectorComponent } from "../components/hyperlink_ejector";
import { newHubGoalRewards } from "../new_hub_goals";

/** @enum {string} */
export const enumHyperlinkVariants = {
    entrance: "entrance",
    exit: "exit",
    //do stuff in all this code with this
};

export const arrayHyperlinkVariantToRotation = [enumDirection.top, enumDirection.left, enumDirection.right];

export const hyperlinkOverlayMatrices = {
    [enumDirection.top]: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
    [enumDirection.left]: generateMatrixRotations([0, 0, 0, 1, 1, 0, 0, 1, 0]),
    [enumDirection.right]: generateMatrixRotations([0, 0, 0, 0, 1, 1, 0, 1, 0]),
};

export class MetaHyperlinkBuilding extends MetaBuilding {
    constructor() {
        super("hyperlink");
    }

    static getAllVariantCombinations() {
        return [
            {
                name: "Hyperlink",
                description:
                    "Transports up to three belts at near-instant speed between an entrance and an exit. Can also output into the hub.",
                variant: defaultBuildingVariant,
                rotationVariant: 0,
            },
            {
                name: "Hyperlink",
                description:
                    "Transports up to three belts at near-instant speed between an entrance and an exit. Can also output into the hub.",
                variant: defaultBuildingVariant,
                rotationVariant: 1,
            },
            {
                name: "Hyperlink",
                description:
                    "Transports up to three belts at near-instant speed between an entrance and an exit. Can also output into the hub.",
                variant: defaultBuildingVariant,
                rotationVariant: 2,
            },
            {
                name: "Hyperlink Entrance",
                description: "Inputs up to three belts onto a hyperlink.",
                variant: enumHyperlinkVariants.entrance,
            },
            {
                name: "Hyperlink Exit",
                description: "Recieves items from a hyperlink and outputs them onto up to three belts.",
                variant: enumHyperlinkVariants.exit,
            },
        ];
    }

    getDimensions(variant) {
        switch (variant) {
            case defaultBuildingVariant:
                return new Vector(1, 1);
            case enumHyperlinkVariants.entrance:
            case enumHyperlinkVariants.exit:
                return new Vector(1, 2);
            default:
                assertAlways(false, "Unknown hyperlink variant: " + variant);
        }
    }

    getPlacementSound(variant) {
        return SOUNDS.placeBelt;
    }

    getRotateAutomaticallyWhilePlacing(variant) {
        if (variant == defaultBuildingVariant) {
            return true;
        }
        return false;
    }

    getStayInPlacementMode() {
        return true;
    }

    getPreviewSprite(rotationVariant, variant) {
        return this.getSpriteFromLoader(rotationVariant, variant);
    }
    getSprite(rotationVariant, variant) {
        return this.getSpriteFromLoader(rotationVariant, variant);
    }
    getBlueprintSprite(rotationVariant, variant) {
        return this.getSpriteFromLoader(rotationVariant, variant, true);
    }
    getSpriteFromLoader(rotationVariant, variant, blueprint = false) {
        const basePath = blueprint ? "sprites/blueprints/" : "sprites/buildings/";

        if (variant == defaultBuildingVariant) {
            return Loader.getSprite(
                basePath +
                    this.id +
                    "-" +
                    variant +
                    "_" +
                    arrayHyperlinkVariantToRotation[rotationVariant] +
                    ".png"
            );
        }
        return Loader.getSprite(basePath + this.id + "-" + variant + ".png");
    }

    /**
     * @param {number} rotation
     * @param {number} rotationVariant
     * @param {string} variant
     * @param {Entity} entity
     * @returns {Array<number>|null}
     */
    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant, entity) {
        if (variant == defaultBuildingVariant) {
            /** @type {StaticMapEntityComponent} */
            return hyperlinkOverlayMatrices[arrayHyperlinkVariantToRotation[rotationVariant]][rotation];
        }
        return null;
    }

    /**
     * @param {GameRoot} root
     * @param {string} variant
     * @returns {Array<[string, string]>}
     */
    getAdditionalStatistics(root, variant) {
        const speed = root.hubGoals.getBeltBaseSpeed() * 3;
        return [[T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(speed)]];
    }

    getSilhouetteColor() {
        return "#9e91ec";
    }

    /**
     * @param {GameRoot} root
     */
    getAvailableVariants(root) {
        return [defaultBuildingVariant, enumHyperlinkVariants.entrance, enumHyperlinkVariants.exit];
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(newHubGoalRewards.reward_hyperlink);
    }

    getIsReplaceable(variant, rotationVariant) {
        if (variant == defaultBuildingVariant) {
            return true;
        }
        return false;
    }

    getHasDirectionLockAvailable(variant, rotationVariant) {
        if (variant == defaultBuildingVariant) {
            return true;
        }
        return false;
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(new HyperlinkComponent({}));
        entity.addComponent(new ItemAcceptorComponent({ slots: [] }));
        entity.addComponent(new ItemEjectorComponent({ slots: [], renderFloatingItems: false }));
        entity.addComponent(new HyperlinkAcceptorComponent({ slots: [] }));
        entity.addComponent(new HyperlinkEjectorComponent({ slots: [] }));
        entity.addComponent(new BeltUnderlaysComponent({ underlays: [] }));
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        switch (variant) {
            case defaultBuildingVariant: {
                entity.components[HyperlinkComponent.getId()].active = true;
                entity.components[HyperlinkComponent.getId()].maxItems = 1;
                entity.components.BeltUnderlays.underlays = [];
                entity.components.ItemAcceptor.setSlots([]);
                entity.components.ItemEjector.setSlots([]);

                entity.components[HyperlinkAcceptorComponent.getId()].setSlots([
                    { pos: new Vector(0, 0), direction: enumDirection.bottom },
                ]);

                switch (arrayHyperlinkVariantToRotation[rotationVariant]) {
                    case enumDirection.top: {
                        entity.components[HyperlinkEjectorComponent.getId()].setSlots([
                            { pos: new Vector(0, 0), direction: enumDirection.top },
                        ]);
                        break;
                    }
                    case enumDirection.left: {
                        entity.components[HyperlinkEjectorComponent.getId()].setSlots([
                            { pos: new Vector(0, 0), direction: enumDirection.left },
                        ]);
                        break;
                    }
                    case enumDirection.right: {
                        entity.components[HyperlinkEjectorComponent.getId()].setSlots([
                            { pos: new Vector(0, 0), direction: enumDirection.right },
                        ]);
                        break;
                    }
                    default: {
                        assertAlways(false, "Invalid hyperlink rotation variant");
                    }
                }
                break;
            }

            case enumHyperlinkVariants.entrance: {
                entity.components[HyperlinkComponent.getId()].active = false;
                entity.components[HyperlinkComponent.getId()].maxItems = 3;
                entity.components[HyperlinkAcceptorComponent.getId()].setSlots([]);
                entity.components[HyperlinkEjectorComponent.getId()].setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                    },
                ]);
                entity.components.ItemEjector.setSlots([]);
                entity.components.ItemAcceptor.setSlots([
                    {
                        pos: new Vector(0, 1),
                        direction: enumDirection.left,
                    },
                    {
                        pos: new Vector(0, 1),
                        direction: enumDirection.right,
                    },
                    {
                        pos: new Vector(0, 1),
                        direction: enumDirection.bottom,
                    },
                ]);

                entity.components.BeltUnderlays.underlays = [
                    {
                        pos: new Vector(0, 1),
                        direction: enumDirection.left,
                    },
                    {
                        pos: new Vector(0, 1),
                        direction: enumDirection.right,
                    },
                    {
                        pos: new Vector(0, 1),
                        direction: enumDirection.top,
                    },
                ];
                break;
            }
            case enumHyperlinkVariants.exit: {
                entity.components[HyperlinkComponent.getId()].active = false;
                entity.components[HyperlinkComponent.getId()].maxItems = 3;
                entity.components[HyperlinkAcceptorComponent.getId()].setSlots([
                    {
                        pos: new Vector(0, 1),
                        direction: enumDirection.bottom,
                    },
                ]);
                entity.components[HyperlinkEjectorComponent.getId()].setSlots([]);
                entity.components.ItemAcceptor.setSlots([]);
                entity.components.ItemEjector.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.left,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.right,
                    },
                ]);

                entity.components.BeltUnderlays.underlays = [
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.left,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.right,
                    },
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                    },
                ];
                break;
            }
            default:
                assertAlways(false, "Unknown hyperlink variant: " + variant);
        }
    }

    computeOptimalDirectionAndRotationVariantAtTile({ root, tile, rotation, variant, layer }) {
        if (variant !== defaultBuildingVariant) {
            return {
                rotation,
                rotationVariant: 0,
            };
        }

        const topDirection = enumAngleToDirection[rotation];
        const rightDirection = enumAngleToDirection[(rotation + 90) % 360];
        const bottomDirection = enumAngleToDirection[(rotation + 180) % 360];
        const leftDirection = enumAngleToDirection[(rotation + 270) % 360];

        const { hyperlinkEjectors, hyperlinkAcceptors } = getHyperlinkEjectorsAndAcceptorsAtTile(root, tile);

        let hasBottomEjector = false;
        let hasRightEjector = false;
        let hasLeftEjector = false;

        let hasTopAcceptor = false;
        let hasLeftAcceptor = false;
        let hasRightAcceptor = false;

        // Check all ejectors
        for (let i = 0; i < hyperlinkEjectors.length; ++i) {
            const ejector = hyperlinkEjectors[i];

            if (ejector.toDirection === topDirection) {
                hasBottomEjector = true;
            } else if (ejector.toDirection === leftDirection) {
                hasRightEjector = true;
            } else if (ejector.toDirection === rightDirection) {
                hasLeftEjector = true;
            }
        }

        // Check all acceptors
        for (let i = 0; i < hyperlinkAcceptors.length; ++i) {
            const acceptor = hyperlinkAcceptors[i];
            if (acceptor.fromDirection === bottomDirection) {
                hasTopAcceptor = true;
            } else if (acceptor.fromDirection === rightDirection) {
                hasLeftAcceptor = true;
            } else if (acceptor.fromDirection === leftDirection) {
                hasRightAcceptor = true;
            }
        }

        // Soo .. if there is any ejector below us we always prioritize
        // this ejector
        if (!hasBottomEjector) {
            // When something ejects to us from the left and nothing from the right,
            // do a curve from the left to the top

            if (hasRightEjector && !hasLeftEjector) {
                return {
                    rotation: (rotation + 270) % 360,
                    rotationVariant: 2,
                };
            }

            // When something ejects to us from the right and nothing from the left,
            // do a curve from the right to the top
            if (hasLeftEjector && !hasRightEjector) {
                return {
                    rotation: (rotation + 90) % 360,
                    rotationVariant: 1,
                };
            }
        }

        // When there is a top acceptor, ignore sides
        // NOTICE: This makes the belt prefer side turns *way* too much!
        if (!hasTopAcceptor) {
            // When there is an acceptor to the right but no acceptor to the left,
            // do a turn to the right
            if (hasRightAcceptor && !hasLeftAcceptor) {
                return {
                    rotation,
                    rotationVariant: 2,
                };
            }

            // When there is an acceptor to the left but no acceptor to the right,
            // do a turn to the left
            if (hasLeftAcceptor && !hasRightAcceptor) {
                return {
                    rotation,
                    rotationVariant: 1,
                };
            }
        }

        return {
            rotation,
            rotationVariant: 0,
        };
    }
}

function getHyperlinkEjectorsAndAcceptorsAtTile(root, tile) {
    let hyperlinkEjectors = [];
    let hyperlinkAcceptors = [];

    for (let dx = -1; dx <= 1; ++dx) {
        for (let dy = -1; dy <= 1; ++dy) {
            if (Math.abs(dx) + Math.abs(dy) !== 1) {
                continue;
            }

            const entity = root.map.getLayerContentXY(tile.x + dx, tile.y + dy, "regular");
            if (entity) {
                let hyperlinkEjectorSlots = [];
                let hyperlinkAcceptorSlots = [];

                const staticComp = entity.components.StaticMapEntity;
                /** @type {HyperlinkEjectorComponent} */
                const hyperlinkEjector = entity.components[HyperlinkEjectorComponent.getId()];
                /** @type {HyperlinkAcceptorComponent} */
                const hyperlinkAcceptor = entity.components[HyperlinkAcceptorComponent.getId()];

                if (hyperlinkEjector) {
                    hyperlinkEjectorSlots = hyperlinkEjector.slots.slice();
                }

                if (hyperlinkAcceptor) {
                    hyperlinkAcceptorSlots = hyperlinkAcceptor.slots.slice();
                }

                for (let i = 0; i < hyperlinkEjectorSlots.length; ++i) {
                    const slot = hyperlinkEjectorSlots[i];
                    const wsTile = staticComp.localTileToWorld(slot.pos);
                    const wsDirection = staticComp.localDirectionToWorld(slot.direction);
                    const targetTile = wsTile.add(enumDirectionToVector[wsDirection]);
                    if (targetTile.equals(tile)) {
                        hyperlinkEjectors.push({
                            entity,
                            slot,
                            fromTile: wsTile,
                            toDirection: wsDirection,
                        });
                    }
                }

                for (let i = 0; i < hyperlinkAcceptorSlots.length; ++i) {
                    const slot = hyperlinkAcceptorSlots[i];
                    const wsTile = staticComp.localTileToWorld(slot.pos);
                    const direction = slot.direction;
                    const wsDirection = staticComp.localDirectionToWorld(direction);

                    const sourceTile = wsTile.add(enumDirectionToVector[wsDirection]);
                    if (sourceTile.equals(tile)) {
                        hyperlinkAcceptors.push({
                            entity,
                            slot,
                            toTile: wsTile,
                            fromDirection: wsDirection,
                        });
                    }
                }
            }
        }
    }
    return { hyperlinkEjectors, hyperlinkAcceptors };
}

// --------------------------------------- //

/**
 * @param {ModInterface} modInterface
 */
export function addHyperlinkOutputCheck(modInterface) {
    modInterface.replaceMethod(
        ItemEjectorSystem,
        "tryPassOverItem",
        function ($original, [item, reciever, slotIndex]) {
            const hyperlinkComp = reciever.components[HyperlinkComponent.getId()];
            if (hyperlinkComp) {
                if (hyperlinkComp.tryTakeItem(item)) {
                    return true;
                }
                return false;
            }
            return $original(item, reciever, slotIndex);
        }
    );
    modInterface.replaceMethod(
        BeltPath,
        "computePassOverFunctionWithoutBelts",
        function ($original, [entity, matchingSlotIndex]) {
            const hyperlinkComp = entity.components[HyperlinkComponent.getId()];
            if (hyperlinkComp) {
                return function (item) {
                    if (hyperlinkComp.tryTakeItem(item)) {
                        return true;
                    }
                };
            }
            return $original(entity, matchingSlotIndex);
        }
    );
}

// --------------------------------------- //

/**
 * @param {ModInterface} modInterface
 */
export function addHyperlinkSlotPreviews(modInterface) {
    modInterface.replaceMethod(
        HUDBuildingPlacer,
        "drawMatchingAcceptorsAndEjectors",
        function ($original, [parameters]) {
            const acceptorComp = this.fakeEntity.components.ItemAcceptor;
            const ejectorComp = this.fakeEntity.components.ItemEjector;
            const hyperlinkAcceptorComp = this.fakeEntity.components["HyperlinkAcceptor"];
            const hyperlinkEjectorComp = this.fakeEntity.components["HyperlinkEjector"];
            const staticComp = this.fakeEntity.components.StaticMapEntity;
            const beltComp = this.fakeEntity.components.Belt;
            const minerComp = this.fakeEntity.components.Miner;

            const goodArrowSprite = Loader.getSprite("sprites/misc/slot_good_arrow.png");
            const badArrowSprite = Loader.getSprite("sprites/misc/slot_bad_arrow.png");
            const goodHyperlinkArrowSprite = Loader.getSprite("sprites/misc/hyperlink_good_arrow.png");

            // Just ignore the following code please ... thanks!

            const offsetShift = 10;

            let acceptorSlots = [];
            let ejectorSlots = [];
            let hyperlinkAcceptorSlots = [];
            let hyperlinkEjectorSlots = [];

            if (ejectorComp) {
                ejectorSlots = ejectorComp.slots.slice();
            }

            if (acceptorComp) {
                acceptorSlots = acceptorComp.slots.slice();
            }

            if (hyperlinkEjectorComp) {
                hyperlinkEjectorSlots = hyperlinkEjectorComp.slots.slice();
            }

            if (hyperlinkAcceptorComp) {
                hyperlinkAcceptorSlots = hyperlinkAcceptorComp.slots.slice();
            }

            if (beltComp) {
                const fakeEjectorSlot = beltComp.getFakeEjectorSlot();
                const fakeAcceptorSlot = beltComp.getFakeAcceptorSlot();
                ejectorSlots.push(fakeEjectorSlot);
                acceptorSlots.push(fakeAcceptorSlot);
            }

            for (let acceptorSlotIndex = 0; acceptorSlotIndex < acceptorSlots.length; ++acceptorSlotIndex) {
                const slot = acceptorSlots[acceptorSlotIndex];

                const acceptorSlotWsTile = staticComp.localTileToWorld(slot.pos);
                const acceptorSlotWsPos = acceptorSlotWsTile.toWorldSpaceCenterOfTile();

                // Go over all slots
                for (let acceptorDirectionIndex = 0; acceptorDirectionIndex < 1; ++acceptorDirectionIndex) {
                    const direction = slot.direction;
                    const worldDirection = staticComp.localDirectionToWorld(direction);

                    // Figure out which tile ejects to this slot
                    const sourceTile = acceptorSlotWsTile.add(enumDirectionToVector[worldDirection]);

                    let isBlocked = false;
                    let isConnected = false;

                    // Find all entities which are on that tile
                    const sourceEntities = this.root.map.getLayersContentsMultipleXY(
                        sourceTile.x,
                        sourceTile.y
                    );

                    // Check for every entity:
                    for (let i = 0; i < sourceEntities.length; ++i) {
                        const sourceEntity = sourceEntities[i];
                        const sourceEjector = sourceEntity.components.ItemEjector;
                        const sourceBeltComp = sourceEntity.components.Belt;
                        const sourceStaticComp = sourceEntity.components.StaticMapEntity;
                        const ejectorAcceptLocalTile = sourceStaticComp.worldToLocalTile(acceptorSlotWsTile);

                        // If this entity is on the same layer as the slot - if so, it can either be
                        // connected, or it can not be connected and thus block the input
                        if (sourceEjector && sourceEjector.anySlotEjectsToLocalTile(ejectorAcceptLocalTile)) {
                            // This one is connected, all good
                            isConnected = true;
                        } else if (
                            sourceBeltComp &&
                            sourceStaticComp.localDirectionToWorld(sourceBeltComp.direction) ===
                                enumInvertedDirections[worldDirection]
                        ) {
                            // Belt connected
                            isConnected = true;
                        } else {
                            // This one is blocked
                            isBlocked = true;
                        }
                    }

                    const alpha = isConnected || isBlocked ? 1.0 : 0.3;
                    const sprite = isBlocked ? badArrowSprite : goodArrowSprite;

                    parameters.context.globalAlpha = alpha;
                    drawRotatedSprite({
                        parameters,
                        sprite,
                        x: acceptorSlotWsPos.x,
                        y: acceptorSlotWsPos.y,
                        //@ts-ignore doesn't recognise it
                        angle: Math.radians(enumDirectionToAngle[enumInvertedDirections[worldDirection]]),
                        size: 13,
                        offsetY: offsetShift + 13,
                    });
                    parameters.context.globalAlpha = 1;
                }
            }

            for (
                let acceptorSlotIndex = 0;
                acceptorSlotIndex < hyperlinkAcceptorSlots.length;
                ++acceptorSlotIndex
            ) {
                const slot = hyperlinkAcceptorSlots[acceptorSlotIndex];

                const acceptorSlotWsTile = staticComp.localTileToWorld(slot.pos);
                const acceptorSlotWsPos = acceptorSlotWsTile.toWorldSpaceCenterOfTile();
                if (!slot) {
                    continue;
                }
                // Go over all slots
                for (let acceptorDirectionIndex = 0; acceptorDirectionIndex < 1; ++acceptorDirectionIndex) {
                    const direction = slot.direction;
                    const worldDirection = staticComp.localDirectionToWorld(direction);

                    // Figure out which tile ejects to this slot
                    const sourceTile = acceptorSlotWsTile.add(enumDirectionToVector[worldDirection]);

                    let isBlocked = false;
                    let isConnected = false;

                    // Find all entities which are on that tile
                    const sourceEntities = this.root.map.getLayersContentsMultipleXY(
                        sourceTile.x,
                        sourceTile.y
                    );

                    // Check for every entity:
                    for (let i = 0; i < sourceEntities.length; ++i) {
                        const sourceEntity = sourceEntities[i];
                        const sourceEjector = sourceEntity.components["HyperlinkEjector"];
                        const sourceStaticComp = sourceEntity.components.StaticMapEntity;
                        const ejectorAcceptLocalTile = sourceStaticComp.worldToLocalTile(acceptorSlotWsTile);

                        // If this entity is on the same layer as the slot - if so, it can either be
                        // connected, or it can not be connected and thus block the input
                        if (sourceEjector && sourceEjector.anySlotEjectsToLocalTile(ejectorAcceptLocalTile)) {
                            // This one is connected, all good
                            isConnected = true;
                        } else {
                            // This one is blocked
                            isBlocked = true;
                        }
                    }

                    const alpha = isConnected || isBlocked ? 1.0 : 0.3;
                    const sprite = isBlocked ? badArrowSprite : goodHyperlinkArrowSprite;

                    parameters.context.globalAlpha = alpha;
                    drawRotatedSprite({
                        parameters,
                        sprite,
                        x: acceptorSlotWsPos.x,
                        y: acceptorSlotWsPos.y,
                        //@ts-ignore same as above
                        angle: Math.radians(enumDirectionToAngle[enumInvertedDirections[worldDirection]]),
                        size: 13,
                        offsetY: offsetShift + 13,
                    });
                    parameters.context.globalAlpha = 1;
                }
            }

            // Go over all slots
            for (let ejectorSlotIndex = 0; ejectorSlotIndex < ejectorSlots.length; ++ejectorSlotIndex) {
                const slot = ejectorSlots[ejectorSlotIndex];

                const ejectorSlotLocalTile = slot.pos.add(enumDirectionToVector[slot.direction]);
                const ejectorSlotWsTile = staticComp.localTileToWorld(ejectorSlotLocalTile);

                const ejectorSLotWsPos = ejectorSlotWsTile.toWorldSpaceCenterOfTile();
                const ejectorSlotWsDirection = staticComp.localDirectionToWorld(slot.direction);

                let isBlocked = false;
                let isConnected = false;

                // Find all entities which are on that tile
                const destEntities = this.root.map.getLayersContentsMultipleXY(
                    ejectorSlotWsTile.x,
                    ejectorSlotWsTile.y
                );

                // Check for every entity:
                for (let i = 0; i < destEntities.length; ++i) {
                    const destEntity = destEntities[i];
                    const destAcceptor = destEntity.components.ItemAcceptor;
                    const destStaticComp = destEntity.components.StaticMapEntity;
                    const destMiner = destEntity.components.Miner;

                    const destLocalTile = destStaticComp.worldToLocalTile(ejectorSlotWsTile);
                    const destLocalDir = destStaticComp.worldDirectionToLocal(ejectorSlotWsDirection);
                    if (destAcceptor && destAcceptor.findMatchingSlot(destLocalTile, destLocalDir)) {
                        // This one is connected, all good
                        isConnected = true;
                    } else if (destEntity.components.Belt && destLocalDir === enumDirection.top) {
                        // Connected to a belt
                        isConnected = true;
                    } else if (minerComp && minerComp.chainable && destMiner && destMiner.chainable) {
                        // Chainable miners connected to eachother
                        isConnected = true;
                    } else {
                        // This one is blocked
                        isBlocked = true;
                    }
                }

                const alpha = isConnected || isBlocked ? 1.0 : 0.3;
                const sprite = isBlocked ? badArrowSprite : goodArrowSprite;

                parameters.context.globalAlpha = alpha;
                drawRotatedSprite({
                    parameters,
                    sprite,
                    x: ejectorSLotWsPos.x,
                    y: ejectorSLotWsPos.y,
                    //@ts-ignore same as above
                    angle: Math.radians(enumDirectionToAngle[ejectorSlotWsDirection]),
                    size: 13,
                    offsetY: offsetShift,
                });
                parameters.context.globalAlpha = 1;
            }

            // Go over all slots
            for (
                let ejectorSlotIndex = 0;
                ejectorSlotIndex < hyperlinkEjectorSlots.length;
                ++ejectorSlotIndex
            ) {
                const slot = hyperlinkEjectorSlots[ejectorSlotIndex];

                const ejectorSlotLocalTile = slot.pos.add(enumDirectionToVector[slot.direction]);
                const ejectorSlotWsTile = staticComp.localTileToWorld(ejectorSlotLocalTile);

                const ejectorSLotWsPos = ejectorSlotWsTile.toWorldSpaceCenterOfTile();
                const ejectorSlotWsDirection = staticComp.localDirectionToWorld(slot.direction);

                let isBlocked = false;
                let isConnected = false;

                // Find all entities which are on that tile
                const destEntities = this.root.map.getLayersContentsMultipleXY(
                    ejectorSlotWsTile.x,
                    ejectorSlotWsTile.y
                );

                // Check for every entity:
                for (let i = 0; i < destEntities.length; ++i) {
                    const destEntity = destEntities[i];
                    const destAcceptor = destEntity.components["HyperlinkAcceptor"];
                    const destStaticComp = destEntity.components.StaticMapEntity;

                    const destLocalTile = destStaticComp.worldToLocalTile(ejectorSlotWsTile);
                    const destLocalDir = destStaticComp.worldDirectionToLocal(ejectorSlotWsDirection);
                    if (destAcceptor && destAcceptor.findMatchingSlot(destLocalTile, destLocalDir)) {
                        // This one is connected, all good
                        isConnected = true;
                    } else {
                        // This one is blocked
                        isBlocked = true;
                    }
                }

                const alpha = isConnected || isBlocked ? 1.0 : 0.3;
                const sprite = isBlocked ? badArrowSprite : goodHyperlinkArrowSprite;

                parameters.context.globalAlpha = alpha;
                drawRotatedSprite({
                    parameters,
                    sprite,
                    x: ejectorSLotWsPos.x,
                    y: ejectorSLotWsPos.y,
                    //@ts-ignore same as above
                    angle: Math.radians(enumDirectionToAngle[ejectorSlotWsDirection]),
                    size: 13,
                    offsetY: offsetShift,
                });
                parameters.context.globalAlpha = 1;
            }
        }
    );
}
