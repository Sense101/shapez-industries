import { Loader } from "shapez/core/loader";
import { STOP_PROPAGATION } from "shapez/core/signal";
import { formatBigNumber, makeDiv } from "shapez/core/utils";
import { Vector } from "shapez/core/vector";
import { enumMouseButton } from "shapez/game/camera";
import { HUDPinnedShapes } from "shapez/game/hud/parts/pinned_shapes";
import { GameRoot } from "shapez/game/root";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { ModInterface } from "shapez/mods/mod_interface";
import { ACHIEVEMENTS } from "shapez/platform/achievement_provider";
import { SOUNDS } from "shapez/platform/sound";
import { T } from "shapez/translations";
import { blueprintShapes } from "./game_mode_extension";
import { newHubGoalRewards } from "../new_hub_goals";
import { Entity } from "shapez/game/entity";

const tierOneIds = [
    "balancer",
    "belt",
    "item_producer",
    "underground_belt",
    "wire_tunnel",
    "wire",
    "belt_crossing",
];

export const BlueprintExtension = ({ $old }) => ({
    getCost() {
        let cost = [0, 0, 0];
        for (let i = 0; i < this.entities.length; i++) {
            /** @type {Entity} */
            const entity = this.entities[i];
            const staticComp = entity.components.StaticMapEntity;

            // note - kinda hacky, but you think I care?
            const id = staticComp.getMetaBuilding().getId();

            // remember to change getPlaceableEntities too!
            if (tierOneIds.includes(id)) {
                // it's a small building
                cost[0] += 10;
            } else {
                // it's a bigger building
                cost[1] += 10;
            }
        }
        return cost;
    },

    /**
     * @param {GameRoot} root
     */
    canAfford(root) {
        const tiers = [false, false, false];
        const cost = this.getCost();
        for (let i = 0; i < cost.length; i++) {
            const shapeAmount = root.hubGoals.getShapesStoredByKey(blueprintShapes[i]);
            if (cost[i] > 0 && cost[i] <= shapeAmount) {
                tiers[i] = true;
            }
        }
        return tiers;
    },

    /**
     * @param {GameRoot} root
     * @param {Vector} tile
     * @returns {Array<boolean>}
     */
    getPlaceableEntities(root, tile) {
        const canAfford = this.canAfford(root);
        const ratprints = root.hubGoals.isRewardUnlocked(newHubGoalRewards.reward_ratprints);

        /** @type {Array<boolean>} */
        const canPlaceEntities = [];
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            const staticComp = entity.components.StaticMapEntity;

            if (!root.logic.checkCanPlaceEntity(entity, { offset: tile })) {
                canPlaceEntities.push(false);
                continue;
            }

            const id = staticComp.getMetaBuilding().getId();

            if (tierOneIds.includes(id) && canAfford[0]) {
                // it's a small building
                canPlaceEntities.push(true);
                continue;
            } else if (!tierOneIds.includes(id) && canAfford[1] && ratprints) {
                // it's a bigger building
                canPlaceEntities.push(true);
                continue;
            }

            canPlaceEntities.push(false);
        }

        return canPlaceEntities;
    },

    /**
     * Draws the blueprint at the given origin
     * @param {import("shapez/core/draw_utils").DrawParameters} parameters
     */
    draw(parameters, tile) {
        parameters.context.globalAlpha = 0.8;
        const placeableEntities = this.getPlaceableEntities(parameters.root, tile);
        for (let i = 0; i < this.entities.length; ++i) {
            const entity = this.entities[i];
            const staticComp = entity.components.StaticMapEntity;
            const newPos = staticComp.origin.add(tile);

            const rect = staticComp.getTileSpaceBounds();
            rect.moveBy(tile.x, tile.y);

            if (!placeableEntities[i]) {
                parameters.context.globalAlpha = 0.3;
            } else {
                parameters.context.globalAlpha = 1;
            }

            staticComp.drawSpriteOnBoundsClipped(parameters, staticComp.getBlueprintSprite(), 0, newPos);
        }
        parameters.context.globalAlpha = 1;
    },

    /**
     * Attempts to place the blueprint at the given tile
     * @param {GameRoot} root
     * @param {Vector} tile
     */
    tryPlace(root, tile) {
        const placeableEntities = this.getPlaceableEntities(root, tile);
        return root.logic.performBulkOperation(() => {
            return root.logic.performImmutableOperation(() => {
                let count = 0;
                for (let i = 0; i < this.entities.length; ++i) {
                    const entity = this.entities[i];
                    if (!placeableEntities[i]) {
                        continue;
                    }

                    const clone = entity.clone();
                    clone.components.StaticMapEntity.origin.addInplace(tile);
                    root.logic.freeEntityAreaBeforeBuild(clone);
                    root.map.placeStaticEntity(clone);
                    root.entityMgr.registerEntity(clone);
                    count++;
                }

                root.signals.bulkAchievementCheck.dispatch(
                    ACHIEVEMENTS.placeBlueprint,
                    count,
                    ACHIEVEMENTS.placeBp1000,
                    count
                );

                return count !== 0;
            });
        });
    },
});

