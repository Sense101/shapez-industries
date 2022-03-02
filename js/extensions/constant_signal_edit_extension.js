import { DialogWithForm } from "shapez/core/modal_dialog_elements";
import { FormElementInput, FormElementItemChooser } from "shapez/core/modal_dialog_forms";
import { fillInLinkIntoTranslation } from "shapez/core/utils";
import { enumColors } from "shapez/game/colors";
import { MODS_ADDITIONAL_CONSTANT_SIGNAL_RESOLVER } from "shapez/game/hud/parts/constant_signal_edit";
import { BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON } from "shapez/game/items/boolean_item";
import { COLOR_ITEM_SINGLETONS } from "shapez/game/items/color_item";
import { ShapeDefinition } from "shapez/game/shape_definition";
import { T } from "shapez/translations";
import { newHubGoalRewards } from "../new_hub_goals";

export const ConstantSignalEditExtension = ({ $old }) => ({
    editConstantSignal(entity, { deleteOnCancel = true }) {
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
                this.root.shapeDefinitionMgr.getShapeItemFromShortKey(
                    this.root.gameMode.getBlueprintShapeKey()
                )
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
                this.root.shapeDefinitionMgr.getShapeItemFromDefinition(
                    this.root.hubGoals.currentGoal.definition
                )
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
    },

    parseSignalCode(entity, code) {
        if (!this.root || !this.root.shapeDefinitionMgr) {
            // Stale reference
            return null;
        }

        code = code.trim();
        const codeLower = code.toLowerCase();

        if (MODS_ADDITIONAL_CONSTANT_SIGNAL_RESOLVER[codeLower]) {
            return MODS_ADDITIONAL_CONSTANT_SIGNAL_RESOLVER[codeLower].apply(this, [entity]);
        }

        if (enumColors[codeLower]) {
            return COLOR_ITEM_SINGLETONS[codeLower];
        }

        if (entity.components.WiredPins) {
            if (code === "1" || codeLower === "true") {
                return BOOL_TRUE_SINGLETON;
            }

            if (code === "0" || codeLower === "false") {
                return BOOL_FALSE_SINGLETON;
            }
        }

        if (ShapeDefinition.isValidShortKey(code)) {
            // recalculate hash
            const newDef = ShapeDefinition.fromShortKey(code);
            newDef.cachedHash = null;
            const newHash = newDef.getHash();
            return this.root.shapeDefinitionMgr.getShapeItemFromShortKey(newHash);
        }

        return null;
    },
});
