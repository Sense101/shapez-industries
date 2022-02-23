import { formatItemsPerSecond, generateMatrixRotations } from "shapez/core/utils";
import { Vector } from "shapez/core/vector";
import { enumMinerVariants, MetaMinerBuilding } from "shapez/game/buildings/miner";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { MinerSystem } from "shapez/game/systems/miner";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { ModInterface } from "shapez/mods/mod_interface";
import { T } from "shapez/translations";
import { DeepMinerComponent } from "../components/deep_miner";
import { newHubGoalRewards } from "../new_hub_goals";

export const deepMinerVariant = "deep";

export const MinerExtension = ({ $old }) => ({
    // new matrix for deep miner
    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant, entity) {
        if (variant == deepMinerVariant) {
            return generateMatrixRotations([1, 1, 1, 1, 0, 1, 1, 1, 1])[rotation];
        }
        return $old.getSpecialOverlayRenderMatrix(...arguments);
    },

    getAvailableVariants(root) {
        let available = [];
        if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_miner_chainable)) {
            available.push(enumMinerVariants.chainable);
        } else {
            available.push(defaultBuildingVariant);
        }
        if (root.hubGoals.isRewardUnlocked(newHubGoalRewards.reward_deep_miner)) {
            available.push(deepMinerVariant);
        }
        return available;
    },

    updateVariants(entity, rotationVariant, variant) {
        entity.components.Miner.chainable = variant === enumMinerVariants.chainable;
        const deep = variant === deepMinerVariant;
        if (deep && !entity.components[DeepMinerComponent.getId()]) {
            entity.addComponent(new DeepMinerComponent({}));
        }
        if (!deep && entity.components[DeepMinerComponent.getId()]) {
            entity.removeComponent(DeepMinerComponent);
        }
    },
});

// ---------------------------------- //

/**
 * @param {ModInterface} modInterface
 */
export function addDeepMinerMultiplier(modInterface) {
    modInterface.replaceMethod(MinerSystem, "update", function ($original) {
        let miningSpeed = this.root.hubGoals.getMinerBaseSpeed();

        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const minerComp = entity.components.Miner;
            const deepMinerComp = entity.components[DeepMinerComponent.getId()];
            if (deepMinerComp) {
                miningSpeed *= deepMinerComp.speedMultiplier;
            }

            // Reset everything on recompute
            if (this.needsRecompute) {
                minerComp.cachedChainedMiner = null;
            }

            // Check if miner is above an actual tile
            if (!minerComp.cachedMinedItem) {
                const staticComp = entity.components.StaticMapEntity;
                const tileBelow = this.root.map.getLowerLayerContentXY(
                    staticComp.origin.x,
                    staticComp.origin.y
                );
                if (!tileBelow) {
                    continue;
                }
                minerComp.cachedMinedItem = tileBelow;
            }

            // First, try to get rid of chained items
            if (minerComp.itemChainBuffer.length > 0) {
                if (this.tryPerformMinerEject(entity, minerComp.itemChainBuffer[0])) {
                    minerComp.itemChainBuffer.shift();
                    continue;
                }
            }

            const mineDuration = 1 / miningSpeed;
            const timeSinceMine = this.root.time.now() - minerComp.lastMiningTime;
            if (timeSinceMine > mineDuration) {
                // Store how much we overflowed
                const buffer = Math.min(timeSinceMine - mineDuration, this.root.dynamicTickrate.deltaSeconds);

                if (this.tryPerformMinerEject(entity, minerComp.cachedMinedItem)) {
                    // Analytics hook
                    this.root.signals.itemProduced.dispatch(minerComp.cachedMinedItem);
                    // Store mining time
                    minerComp.lastMiningTime = this.root.time.now() - buffer;
                }
            }
        }

        // After this frame we are done
        this.needsRecompute = false;
    });
}

// ---------------------------------- //

/**
 * @param {ModInterface} modInterface
 */
export function addNewMinerVariants(modInterface) {
    modInterface.addVariantToExistingBuilding(
        //@ts-ignore
        MetaMinerBuilding,
        deepMinerVariant,
        {
            name: "Extractor (Deep)",
            description:
                "Place over a shape or color to extract it. Extracts 2.5x more than a normal extractor",
            dimensions: new Vector(1, 1),
            additionalStatistics(root) {
                return [
                    [
                        T.ingame.buildingPlacement.infoTexts.speed,
                        formatItemsPerSecond(root.hubGoals.getMinerBaseSpeed() * 2.5),
                    ],
                ];
            },
        }
    );
}
