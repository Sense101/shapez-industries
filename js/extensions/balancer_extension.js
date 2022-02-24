import { Loader } from "shapez/core/loader";
import { formatItemsPerSecond, generateMatrixRotations } from "shapez/core/utils";
import { enumAngleToDirection, enumDirection, Vector } from "shapez/core/vector";
import { MetaBalancerBuilding } from "shapez/game/buildings/balancer";
import { BeltUnderlaysComponent } from "shapez/game/components/belt_underlays";
import { ItemAcceptorComponent } from "shapez/game/components/item_acceptor";
import { ItemEjectorComponent } from "shapez/game/components/item_ejector";
import { enumItemProcessorTypes, ItemProcessorComponent } from "shapez/game/components/item_processor";
import { Entity } from "shapez/game/entity";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { ItemProcessorSystem } from "shapez/game/systems/item_processor";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { ModInterface } from "shapez/mods/mod_interface";
import { T } from "shapez/translations";
import { HideSlotsComponent } from "../components/hide_slots";
import { SmartBalancerComponent } from "../components/smart_balancer";

/** @type {Array<{id: string, mergerMatrice: { [x: number]: number[] }, splitterMatrice: { [x: number]: number[] }}>} */
const smartRotationVariants = [
    {
        id: "center",
        mergerMatrice: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
        splitterMatrice: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
    },
    {
        id: "left",
        mergerMatrice: generateMatrixRotations([0, 1, 0, 1, 1, 0, 0, 1, 0]),
        splitterMatrice: generateMatrixRotations([0, 1, 0, 1, 1, 0, 0, 1, 0]),
    },
    {
        id: "right",
        mergerMatrice: generateMatrixRotations([0, 1, 0, 0, 1, 1, 0, 1, 0]),
        splitterMatrice: generateMatrixRotations([0, 1, 0, 0, 1, 1, 0, 1, 0]),
    },
    {
        id: "all",
        mergerMatrice: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 1, 0]),
        splitterMatrice: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 1, 0]),
    },
    {
        id: "both",
        mergerMatrice: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 0, 0]),
        splitterMatrice: generateMatrixRotations([0, 0, 0, 1, 1, 1, 0, 1, 0]),
    },
];

/** @enum {string} */
export const enumBalancerVariants = {
    smartMerger: "smart-merger",
    smartSplitter: "smart-splitter",
};

