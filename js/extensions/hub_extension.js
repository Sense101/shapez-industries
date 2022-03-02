import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { Rectangle } from "shapez/core/rectangle";
import { ORIGINAL_SPRITE_SCALE } from "shapez/core/sprites";
import { formatBigNumber } from "shapez/core/utils";
import { enumDirection, Vector } from "shapez/core/vector";
import { T } from "shapez/translations";
import { HyperlinkAcceptorComponent } from "../components/hyperlink_acceptor";
import { newHubGoalRewards } from "../new_hub_goals";

export const HubExtension = ({ $old }) => ({
    setupEntityComponents(entity, root) {
        const slots = [];
        for (let i = 0; i < 4; ++i) {
            slots.push(
                { pos: new Vector(i, 0), direction: enumDirection.top },
                { pos: new Vector(i, 3), direction: enumDirection.bottom },
                { pos: new Vector(0, i), direction: enumDirection.left },
                { pos: new Vector(3, i), direction: enumDirection.right }
            );
        }
        entity.addComponent(new HyperlinkAcceptorComponent({ slots }));

        $old.setupEntityComponents(entity, root);
    },
});

export const HubSystemExtension = ({ $old }) => ({
    redrawHubBaseTexture(canvas, context, w, h, dpi) {
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
            // @ts-ignore shop does exist
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
    },
});
