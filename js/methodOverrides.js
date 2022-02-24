import { globalConfig, THIRDPARTY_URLS } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { DialogWithForm } from "shapez/core/modal_dialog_elements";
import { FormElementInput, FormElementItemChooser } from "shapez/core/modal_dialog_forms";
import { Rectangle } from "shapez/core/rectangle";
import { ORIGINAL_SPRITE_SCALE } from "shapez/core/sprites";
import { fillInLinkIntoTranslation, formatBigNumber } from "shapez/core/utils";
import { HUDConstantSignalEdit } from "shapez/game/hud/parts/constant_signal_edit";
import { BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON } from "shapez/game/items/boolean_item";
import { COLOR_ITEM_SINGLETONS } from "shapez/game/items/color_item";
import { HubSystem } from "shapez/game/systems/hub";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { T } from "shapez/translations";
import { newHubGoalRewards } from "./new_hub_goals";

/**
 * Asks the entity to enter a valid signal code
 * @this {HUDConstantSignalEdit}
 */
export function constantSignalEditEditConstantSignal($original, [entity, { deleteOnCancel = true }]) {
    if (!entity.components.ConstantSignal) {
        return;
    }

    // Ok, query, but also save the uid because it could get stale
    const uid = entity.uid;

    const signal = entity.components.ConstantSignal.signal;
    const signalValueInput = new FormElementInput({
        id: "signalValue",
        label: fillInLinkIntoTranslation(
            T.dialogs.editSignal.descShortKey,
            "https://sense101.github.io/shapez-industries-viewer"
        ),
        placeholder: "",
        defaultValue: signal ? signal.getAsCopyableKey() : "",
        validator: val => this.parseSignalCode(entity, val),
    });

    const items = [...Object.values(COLOR_ITEM_SINGLETONS)];

    if (entity.components.WiredPins) {
        items.unshift(BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON);
        items.push(
            this.root.shapeDefinitionMgr.getShapeItemFromShortKey(this.root.gameMode.getBlueprintShapeKey())
        );
    } else {
        // producer which can produce virtually anything
        const shapes = ["CuCuCuCu", "RuRuRuRu", "WuWuWuWu", "SuSuSuSu"];
        items.unshift(
            ...shapes.reverse().map(key => this.root.shapeDefinitionMgr.getShapeItemFromShortKey(key))
        );
    }

    if (this.root.hubGoals.isRewardUnlocked(newHubGoalRewards.reward_shape_combiner)) {
        const shapes = ["1u1u1u1u", "2u2u2u2u", "3u3u3u3u", "4u4u4u4u", "5u5u5u5u", "6u6u6u6u"];
        items.unshift(...shapes.map(key => this.root.shapeDefinitionMgr.getShapeItemFromShortKey(key)));
    }

    if (this.root.gameMode.hasHub()) {
        items.push(
            this.root.shapeDefinitionMgr.getShapeItemFromDefinition(this.root.hubGoals.currentGoal.definition)
        );
    }

    if (this.root.hud.parts["pinnedShapes"]) {
        items.push(
            ...this.root.hud.parts["pinnedShapes"].pinnedShapes.map(key =>
                this.root.shapeDefinitionMgr.getShapeItemFromShortKey(key)
            )
        );
    }

    const itemInput = new FormElementItemChooser({
        id: "signalItem",
        label: null,
        items,
    });

    const dialog = new DialogWithForm({
        app: this.root.app,
        title: T.dialogs.editConstantProducer.title,
        desc: T.dialogs.editSignal.descItems,
        formElements: [itemInput, signalValueInput],
        buttons: ["cancel:bad:escape", "ok:good:enter"],
        closeButton: false,
    });
    this.root.hud.parts.dialogs.internalShowDialog(dialog);

    // When confirmed, set the signal
    const closeHandler = () => {
        if (!this.root || !this.root.entityMgr) {
            // Game got stopped
            return;
        }

        const entityRef = this.root.entityMgr.findByUid(uid, false);
        if (!entityRef) {
            // outdated
            return;
        }

        const constantComp = entityRef.components.ConstantSignal;
        if (!constantComp) {
            // no longer interesting
            return;
        }

        if (itemInput.chosenItem) {
            constantComp.signal = itemInput.chosenItem;
        } else {
            constantComp.signal = this.parseSignalCode(entity, signalValueInput.getValue());
        }
    };

    dialog.buttonSignals["ok"].add(() => {
        closeHandler();
    });
    dialog.valueChosen.add(() => {
        dialog.closeRequested.dispatch();
        closeHandler();
    });

    // When cancelled, destroy the entity again
    if (deleteOnCancel) {
        dialog.buttonSignals["cancel"].add(() => {
            if (!this.root || !this.root.entityMgr) {
                // Game got stopped
                return;
            }

            const entityRef = this.root.entityMgr.findByUid(uid, false);
            if (!entityRef) {
                // outdated
                return;
            }

            const constantComp = entityRef.components.ConstantSignal;
            if (!constantComp) {
                // no longer interesting
                return;
            }

            this.root.logic.tryDeleteBuilding(entityRef);
        });
    }
}