export const BalancerExtension = ({ $old }) => ({
    /**
     * @param {number} rotation
     * @param {number} rotationVariant
     * @param {string} variant
     * @param {Entity} entity
     * @returns {Array<number>|null}
     */
    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant, entity) {
        let matrix = null;
        const rVariant = smartRotationVariants[rotationVariant];
        switch (variant) {
            case enumBalancerVariants.smartMerger:
                matrix = rVariant.mergerMatrice;
                break;
            case enumBalancerVariants.smartSplitter:
                matrix = rVariant.splitterMatrice;
                break;
            default:
                matrix = null;
                break;
        }
        if (matrix) {
            return matrix[rotation];
        }
        return null;
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
        const basePath = blueprint ? "sprites/blueprints/" : "sprites/buildings/";

        switch (variant) {
            case enumBalancerVariants.smartMerger:
            case enumBalancerVariants.smartSplitter:
                return Loader.getSprite(
                    basePath +
                        this.id +
                        "-" +
                        variant +
                        "_" +
                        smartRotationVariants[rotationVariant].id +
                        ".png"
                );
            default:
                return Loader.getSprite(
                    basePath + this.id + (variant === defaultBuildingVariant ? "" : "-" + variant) + ".png"
                );
        }
    },

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [], // set later
            })
        );

        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 1,
                processorType: enumItemProcessorTypes.balancer,
            })
        );

        entity.addComponent(
            new ItemEjectorComponent({
                slots: [], // set later
                renderFloatingItems: false,
            })
        );

        entity.addComponent(new BeltUnderlaysComponent({ underlays: [] }));

        entity.addComponent(new SmartBalancerComponent({}));
        entity.addComponent(new HideSlotsComponent({}));
    },
    /**
     * @param {GameRoot} root
     */
    getAvailableVariants(root) {
        /** @type {Array<string>} */
        let available = [defaultBuildingVariant];

        if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_merger)) {
            available.push(enumBalancerVariants.smartMerger);
        }

        if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_splitter)) {
            available.push(enumBalancerVariants.smartSplitter);
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
        entity.components.BeltUnderlays.underlays.push({
            pos: new Vector(0, 0),
            direction: enumDirection.top,
        });

        /** @type {SmartBalancerComponent} */
        const smartBalancerComp = entity.components[SmartBalancerComponent.getId()];

        /** @type {HideSlotsComponent} */
        const hideSlotsComp = entity.components[HideSlotsComponent.getId()];

        switch (variant) {
            case defaultBuildingVariant: {
                smartBalancerComp.variant = null;
                hideSlotsComp.hiddenAcceptorSlots = [];
                hideSlotsComp.hiddenEjectorSlots = [];

                entity.components.ItemAcceptor.setSlots([
                    { pos: new Vector(0, 0), direction: enumDirection.bottom },
                    { pos: new Vector(1, 0), direction: enumDirection.bottom },
                ]);

                entity.components.ItemEjector.setSlots([
                    { pos: new Vector(0, 0), direction: enumDirection.top },
                    { pos: new Vector(1, 0), direction: enumDirection.top },
                ]);

                entity.components.BeltUnderlays.underlays.push({
                    pos: new Vector(1, 0),
                    direction: enumDirection.top,
                });
                return;
            }

            case enumBalancerVariants.smartMerger:
            case enumBalancerVariants.smartSplitter: {
                smartBalancerComp.variant = variant;

                const isMerger = variant == enumBalancerVariants.smartMerger;

                // First, set the actual slots
                if (isMerger) {
                    entity.components.ItemEjector.setSlots([
                        { pos: new Vector(0, 0), direction: enumDirection.top },
                    ]);
                    entity.components.ItemAcceptor.setSlots([
                        { pos: new Vector(0, 0), direction: enumDirection.left },
                        { pos: new Vector(0, 0), direction: enumDirection.bottom },
                        { pos: new Vector(0, 0), direction: enumDirection.right },
                    ]);
                } else {
                    entity.components.ItemEjector.setSlots([
                        { pos: new Vector(0, 0), direction: enumDirection.left },
                        { pos: new Vector(0, 0), direction: enumDirection.top },
                        { pos: new Vector(0, 0), direction: enumDirection.right },
                    ]);
                    entity.components.ItemAcceptor.setSlots([
                        { pos: new Vector(0, 0), direction: enumDirection.bottom },
                    ]);
                }

                // Now, set the slots to be hidden when we place it
                let hiddenSlots = [];
                switch (rotationVariant) {
                    case 0:
                        hiddenSlots = [0, 2];
                        break;
                    case 1:
                        hiddenSlots = [2];
                        break;
                    case 2:
                        hiddenSlots = [0];
                        break;
                    case 3:
                        break;
                    case 4:
                        hiddenSlots = [1];
                        break;
                    default:
                        assertAlways(false, "Unknown rotation variant: " + rotationVariant);
                }

                if (isMerger) {
                    hideSlotsComp.hiddenAcceptorSlots = hiddenSlots;
                    hideSlotsComp.hiddenEjectorSlots = [];
                } else {
                    hideSlotsComp.hiddenEjectorSlots = hiddenSlots;
                    hideSlotsComp.hiddenAcceptorSlots = [];
                }
                break;
            }
            default:
                assertAlways(false, "Unknown balancer variant: " + variant);
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
     * @return {{ rotation: number, rotationVariant: number, connectedEntities?: Array<Entity> }}
     */
    computeOptimalDirectionAndRotationVariantAtTile({ root, tile, rotation, variant, layer }) {
        if (variant == defaultBuildingVariant) {
            return {
                rotation,
                rotationVariant: 0,
            };
        }

        // this code will get called by the smart belt system

        const topDirection = enumAngleToDirection[rotation];
        const rightDirection = enumAngleToDirection[(rotation + 90) % 360];
        const bottomDirection = enumAngleToDirection[(rotation + 180) % 360];
        const leftDirection = enumAngleToDirection[(rotation + 270) % 360];

        const { ejectors, acceptors } = root.logic.getEjectorsAndAcceptorsAtTile(tile);
        const isMerger = variant == enumBalancerVariants.smartMerger;

        let rotationVariant = 0;

        let hasRightConnector = false;
        let hasLeftConnector = false;
        let hasCenterConnector = false;
        if (isMerger) {
            for (let i = 0; i < ejectors.length; ++i) {
                const ejector = ejectors[i];

                if (ejector.toDirection === leftDirection) {
                    hasRightConnector = true;
                } else if (ejector.toDirection === rightDirection) {
                    hasLeftConnector = true;
                } else if (ejector.toDirection === topDirection) {
                    hasCenterConnector = true;
                }
            }
        } else {
            for (let i = 0; i < acceptors.length; ++i) {
                const acceptor = acceptors[i];
                if (acceptor.fromDirection === rightDirection) {
                    hasLeftConnector = true;
                } else if (acceptor.fromDirection === leftDirection) {
                    hasRightConnector = true;
                } else if (acceptor.fromDirection === bottomDirection) {
                    hasCenterConnector = true;
                }
            }
        }

        if (hasRightConnector) {
            rotationVariant = hasLeftConnector ? (hasCenterConnector ? 3 : 4) : 2;
        } else if (hasLeftConnector) {
            rotationVariant = 1;
        }

        return {
            rotation,
            rotationVariant,
        };
    },
});