export const BlueprintPlacerExtension = ({ $old }) => ({
    createElements(parent) {
        const blueprintCostCanvases = blueprintShapes.map(key =>
            this.root.shapeDefinitionMgr.getShapeFromShortKey(key).generateAsCanvas(80)
        );

        this.costDisplayParent = makeDiv(parent, "ingame_HUD_BlueprintPlacer", [], ``);

        makeDiv(this.costDisplayParent, null, ["label"], T.ingame.blueprintPlacer.cost);

        const costContainer = makeDiv(this.costDisplayParent, null, ["costContainer"], "");

        this.costDisplayText = [null, null, null];

        for (let i = 0; i < blueprintCostCanvases.length; i++) {
            const canvas = blueprintCostCanvases[i];
            const tierContainer = makeDiv(costContainer, null, ["tierContainer"], "");
            const tierCost = makeDiv(tierContainer, null, ["tierCost"], "1");

            makeDiv(tierContainer, null, ["lockedSprite"], "?");
            tierContainer.appendChild(canvas);
            this.costDisplayText[i] = tierCost;
        }
    },

    /**
     *
     * @param {Array<boolean>} canAfford
     */
    onCanAffordChanged(canAfford) {
        let canAffordAny = false;
        for (let i = 0; i < canAfford.length; i++) {
            if (canAfford[i]) {
                canAffordAny = true;
                break;
            }
        }
        this.costDisplayParent.classList.toggle("canAfford", canAffordAny);

        const currentBlueprint = this.currentBlueprint.get();
        if (currentBlueprint) {
            const cost = currentBlueprint.getCost();
            for (let i = 0; i < cost.length; i++) {
                const shapeAmount = this.root.hubGoals.getShapesStoredByKey(blueprintShapes[i]);
                this.costDisplayText[i].classList.toggle("canAfford", cost[i] <= shapeAmount);
                if (i == 1) {
                    // it's the ratprint, make sure its unlocked
                    const isUnlocked = this.root.hubGoals.isRewardUnlocked(
                        newHubGoalRewards.reward_ratprints
                    );
                    this.costDisplayText[i].parentElement.classList.toggle("locked", !isUnlocked);
                }
            }
        }
    },

    update() {
        const currentBlueprint = this.currentBlueprint.get();
        let hasCost = false;
        if (currentBlueprint) {
            const cost = currentBlueprint.getCost();
            hasCost = cost[0] + cost[1] + cost[2] > 0;
        }
        this.domAttach.update(!this.getHasFreeCopyPaste() && hasCost);
        this.trackedCanAfford.set(
            currentBlueprint ? currentBlueprint.canAfford(this.root) : [false, false, false]
        );
    },

    onBlueprintChanged(blueprint) {
        if (blueprint) {
            this.lastBlueprintUsed = blueprint;
            const costs = blueprint.getCost();
            for (let i = 0; i < costs.length; i++) {
                if (costs[i] > 0) {
                    this.costDisplayText[i].parentElement.classList.remove("hidden");
                    this.costDisplayText[i].innerText = "" + formatBigNumber(costs[i]);
                } else {
                    this.costDisplayText[i].parentElement.classList.add("hidden");
                }
            }
        }
    },

    /**
     * mouse down pre handler
     * @param {Vector} pos
     * @param {enumMouseButton} button
     */
    onMouseDown(pos, button) {
        if (button === enumMouseButton.right) {
            if (this.currentBlueprint.get()) {
                this.abortPlacement();
                return STOP_PROPAGATION;
            }
        } else if (button === enumMouseButton.left) {
            const blueprint = this.currentBlueprint.get();
            if (!blueprint) {
                return;
            }

            const canAfford = blueprint.canAfford(this.root);
            if (!this.getHasFreeCopyPaste() && !canAfford.includes(true)) {
                this.root.soundProxy.playUiError();
                return;
            }

            //We are going to try and place, only place entities we can afford

            const worldPos = this.root.camera.screenToWorld(pos);
            const tile = worldPos.toTileSpace();
            if (blueprint.tryPlace(this.root, tile)) {
                if (!this.getHasFreeCopyPaste()) {
                    const cost = blueprint.getCost();
                    for (let i = 0; i < cost.length; i++) {
                        if (canAfford[i]) {
                            this.root.hubGoals.takeShapeByKey(blueprintShapes[i], cost[i]);
                        }
                    }
                }
                this.root.soundProxy.playUi(SOUNDS.placeBuilding);
            }
            return STOP_PROPAGATION;
        }
    },
});

