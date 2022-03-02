import { ClickDetector } from "shapez/core/click_detector";
import { globalConfig } from "shapez/core/config";
import { InputReceiver } from "shapez/core/input_receiver";
import { formatBigNumber, getRomanNumber, makeDiv } from "shapez/core/utils";
import { HubGoals } from "shapez/game/hub_goals";
import { DynamicDomAttach } from "shapez/game/hud/dynamic_dom_attach";
import { HUDGameMenu } from "shapez/game/hud/parts/game_menu";
import { enumNotificationType } from "shapez/game/hud/parts/notifications";
import { KeyActionMapper, KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { ShapeDefinition } from "shapez/game/shape_definition";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { ModInterface } from "shapez/mods/mod_interface";
import { T } from "shapez/translations";
import { newHubGoalRewards } from "../new_hub_goals";

export const HUDShopExtension = ({ $old }) => ({
    createElements(parent) {
        this.maxUpgradeTier = 1;

        this.root.signals.storyGoalCompleted.add((level, reward) => {
            if (reward == newHubGoalRewards.reward_upgrade_tier) {
                this.maxUpgradeTier++;
            }
        }, this);

        this.background = makeDiv(parent, "ingame_HUD_Shop", ["ingameDialog"]);

        // DIALOG Inner / Wrapper
        this.dialogInner = makeDiv(this.background, null, ["dialogInner"]);
        this.title = makeDiv(this.dialogInner, null, ["title"], T.ingame.shop.title);
        this.closeButton = makeDiv(this.title, null, ["closeButton"]);
        this.trackClicks(this.closeButton, this.close);
        this.contentDiv = makeDiv(this.dialogInner, null, ["content"]);

        this.upgradeToElements = {};

        // Upgrades
        for (const upgradeId in this.root.gameMode.getUpgrades()) {
            const handle = {};
            handle.requireIndexToElement = [];

            // Wrapper
            handle.elem = makeDiv(this.contentDiv, null, ["upgrade"]);
            handle.elem.setAttribute("data-upgrade-id", upgradeId);

            // Title
            const title = makeDiv(handle.elem, null, ["title"], T.shopUpgrades[upgradeId].name);

            // Title > Tier
            handle.elemTierLabel = makeDiv(title, null, ["tier"]);

            // Icon
            handle.icon = makeDiv(handle.elem, null, ["icon"]);
            handle.icon.setAttribute("data-icon", "upgrades/" + upgradeId + ".png");

            // Description
            handle.elemDescription = makeDiv(handle.elem, null, ["description"], "??");
            handle.elemRequirements = makeDiv(handle.elem, null, ["requirements"]);
            handle.maxTierPopup = makeDiv(handle.elem, null, ["maxTierPopup"]);

            // Buy button
            handle.buyButton = document.createElement("button");
            handle.buyButton.classList.add("buy", "styledButton");
            handle.buyButton.innerText = T.ingame.shop.buttonUnlock;
            handle.elem.appendChild(handle.buyButton);

            this.trackClicks(handle.buyButton, () => this.tryUnlockNextTier(upgradeId));

            // Assign handle
            this.upgradeToElements[upgradeId] = handle;
        }
    },

    rerenderFull() {
        for (const upgradeId in this.upgradeToElements) {
            const handle = this.upgradeToElements[upgradeId];
            const upgradeTiers = this.root.gameMode.getUpgrades()[upgradeId];

            const currentTier = this.root.hubGoals.getUpgradeLevel(upgradeId);
            const currentTierMultiplier = this.root.hubGoals.upgradeImprovements[upgradeId];
            const tierHandle = upgradeTiers[currentTier];

            // Set tier
            handle.elemTierLabel.innerText = T.ingame.shop.tier.replace(
                "<x>",
                getRomanNumber(currentTier + 1)
            );

            handle.elemTierLabel.setAttribute("data-tier", currentTier);

            // Cleanup detectors
            for (let i = 0; i < handle.requireIndexToElement.length; ++i) {
                const requiredHandle = handle.requireIndexToElement[i];
                requiredHandle.container.remove();
                requiredHandle.pinDetector.cleanup();
                if (requiredHandle.infoDetector) {
                    requiredHandle.infoDetector.cleanup();
                }
            }

            // Cleanup
            handle.requireIndexToElement = [];

            const maxLevel = !tierHandle || currentTier >= this.maxUpgradeTier;
            handle.elem.classList.toggle("maxLevel", maxLevel);
            if (maxLevel) {
                // Max level
                handle.elemDescription.innerText = T.ingame.shop.maximumLevel.replace(
                    "<currentMult>",
                    formatBigNumber(currentTierMultiplier)
                );
                handle.maxTierPopup.innerText = `Unlock upgrades tier ${
                    this.maxUpgradeTier + 1
                } from a hub level to progress further!`;
            } else {
                // Set description
                handle.elemDescription.innerText = T.shopUpgrades[upgradeId].description
                    .replace("<currentMult>", formatBigNumber(currentTierMultiplier))
                    .replace("<newMult>", formatBigNumber(currentTierMultiplier + tierHandle.improvement));
            }

            for (const { shape, amount } of tierHandle.required) {
                const container = makeDiv(handle.elemRequirements, null, ["requirement"]);

                const shapeDef = this.root.shapeDefinitionMgr.getShapeFromShortKey(shape);
                const shapeCanvas = shapeDef.generateAsCanvas(120);
                shapeCanvas.classList.add();
                container.appendChild(shapeCanvas);

                const progressContainer = makeDiv(container, null, ["amount"]);
                const progressBar = document.createElement("label");
                progressBar.classList.add("progressBar");
                progressContainer.appendChild(progressBar);

                const progressLabel = document.createElement("label");
                progressContainer.appendChild(progressLabel);

                const pinButton = document.createElement("button");
                pinButton.classList.add("pin");
                container.appendChild(pinButton);

                let infoDetector;
                const viewInfoButton = document.createElement("button");
                viewInfoButton.classList.add("showInfo");
                container.appendChild(viewInfoButton);
                infoDetector = new ClickDetector(viewInfoButton, {
                    consumeEvents: true,
                    preventDefault: true,
                });
                infoDetector.click.add(() =>
                    this.root.hud.signals.viewShapeDetailsRequested.dispatch(shapeDef)
                );

                const currentGoalShape = this.root.hubGoals.currentGoal.definition.getHash();
                if (shape === currentGoalShape) {
                    pinButton.classList.add("isGoal");
                } else if (this.root.hud.parts.pinnedShapes.isShapePinned(shape)) {
                    pinButton.classList.add("alreadyPinned");
                }

                const pinDetector = new ClickDetector(pinButton, {
                    consumeEvents: true,
                    preventDefault: true,
                });
                pinDetector.click.add(() => {
                    if (this.root.hud.parts.pinnedShapes.isShapePinned(shape)) {
                        this.root.hud.signals.shapeUnpinRequested.dispatch(shape);
                        pinButton.classList.add("unpinned");
                        pinButton.classList.remove("pinned", "alreadyPinned");
                    } else {
                        this.root.hud.signals.shapePinRequested.dispatch(shapeDef);
                        pinButton.classList.add("pinned");
                        pinButton.classList.remove("unpinned");
                    }
                });

                handle.requireIndexToElement.push({
                    container,
                    progressLabel,
                    progressBar,
                    definition: shapeDef,
                    required: amount,
                    pinDetector,
                    infoDetector,
                });
            }
        }
    },

    renderCountsAndStatus() {
        for (const upgradeId in this.upgradeToElements) {
            const handle = this.upgradeToElements[upgradeId];
            for (let i = 0; i < handle.requireIndexToElement.length; ++i) {
                const { progressLabel, progressBar, definition, required } = handle.requireIndexToElement[i];

                const haveAmount = this.root.hubGoals.getShapesStored(definition);
                const progress = Math.min(haveAmount / required, 1.0);

                progressLabel.innerText = formatBigNumber(haveAmount) + " / " + formatBigNumber(required);
                progressBar.style.width = progress * 100.0 + "%";
                progressBar.classList.toggle("complete", progress >= 1.0);
            }

            handle.buyButton.classList.toggle("buyable", this.root.hubGoals.canUnlockUpgrade(upgradeId));
        }
    },

    initialize() {
        this.domAttach = new DynamicDomAttach(this.root, this.background, {
            attachClass: "visible",
        });

        this.inputReciever = new InputReceiver("shop");
        this.keyActionMapper = new KeyActionMapper(this.root, this.inputReciever);

        this.keyActionMapper.getBinding(KEYMAPPINGS.general.back).add(this.close, this);
        this.keyActionMapper.getBinding(KEYMAPPINGS.ingame.menuClose).add(this.close, this);
        this.keyActionMapper.getBinding(KEYMAPPINGS.ingame.menuOpenShop).add(this.close, this);

        this.close();

        this.rerenderFull();
        this.root.signals.upgradePurchased.add(this.rerenderFull, this);
    },

    tryUnlockNextTier(upgradeId) {
        this.root.hubGoals.tryUnlockUpgrade(upgradeId);
    },
});

/**
 * @param {ModInterface} modInterface
 */
export function calculateMaxTierOnDeserialize(modInterface) {
    modInterface.replaceMethod(HubGoals, "deserialize", function ($original, [data, root]) {
        const errorCode = $original(data, root);
        if (errorCode) {
            return errorCode;
        }
        const levels = root.gameMode.getLevelDefinitions();

        // Compute gained rewards
        for (let i = 0; i < this.level - 1; ++i) {
            if (i < levels.length) {
                const reward = levels[i].reward;
                this.gainedRewards[reward] = (this.gainedRewards[reward] || 0) + 1;
                if (reward) {
                    if (reward == newHubGoalRewards.reward_upgrade_tier) {
                        // @ts-ignore shop DOES exist
                        this.root.hud.parts.shop.maxUpgradeTier++;
                    }
                    if (reward == newHubGoalRewards.reward_research_t2) {
                        // @ts-ignore research DOES exist
                        this.root.hud.parts.research.tier = 2;
                    }
                    if (reward == newHubGoalRewards.reward_research_t3) {
                        // @ts-ignore research DOES exist
                        this.root.hud.parts.research.tier = 3;
                    }
                }
            }
        }
    });
}
