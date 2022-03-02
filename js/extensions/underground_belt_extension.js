import { globalConfig } from "shapez/core/config";
import { Loader } from "shapez/core/loader";
import { formatItemsPerSecond, generateMatrixRotations } from "shapez/core/utils";
import {
    enumAngleToDirection,
    enumDirection,
    enumDirectionToAngle,
    enumDirectionToVector,
    Vector,
} from "shapez/core/vector";
import {
    arrayUndergroundRotationVariantToMode,
    enumUndergroundBeltVariants,
    MetaUndergroundBeltBuilding,
} from "shapez/game/buildings/underground_belt";
import { ItemAcceptorComponent } from "shapez/game/components/item_acceptor";
import { ItemEjectorComponent } from "shapez/game/components/item_ejector";
import { enumUndergroundBeltMode, UndergroundBeltComponent } from "shapez/game/components/underground_belt";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { UndergroundBeltSystem } from "shapez/game/systems/underground_belt";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { ModInterface } from "shapez/mods/mod_interface";
import { T } from "shapez/translations";
import { HideSlotsComponent } from "../components/hide_slots";
import { SmartUndergroundBeltComponent } from "../components/smart_underground_belt";
import { newHubGoalRewards } from "../new_hub_goals";

const colorsByRotationVariant = ["#6d9dff", "#71ff9c"];

const overlayMatrices = [
    // Sender
    generateMatrixRotations([1, 1, 1, 0, 1, 0, 0, 1, 0]),

    // Receiver
    generateMatrixRotations([0, 1, 0, 0, 1, 0, 1, 1, 1]),

    // Left Sender
    generateMatrixRotations([1, 1, 1, 1, 1, 0, 0, 0, 0]),

    // Left Receiver
    generateMatrixRotations([0, 0, 0, 1, 1, 0, 1, 1, 1]),

    // Right Sender
    generateMatrixRotations([1, 1, 1, 0, 1, 1, 0, 0, 0]),

    // Right Receiver
    generateMatrixRotations([0, 0, 0, 0, 1, 1, 1, 1, 1]),
];

export const smartUndergroundBeltVariant = "smart";

export const enumUndergroundBeltVariantToTier = {
    [defaultBuildingVariant]: 0,
    [enumUndergroundBeltVariants.tier2]: 1,
    [smartUndergroundBeltVariant]: 2,
};

const maxTilesByTier = [5, 9, 7];

