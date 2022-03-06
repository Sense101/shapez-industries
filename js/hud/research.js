import { ClickDetector } from "shapez/core/click_detector";
import { InputReceiver } from "shapez/core/input_receiver";
import { formatBigNumber, getRomanNumber, makeDiv } from "shapez/core/utils";
import { T } from "shapez/translations";
import { KeyActionMapper, KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { BaseHUDPart } from "shapez/game/hud/base_hud_part";
import { DynamicDomAttach } from "shapez/game/hud/dynamic_dom_attach";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { newHubGoalRewards } from "../new_hub_goals";
import { researchShapes } from "../extensions/game_mode_extension";
import { MetaBalancerBuilding } from "shapez/game/buildings/balancer";
import { MetaUndergroundBeltBuilding } from "shapez/game/buildings/underground_belt";
import { MetaMinerBuilding } from "shapez/game/buildings/miner";
import { gMetaBuildingRegistry } from "shapez/core/global_registries";
import { MetaBuilding } from "shapez/game/meta_building";
import { MetaRotaterBuilding } from "shapez/game/buildings/rotater";
import { MetaCutterBuilding } from "shapez/game/buildings/cutter";
import { MetaPainterBuilding } from "shapez/game/buildings/painter";
import { MetaStackerBuilding } from "shapez/game/buildings/stacker";
import { MetaBeltCrossingBuilding } from "../buildings/belt_crossing";
import { MetaStorageBuilding } from "shapez/game/buildings/storage";

// NOTE ---- A lot of this is copied code from the shop hud. Sue me, I don't care

const tierToRequiredAmount = {
    1: 500,
    2: 1500,
    3: 3000,
};

const uniqueShapeRequirement = 30;

export const researchVariants = {
    balancerSmartMerger: {
        building: MetaBalancerBuilding,
        reward: enumHubGoalRewards.reward_merger,
        desc: "merges up to three belts into one",
        shape: "RbRbRb--",
        tier: 1,
    },
    minerChainable: {
        building: MetaMinerBuilding,
        reward: enumHubGoalRewards.reward_miner_chainable,
        desc: "same as a regular miner, but can be chained",
        shape: "WbWbWbWb",
        tier: 1,
    },
    quadCutter: {
        building: MetaCutterBuilding,
        reward: enumHubGoalRewards.reward_cutter_quad,
        desc: "cuts shapes into four parts instead of two",
        shape: "Sb--Sb--",
        tier: 1,
    },
    ccwRotator: {
        building: MetaRotaterBuilding,
        reward: enumHubGoalRewards.reward_rotater_ccw,
        desc: "rotates shapes counter-clockwise",
        shape: "--SbSb--:--SbSb--",
        tier: 1,
    },
    doublePainter: {
        building: MetaPainterBuilding,
        reward: enumHubGoalRewards.reward_painter_double,
        desc: "paints two shapes at once",
        shape: "RbRbRbRb:RbRbRbRb:RbRbRbRb",
        tier: 1,
    },

    /////////////////////////////////////////
    // TIER 2
    ///////////////////////////////////////

    balancerSmartSplitter: {
        building: MetaBalancerBuilding,
        reward: enumHubGoalRewards.reward_splitter,
        desc: "splits a belt into up to three outputs",
        shape: "CcCcCc--:1b1b1b1b",
        tier: 2,
    },
    tunnelTier2: {
        building: MetaUndergroundBeltBuilding,
        reward: enumHubGoalRewards.reward_underground_belt_tier_2,
        desc: "a variant of the tunnel with bigger range",
        shape: "4b4b4b4b:ScScScSc",
        tier: 2,
    },
    minerDeep: {
        building: MetaMinerBuilding,
        reward: newHubGoalRewards.reward_deep_miner,
        desc: "extracts more than a normal extractor",
        shape: "CbCbCbCb:3c3c3c3c",
        tier: 2,
    },
    laserCutter: {
        building: MetaCutterBuilding,
        reward: newHubGoalRewards.reward_laser_cutter,
        desc: "cuts shapes based on the wire inputs",
        shape: "----3c3c:3b3b--3b",
        tier: 2,
    },
    rotator180: {
        building: MetaRotaterBuilding,
        reward: enumHubGoalRewards.reward_rotater_180,
        desc: "rotates shapes a full 180 degress",
        shape: "6b6c6b6c:WbWcWbWc",
        tier: 2,
    },
    quadStacker: {
        building: MetaStackerBuilding,
        reward: newHubGoalRewards.reward_quad_stacker,
        desc: "stacks up to four shapes together",
        shape: "2c2c2c2c:2b2b2b2b:2c2c2c2c:2b2b2b2b",
        tier: 2,
    },

    /////////////////////////////////////////
    // TIER 3
    ///////////////////////////////////////

    cornerCrossing: {
        building: MetaBeltCrossingBuilding,
        reward: newHubGoalRewards.reward_corner_crossing,
        desc: "turns two belts on the same tile",
        shape: "1w______:1b__1c__",
        tier: 3,
    },
    lineCrossing: {
        building: MetaBeltCrossingBuilding,
        reward: newHubGoalRewards.reward_line_crossing,
        desc: "crosses two adjacent belts over each other",
        shape: "2w______:2c__2b__",
        tier: 3,
    },
    tunnelSmart: {
        building: MetaUndergroundBeltBuilding,
        reward: newHubGoalRewards.reward_smart_tunnel,
        desc: "also accepts inputs and outputs from the sides",
        shape: "6b______:RwRcRwRc",
        tier: 3,
    },
    quadPainter: {
        building: MetaPainterBuilding,
        reward: newHubGoalRewards.reward_quad_painter,
        desc: "paints each layer of a shape individually",
        shape: "__3w__3w:3b__3b__:__3c__3c",
        tier: 3,
    },
    miniStorage: {
        building: MetaStorageBuilding,
        reward: newHubGoalRewards.reward_mini_storage,
        desc: "stores shapes, mostly useful as an overflow gate",
        shape: "ScC_S_C_:CwS_C_S_:Cb______",
        tier: 3,
    },
};

export class HUDResearch extends BaseHUDPart {
    createElements(parent) {
        this.background = makeDiv(parent, "ingame_HUD_Research", ["ingameDialog"]);

        // DIALOG Inner / Wrapper
        this.dialogInner = makeDiv(this.background, null, ["dialogInner"]);
        this.title = makeDiv(this.dialogInner, null, ["title"], "Research");
        this.closeButton = makeDiv(this.title, null, ["closeButton"]);
        this.trackClicks(this.closeButton, this.close);
        this.contentDiv = makeDiv(this.dialogInner, null, ["content"]);
        // DIALOG Inner / Wrapper

        this.tier = 1;
        this.root.signals.storyGoalCompleted.add((level, reward) => {
            if (reward == newHubGoalRewards.reward_research) {
                this.tier = 1;
            }
            if (reward == newHubGoalRewards.reward_research_t2) {
                this.tier = 2;
            }
            if (reward == newHubGoalRewards.reward_research_t3) {
                this.tier = 3;
            }
        }, this);

        this.variantToElements = {};
        this.researchedVariants = [];
    }

    rerenderFull() {
        // first, delete old children
        while (this.contentDiv.lastChild) {
            this.contentDiv.removeChild(this.contentDiv.lastChild);
        }
        this.variantToElements = {};

        // now, create new elements
        const variants = Object.keys(researchVariants).sort(
            (a, b) => this.isResearchCompleted(a) - this.isResearchCompleted(b)
        );

        for (let i = 0; i < variants.length; i++) {
            const variant = variants[i];
            const { building, reward, desc, shape, tier } = researchVariants[variant];

            const handle = {};
            handle.requireIndexToElement = [];

            /** @type {MetaBuilding} */
            const metaBuilding = gMetaBuildingRegistry.findByClass(building);

            // Wrapper
            handle.elem = makeDiv(this.contentDiv, null, ["variant"]);

            // Title
            const title = makeDiv(handle.elem, null, ["title"], T.storyRewards[reward].title);

            // Title > Tier
            handle.elemTierLabel = makeDiv(title, null, ["tier"]);

            // icon
            handle.icon = makeDiv(handle.elem, null, ["iconWrapper"]);
            handle.icon.setAttribute("data-icon", "building_icons/" + metaBuilding.getId() + ".png");
            handle.icon.setAttribute("data-id", metaBuilding.getId());
            makeDiv(handle.icon, null, ["icon"]);

            // Description
            handle.elemDescription = makeDiv(handle.elem, null, ["description"], desc);
            handle.elemRequirements = makeDiv(handle.elem, null, ["requirements"]);

            // Buy button
            handle.buyButton = document.createElement("button");
            handle.buyButton.classList.add("buy", "styledButton");
            handle.buyButton.innerText = "Research";
            handle.elem.appendChild(handle.buyButton);

            // Set tier
            handle.elemTierLabel.innerText = T.ingame.shop.tier.replace("<x>", getRomanNumber(tier));

            handle.elemTierLabel.setAttribute("data-tier", tier);

            this.trackClicks(handle.buyButton, () => {
                //@ts-ignore its there
                this.root.hud.parts.unlockNotification.showForLevel(0, reward);
                this.root.hubGoals.gainedRewards[reward] = 1;
                this.researchedVariants.push(variant);
                this.root.hubGoals.takeShapeByKey(researchShapes[tier - 1], tierToRequiredAmount[tier]);
                this.root.hubGoals.takeShapeByKey(shape, uniqueShapeRequirement);
                this.rerenderFull();
            });

            // Assign handle
            this.variantToElements[variant] = handle;

            // now actually add everything else

            // Cleanup detectors
            for (let i = 0; i < handle.requireIndexToElement.length; ++i) {
                const requiredHandle = handle.requireIndexToElement[i];
                requiredHandle.container.remove();
                if (requiredHandle.infoDetector) {
                    requiredHandle.infoDetector.cleanup();
                }
            }
            handle.requireIndexToElement = [];

            const available = tier <= this.tier;
            const complete = !!this.isResearchCompleted(variant);

            handle.icon.classList.toggle("hidden", complete || !available);
            handle.buyButton.classList.toggle("hidden", complete || !available);

            if (complete) {
                handle.elemDescription.innerText = "COMPLETED";
                continue;
            }

            handle.elemDescription.innerText = available
                ? desc
                : `LOCKED (Research Tier ${getRomanNumber(tier)} Required)`;

            if (!available) {
                // we can't research this yet
                continue;
            }

            const tierShape = researchShapes[tier - 1];
            const shapes = [tierShape, shape];
            const amounts = [tierToRequiredAmount[tier], uniqueShapeRequirement];

            for (let i = 0; i < shapes.length; i++) {
                const container = makeDiv(handle.elemRequirements, null, ["requirement"]);

                const shapeDef = this.root.shapeDefinitionMgr.getShapeFromShortKey(shapes[i]);
                const shapeCanvas = shapeDef.generateAsCanvas(80);
                shapeCanvas.classList.add();
                container.appendChild(shapeCanvas);

                // pin
                const pinButton = document.createElement("button");
                pinButton.classList.add("pin");
                container.appendChild(pinButton);

                const currentGoalShape = this.root.hubGoals.currentGoal.definition.getHash();
                if (shape === currentGoalShape) {
                    pinButton.classList.add("isGoal");
                } else if (this.root.hud.parts["pinnedShapes"].isShapePinned(shape)) {
                    pinButton.classList.add("alreadyPinned");
                }

                const pinDetector = new ClickDetector(pinButton, {
                    consumeEvents: true,
                    preventDefault: true,
                });
                pinDetector.click.add(() => {
                    if (this.root.hud.parts["pinnedShapes"].isShapePinned(shape)) {
                        this.root.hud.signals.shapeUnpinRequested.dispatch(shape);
                        pinButton.classList.add("unpinned");
                        pinButton.classList.remove("pinned", "alreadyPinned");
                    } else {
                        this.root.hud.signals.shapePinRequested.dispatch(shapeDef);
                        pinButton.classList.add("pinned");
                        pinButton.classList.remove("unpinned");
                    }
                });

                const progressContainer = makeDiv(container, null, ["amount"]);
                const progressBar = document.createElement("label");
                progressBar.classList.add("progressBar");
                progressContainer.appendChild(progressBar);

                const progressLabel = document.createElement("label");
                progressContainer.appendChild(progressLabel);

                let infoDetector;
                infoDetector = new ClickDetector(shapeCanvas, {
                    consumeEvents: true,
                    preventDefault: true,
                });

                infoDetector.click.add(() =>
                    this.root.hud.signals.viewShapeDetailsRequested.dispatch(shapeDef)
                );

                handle.requireIndexToElement.push({
                    container,
                    progressLabel,
                    progressBar,
                    definition: shapeDef,
                    required: amounts[i],
                    pinDetector,
                    infoDetector,
                });
            }
        }
    }

    renderCountsAndStatus() {
        for (const variant in this.variantToElements) {
            const handle = this.variantToElements[variant];
            let hasShapes = true;
            for (let i = 0; i < handle.requireIndexToElement.length; ++i) {
                const { progressLabel, progressBar, definition, required } = handle.requireIndexToElement[i];

                const haveAmount = this.root.hubGoals.getShapesStored(definition);
                const progress = Math.min(haveAmount / required, 1.0);

                progressLabel.innerText = formatBigNumber(haveAmount) + " / " + formatBigNumber(required);
                progressBar.style.width = progress * 100.0 + "%";
                progressBar.classList.toggle("complete", progress >= 1.0);
                if (progress < 1.0) {
                    hasShapes = false;
                }
            }

            handle.buyButton.classList.toggle("buyable", hasShapes);
        }
    }

    initialize() {
        this.domAttach = new DynamicDomAttach(this.root, this.background, {
            attachClass: "visible",
        });

        this.inputReciever = new InputReceiver("research");
        this.keyActionMapper = new KeyActionMapper(this.root, this.inputReciever);

        this.keyActionMapper.getBinding(KEYMAPPINGS.general.back).add(this.close, this);
        this.keyActionMapper.getBinding(KEYMAPPINGS.ingame.menuClose).add(this.close, this);
        this.keyActionMapper.getBinding(KEYMAPPINGS.ingame.menuOpenShop).add(this.close, this);

        this.close();

        this.rerenderFull();
        this.root.signals.upgradePurchased.add(this.rerenderFull, this);
    }

    cleanup() {
        // Cleanup detectors
        for (const variant in this.variantToElements) {
            const handle = this.variantToElements[variant];
            for (let i = 0; i < handle.requireIndexToElement.length; ++i) {
                const requiredHandle = handle.requireIndexToElement[i];
                requiredHandle.container.remove();
                requiredHandle.pinDetector.cleanup();
                if (requiredHandle.infoDetector) {
                    requiredHandle.infoDetector.cleanup();
                }
            }
            handle.requireIndexToElement = [];
        }
    }

    show() {
        this.visible = true;
        this.root.app.inputMgr.makeSureAttachedAndOnTop(this.inputReciever);
        this.rerenderFull();
    }

    close() {
        this.visible = false;
        this.root.app.inputMgr.makeSureDetached(this.inputReciever);
        this.update();
    }

    update() {
        this.domAttach.update(this.visible);
        if (this.visible) {
            this.renderCountsAndStatus();
        }
    }

    isBlockingOverlay() {
        return this.visible;
    }

    isResearchCompleted(variant) {
        return this.researchedVariants.includes(variant) ? 1 : 0;
    }

    getAvailableResearch() {
        let available = 0;
        for (const variant in this.variantToElements) {
            const tier = researchVariants[variant].tier;
            const handle = this.variantToElements[variant];
            let hasShapes = true;
            for (let i = 0; i < handle.requireIndexToElement.length; ++i) {
                const { definition, required } = handle.requireIndexToElement[i];

                const haveAmount = this.root.hubGoals.getShapesStored(definition);
                const progress = haveAmount / required;
                if (progress < 1.0) {
                    hasShapes = false;
                }
            }
            if (!handle.requireIndexToElement.length) {
                hasShapes = false;
            }
            if (hasShapes) {
                available++;
            }
        }
        return available;
    }
}