// --------------------------------------- //

/**
 * @param {ModInterface} modInterface
 */
export function pinNewBlueprintType(modInterface) {
    modInterface.replaceMethod(HUDPinnedShapes, "rerenderFull", function ($original) {
        const currentGoal = this.root.hubGoals.currentGoal;
        const currentKey = currentGoal.definition.getHash();

        // First, remove all old shapes
        for (let i = 0; i < this.handles.length; ++i) {
            this.handles[i].element.remove();
            const detector = this.handles[i].detector;
            if (detector) {
                detector.cleanup();
            }
            const infoDetector = this.handles[i].infoDetector;
            if (infoDetector) {
                infoDetector.cleanup();
            }
        }
        this.handles = [];

        // Pin story goal
        this.internalPinShape({
            key: currentKey,
            canUnpin: false,
            className: "goal",
            throughputOnly: currentGoal.throughputOnly,
        });

        // Pin blueprint shape as well
        if (this.root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_blueprints)) {
            this.internalPinShape({
                key: blueprintShapes[0],
                canUnpin: false,
                className: "blueprint",
            });
        }

        // Pin ratprint shape
        if (this.root.hubGoals.isRewardUnlocked(newHubGoalRewards.reward_ratprints)) {
            this.internalPinShape({
                key: blueprintShapes[1],
                canUnpin: false,
                className: "blueprint",
            });
        }

        // Pin manually pinned shapes
        for (let i = 0; i < this.pinnedShapes.length; ++i) {
            const key = this.pinnedShapes[i];
            if (key !== currentKey) {
                this.internalPinShape({ key });
            }
        }
    });
}

/**
 * @param {ModInterface} modInterface
 */
export function overrideLockedBlueprintsDialogue(modInterface) {
    modInterface.registerTranslations("en", {
        dialogs: {
            blueprintsNotUnlocked: {
                title: "Not unlocked yet",
                desc: "Complete level 10 to unlock Bugprints!",
            },
        },
    });
}