export const UndergroundBeltExtension = ({ $old }) => ({
    getSilhouetteColor(variant, rotationVariant) {
        return colorsByRotationVariant[rotationVariant % 2];
    },

    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant, entity) {
        return overlayMatrices[rotationVariant][rotation];
    },

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
        let basePath = blueprint ? "sprites/blueprints/" : "sprites/buildings/";

        switch (arrayUndergroundRotationVariantToMode[rotationVariant % 2]) {
            case enumUndergroundBeltMode.sender:
                basePath += "underground_belt_entry";
                break;
            case enumUndergroundBeltMode.receiver:
                basePath += "underground_belt_exit";
                break;
            default:
                assertAlways(false, "Invalid rotation variant");
        }

        if (variant == smartUndergroundBeltVariant) {
            return Loader.getSprite(basePath + "-" + variant + "_" + rotationVariant + ".png");
        }

        return Loader.getSprite(
            basePath + (variant === defaultBuildingVariant ? "" : "-" + variant) + ".png"
        );
    },

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        // Required, since the item processor needs this.
        entity.addComponent(
            new ItemEjectorComponent({
                slots: [],
            })
        );

        entity.addComponent(new UndergroundBeltComponent({}));
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [],
            })
        );

        entity.addComponent(new HideSlotsComponent({}));
    },
    /**
     * @param {GameRoot} root
     */
    getAvailableVariants(root) {
        /** @type {Array<string>} */
        const available = [defaultBuildingVariant];
        if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_underground_belt_tier_2)) {
            available.push(enumUndergroundBeltVariants.tier2);
        }
        if (root.hubGoals.isRewardUnlocked(newHubGoalRewards.reward_smart_tunnel)) {
            available.push(smartUndergroundBeltVariant);
        }
        return available;
    },

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        const undergroundBeltComp = entity.components.UndergroundBelt;
        const acceptorComp = entity.components.ItemAcceptor;
        const ejectorComp = entity.components.ItemEjector;

        undergroundBeltComp.tier = enumUndergroundBeltVariantToTier[variant];
        const smart = variant == smartUndergroundBeltVariant;
        const smartComp = entity.components[SmartUndergroundBeltComponent.getId()];
        if (smart && !smartComp) {
            entity.addComponent(new SmartUndergroundBeltComponent({ rotationVariant }));
        } else if (!smart && smartComp) {
            entity.removeComponent(SmartUndergroundBeltComponent);
        }

        switch (arrayUndergroundRotationVariantToMode[rotationVariant % 2]) {
            case enumUndergroundBeltMode.sender: {
                undergroundBeltComp.mode = enumUndergroundBeltMode.sender;
                ejectorComp.setSlots([]);
                acceptorComp.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.bottom,
                    },
                ]);
                if (smart) {
                    switch (rotationVariant) {
                        case 2:
                            acceptorComp.setSlots([
                                {
                                    pos: new Vector(0, 0),
                                    direction: enumDirection.left,
                                },
                            ]);
                            break;
                        case 4:
                            acceptorComp.setSlots([
                                {
                                    pos: new Vector(0, 0),
                                    direction: enumDirection.right,
                                },
                            ]);
                            break;
                        default:
                            break;
                    }
                }
                break;
            }
            case enumUndergroundBeltMode.receiver: {
                undergroundBeltComp.mode = enumUndergroundBeltMode.receiver;
                acceptorComp.setSlots([]);
                ejectorComp.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: enumDirection.top,
                    },
                ]);
                if (smart) {
                    switch (rotationVariant) {
                        case 3:
                            ejectorComp.setSlots([
                                {
                                    pos: new Vector(0, 0),
                                    direction: enumDirection.left,
                                },
                            ]);
                            break;
                        case 5:
                            ejectorComp.setSlots([
                                {
                                    pos: new Vector(0, 0),
                                    direction: enumDirection.right,
                                },
                            ]);
                            break;
                        default:
                            break;
                    }
                }
                break;
            }
            default:
                assertAlways(false, "Invalid rotation variant");
        }
    },

    /**
     * Should compute the optimal rotation variant on the given tile
     * @param {object} param0
     * @param {GameRoot} param0.root
     * @param {Vector} param0.tile
     * @param {number} param0.rotation
     * @param {string} param0.variant
     * @param {Layer} param0.layer
     * @param {Entity=} param0.entity
     * @return {{ rotation: number, rotationVariant: number, connectedEntities?: Array<Entity> }}
     */
    computeOptimalDirectionAndRotationVariantAtTile({ root, tile, rotation, variant, layer, entity }) {
        if (variant === smartUndergroundBeltVariant) {
            return this.computeOptimalDirectionAndRotationVariantForSmart({
                root,
                tile,
                rotation,
                variant,
                layer,
                entity,
            });
        }

        return $old.computeOptimalDirectionAndRotationVariantAtTile(...arguments);
    },

    /**
     * Should compute the optimal rotation variant for the smart tunnel
     * @param {object} param0
     * @param {GameRoot} param0.root
     * @param {Vector} param0.tile
     * @param {number} param0.rotation
     * @param {string} param0.variant
     * @param {Layer} param0.layer
     * @param {Entity=} param0.entity
     * @return {{ rotation: number, rotationVariant: number, connectedEntities?: Array<Entity> }}
     */
    computeOptimalDirectionAndRotationVariantForSmart({ root, tile, rotation, variant, layer, entity }) {
        const searchDirection = enumAngleToDirection[rotation];
        const searchVector = enumDirectionToVector[searchDirection];
        const tier = enumUndergroundBeltVariantToTier[variant];

        const targetRotation = (rotation + 180) % 360;
        const targetSenderRotation = rotation;
        const originalTile = tile;
        const ourEntity = root.map.getTileContent(tile, "regular");
        let originalMode = null;
        if (ourEntity && ourEntity.components.UndergroundBelt) {
            originalMode = ourEntity.components.UndergroundBelt.mode;
        }

        for (let searchOffset = 1; searchOffset <= maxTilesByTier[tier]; ++searchOffset) {
            tile = tile.addScalars(searchVector.x, searchVector.y);

            const contents = root.map.getTileContent(tile, "regular");
            if (contents) {
                const undergroundComp = contents.components.UndergroundBelt;
                if (undergroundComp && undergroundComp.tier === tier) {
                    const staticComp = contents.components.StaticMapEntity;
                    if (
                        staticComp.rotation === targetRotation &&
                        originalMode != enumUndergroundBeltMode.receiver
                    ) {
                        if (undergroundComp.mode !== enumUndergroundBeltMode.sender) {
                            // If we encounter an underground receiver on our way which is also faced in our direction, we don't accept that
                            break;
                        }
                        return {
                            rotation: targetRotation,
                            rotationVariant: this.computeRotationVariantForSmart(
                                root,
                                originalTile,
                                rotation,
                                enumUndergroundBeltMode.receiver
                            ),
                            connectedEntities: [contents],
                        };
                    } else if (
                        staticComp.rotation === targetSenderRotation &&
                        originalMode != enumUndergroundBeltMode.sender
                    ) {
                        // Draw connections to receivers
                        if (undergroundComp.mode === enumUndergroundBeltMode.receiver) {
                            return {
                                rotation: rotation,
                                rotationVariant: this.computeRotationVariantForSmart(
                                    root,
                                    originalTile,
                                    rotation,
                                    enumUndergroundBeltMode.sender
                                ),
                                connectedEntities: [contents],
                            };
                        } else {
                            break;
                        }
                    }
                }
            }
        }

        return {
            rotation,
            rotationVariant: this.computeRotationVariantForSmart(
                root,
                originalTile,
                rotation,
                originalMode ? originalMode : enumUndergroundBeltMode.sender
            ),
        };
    },

    /**
     * @param {GameRoot} root
     * @param {Vector} tile
     * @param {number} rotation
     * @param {Entity} entity
     * @param {string} mode
     * @param {number|null=} originalRotationVariant
     * @returns {number} the rotation variant
     */
    computeRotationVariantForSmart(root, tile, rotation, mode, originalRotationVariant = null) {
        const topDirection = enumAngleToDirection[rotation];
        const rightDirection = enumAngleToDirection[(rotation + 90) % 360];
        const leftDirection = enumAngleToDirection[(rotation + 270) % 360];

        const { ejectors, acceptors } = root.logic.getEjectorsAndAcceptorsAtTile(tile);

        const sender = mode == enumUndergroundBeltMode.sender;

        let center = false;
        let right = false;
        let left = false;
        if (sender) {
            for (let i = 0; i < ejectors.length; ++i) {
                const ejector = ejectors[i];

                if (ejector.toDirection === leftDirection) {
                    right = true;
                } else if (ejector.toDirection === rightDirection) {
                    left = true;
                } else if (ejector.toDirection === topDirection) {
                    center = true;
                }
            }
        } else {
            for (let i = 0; i < acceptors.length; ++i) {
                const acceptor = acceptors[i];

                if (acceptor.fromDirection === rightDirection) {
                    left = true;
                } else if (acceptor.fromDirection === leftDirection) {
                    right = true;
                } else if (acceptor.fromDirection === topDirection) {
                    center = true;
                }
            }
        }

        if (
            originalRotationVariant != null &&
            ((originalRotationVariant == 0 && center) ||
                (originalRotationVariant == 2 && left) ||
                (originalRotationVariant == 4 && right))
        ) {
            // we can stay the same
            return originalRotationVariant;
        }

        // now actually choose what to return
        if (center) {
            if (sender) {
                return 0;
            } else {
                return 1;
            }
        } else if (left) {
            if (sender) {
                return 2;
            } else {
                return 5;
            }
        } else if (right) {
            if (sender) {
                return 4;
            } else {
                return 3;
            }
        }

        if (sender) {
            return 0;
        } else {
            return 1;
        }
    },
});