/**
 * @param {ModInterface} modInterface
 */
export function addNewBalancerVariants(modInterface) {
    modInterface.addVariantToExistingBuilding(
        //@ts-ignore
        MetaBalancerBuilding,
        enumBalancerVariants.smartMerger,
        {
            name: "Smart Merger",
            description: "Merges up to three conveyor belts into one.",
            rotationVariants: [0, 1, 2, 3, 4],
            dimensions: new Vector(1, 1),
            additionalStatistics(root) {
                return [
                    [
                        T.ingame.buildingPlacement.infoTexts.speed,
                        formatItemsPerSecond(
                            root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes.balancer) / 2
                        ),
                    ],
                ];
            },
        }
    );
    modInterface.addVariantToExistingBuilding(
        //@ts-ignore
        MetaBalancerBuilding,
        enumBalancerVariants.smartSplitter,
        {
            name: "Smart Splitter",
            description: "Splits one conveyor belt into up to three outputs",
            rotationVariants: [0, 1, 2, 3, 4],
            dimensions: new Vector(1, 1),
            additionalStatistics(root) {
                return [
                    [
                        T.ingame.buildingPlacement.infoTexts.speed,
                        formatItemsPerSecond(
                            root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes.balancer) / 2
                        ),
                    ],
                ];
            },
        }
    );
}

/**
 * @param {ModInterface} modInterface
 */
export function overrideBalancerHandle(modInterface) {
    modInterface.replaceMethod(ItemProcessorSystem, "process_BALANCER", function ($original, [payload]) {
        const ejectorComp = payload.entity.components.ItemEjector;
        let availableSlots = [];
        for (let i = 0; i < ejectorComp.slots.length; i++) {
            const slot = ejectorComp.slots[i];
            if (slot.cachedTargetEntity) {
                availableSlots.push(i);
            }
        }
        const processorComp = payload.entity.components.ItemProcessor;

        // Up to *three* inputs now
        for (let i = 0; i < 3; ++i) {
            const item = payload.items.get(i);
            if (!item) {
                continue;
            }
            let preferredSlot = processorComp.nextOutputSlot++ % ejectorComp.slots.length;
            for (let i = 0; i < ejectorComp.slots.length; i++) {
                if (!availableSlots.includes(preferredSlot)) {
                    preferredSlot = processorComp.nextOutputSlot++ % ejectorComp.slots.length;
                }
            }
            payload.outItems.push({
                item,
                preferredSlot,
                doNotTrack: true,
            });
        }
        return true;
    });
}