/**
 * @this {HubSystem}
 */
export function hubSystemRedrawHubBaseTexture($original, [canvas, context, w, h, dpi]) {
    // This method is quite ugly, please ignore it!

    context.scale(dpi, dpi);

    const parameters = new DrawParameters({
        context,
        visibleRect: new Rectangle(0, 0, w, h),
        desiredAtlasScale: ORIGINAL_SPRITE_SCALE,
        zoomLevel: dpi * 0.75,
        root: this.root,
    });

    context.clearRect(0, 0, w, h);

    this.hubSprite.draw(context, 0, 0, w, h);

    const definition = this.root.hubGoals.currentGoal.definition;
    definition.drawCentered(45, 58, parameters, 36);

    const goal = this.root.hubGoals.currentGoal;

    const textOffsetX = 70;
    const textOffsetY = 61;

    if (goal.throughputOnly) {
        // Throughput
        const deliveredText = T.ingame.statistics.shapesDisplayUnits.second.replace(
            "<shapes>",
            formatBigNumber(goal.required)
        );

        context.font = "bold 12px GameFont";
        context.fillStyle = "#64666e";
        context.textAlign = "left";
        context.fillText(deliveredText, textOffsetX, textOffsetY);
    } else {
        // Deliver count
        const delivered = this.root.hubGoals.getCurrentGoalDelivered();
        const deliveredText = "" + formatBigNumber(delivered);

        if (delivered > 9999) {
            context.font = "bold 16px GameFont";
        } else if (delivered > 999) {
            context.font = "bold 20px GameFont";
        } else {
            context.font = "bold 25px GameFont";
        }
        context.fillStyle = "#64666e";
        context.textAlign = "left";
        context.fillText(deliveredText, textOffsetX, textOffsetY);

        // Required
        context.font = "13px GameFont";
        context.fillStyle = "#a4a6b0";
        context.fillText("/ " + formatBigNumber(goal.required), textOffsetX, textOffsetY + 13);
    }

    /** @type {string} */
    let rewardTitle = T.storyRewards[goal.reward].title;
    if (goal.reward == newHubGoalRewards.reward_upgrade_tier) {
        // @ts-ignore ts doesn't know such things
        rewardTitle = rewardTitle.replace("<x>", String(this.root.hud.parts.shop.maxUpgradeTier + 1));
    }
    // Reward
    const rewardText = rewardTitle.toUpperCase();
    if (rewardText.length > 12) {
        context.font = "bold 8px GameFont";
    } else {
        context.font = "bold 10px GameFont";
    }
    context.fillStyle = "#fd0752";
    context.textAlign = "center";

    context.fillText(rewardText, 2 * globalConfig.tileSize, 105);

    // Level "8"
    let fontSize = 10;
    const levelLength = this.root.hubGoals.level.toString().length;

    for (let i = 0; i < levelLength - 2; i++) {
        fontSize -= 2;
    }
    context.font = `bold ${fontSize}px GameFont`;
    context.fillStyle = "#fff";
    context.fillText("" + this.root.hubGoals.level, 27, 32);

    // "LVL"
    context.textAlign = "center";
    context.fillStyle = "#fff";
    context.font = "bold 6px GameFont";
    context.fillText(T.buildings.hub.levelShortcut, 27, 22);

    // "Deliver"
    context.fillStyle = "#64666e";
    context.font = "bold 10px GameFont";
    context.fillText(T.buildings.hub.deliver.toUpperCase(), 2 * globalConfig.tileSize, 30);

    // "To unlock"
    const unlockText = T.buildings.hub.toUnlock.toUpperCase();
    if (unlockText.length > 15) {
        context.font = "bold 8px GameFont";
    } else {
        context.font = "bold 10px GameFont";
    }
    context.fillText(T.buildings.hub.toUnlock.toUpperCase(), 2 * globalConfig.tileSize, 92);

    context.textAlign = "left";
}

export function getWireBuildingIsUnlocked($original, [root]) {
    return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_wires_painter_and_levers);
}