// -------------------------------------------------- //

/**
 * @param {ModInterface} modInterface
 */
export function addNewUndergroundBeltVariants(modInterface) {
    // @ts-ignore
    modInterface.addVariantToExistingBuilding(MetaUndergroundBeltBuilding, smartUndergroundBeltVariant, {
        name: "Smart Tunnel",
        description:
            "Allows you to tunnel items under belts and buildings, accepting inputs and outputs from the side",
        rotationVariants: [0, 1, 2, 3, 4, 5],
        dimensions: new Vector(1, 1),
        additionalStatistics(root) {
            const rangeTiles = maxTilesByTier[2];

            const beltSpeed = root.hubGoals.getUndergroundBeltBaseSpeed();

            /** @type {Array<[string, string]>} */
            const stats = [
                [
                    T.ingame.buildingPlacement.infoTexts.range,
                    T.ingame.buildingPlacement.infoTexts.tiles.replace("<x>", "" + rangeTiles),
                ],
            ];
            stats.push([T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(beltSpeed)]);

            return stats;
        },
    });
}

// -------------------------------------------------- //

/**
 *
 * @param {ModInterface} modInterface
 */
export function overrideUndergroundBeltFindReciever(modInterface) {
    modInterface.replaceMethod(
        UndergroundBeltSystem,
        "findRecieverForSender",
        function ($original, [entity]) {
            const staticComp = entity.components.StaticMapEntity;
            const undergroundComp = entity.components.UndergroundBelt;
            const searchDirection = staticComp.localDirectionToWorld(enumDirection.top);
            const searchVector = enumDirectionToVector[searchDirection];
            const targetRotation = enumDirectionToAngle[searchDirection];
            let currentTile = staticComp.origin;

            // Search in the direction of the tunnel
            for (let searchOffset = 0; searchOffset < maxTilesByTier[undergroundComp.tier]; ++searchOffset) {
                currentTile = currentTile.add(searchVector);

                const potentialReceiver = this.root.map.getTileContent(currentTile, "regular");
                if (!potentialReceiver) {
                    // Empty tile
                    continue;
                }
                const receiverUndergroundComp = potentialReceiver.components.UndergroundBelt;
                if (!receiverUndergroundComp || receiverUndergroundComp.tier !== undergroundComp.tier) {
                    // Not a tunnel, or not on the same tier
                    continue;
                }

                const receiverStaticComp = potentialReceiver.components.StaticMapEntity;
                if (receiverStaticComp.rotation !== targetRotation) {
                    // Wrong rotation
                    continue;
                }

                if (receiverUndergroundComp.mode !== enumUndergroundBeltMode.receiver) {
                    // Not a receiver, but a sender -> Abort to make sure we don't deliver double
                    break;
                }

                return { entity: potentialReceiver, distance: searchOffset };
            }

            // None found
            return { entity: null, distance: 0 };
        }
    );
}
