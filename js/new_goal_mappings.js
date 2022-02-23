import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { MetaBalancerBuilding } from "shapez/game/buildings/balancer";
import { MetaConstantSignalBuilding } from "shapez/game/buildings/constant_signal";
import { enumCutterVariants, MetaCutterBuilding } from "shapez/game/buildings/cutter";
import { MetaDisplayBuilding } from "shapez/game/buildings/display";
import { MetaFilterBuilding } from "shapez/game/buildings/filter";
import { MetaLogicGateBuilding } from "shapez/game/buildings/logic_gate";
import { enumMinerVariants, MetaMinerBuilding } from "shapez/game/buildings/miner";
import { MetaMixerBuilding } from "shapez/game/buildings/mixer";
import { enumPainterVariants, MetaPainterBuilding } from "shapez/game/buildings/painter";
import { MetaReaderBuilding } from "shapez/game/buildings/reader";
import { enumRotaterVariants, MetaRotaterBuilding } from "shapez/game/buildings/rotater";
import { MetaStackerBuilding } from "shapez/game/buildings/stacker";
import { MetaStorageBuilding } from "shapez/game/buildings/storage";
import {
    enumUndergroundBeltVariants,
    MetaUndergroundBeltBuilding,
} from "shapez/game/buildings/underground_belt";
import { defaultBuildingVariant, MetaBuilding } from "shapez/game/meta_building";
import { HUDUnlockNotification } from "shapez/game/hud/parts/unlock_notification";
import { SOUNDS } from "shapez/platform/sound";
import { T } from "shapez/translations";
import { enumNotificationType } from "shapez/game/hud/parts/notifications";
import { gMetaBuildingRegistry } from "shapez/core/global_registries";
import { deepMinerVariant } from "./extensions/miner_extension";
import { MetaShapeCombinerBuilding } from "./buildings/shape_combiner";
import { enumBeltCrossingVariants, MetaBeltCrossingBuilding } from "./buildings/belt_crossing";
import { MetaShapeCompressorBuilding } from "./buildings/shape_compressor";
import { laserCutterVariant } from "./extensions/cutter_extension";
import { MetaHyperlinkBuilding } from "./buildings/hyperlink";
import { smartUndergroundBeltVariant } from "./extensions/underground_belt_extension";
import { newHubGoalRewards } from "./new_hub_goals";
import { ModInterface } from "shapez/mods/mod_interface";
import { enumBalancerVariants } from "./extensions/balancer_extension";
import { quadStackerVariant } from "./extensions/stacker_extension";
import { miniStorageVariant } from "./extensions/storage_extension";

/** @typedef {Array<[typeof MetaBuilding, string]>} TutorialGoalReward */

/**
 * Helper method for proper types
 *  @returns {TutorialGoalReward}
 */
const typed = x => x;

/**
 * Stores which reward unlocks what
 * @enum {TutorialGoalReward?}
 */
export const newHubGoalRewardsToContentUnlocked = {
    // copied over
    [enumHubGoalRewards.reward_cutter_and_trash]: typed([[MetaCutterBuilding, defaultBuildingVariant]]),
    [enumHubGoalRewards.reward_rotater]: typed([[MetaRotaterBuilding, defaultBuildingVariant]]),
    [enumHubGoalRewards.reward_painter]: typed([[MetaPainterBuilding, defaultBuildingVariant]]),
    [enumHubGoalRewards.reward_mixer]: typed([[MetaMixerBuilding, defaultBuildingVariant]]),
    [enumHubGoalRewards.reward_stacker]: typed([[MetaStackerBuilding, defaultBuildingVariant]]),
    [enumHubGoalRewards.reward_balancer]: typed([[MetaBalancerBuilding, defaultBuildingVariant]]),
    [enumHubGoalRewards.reward_tunnel]: typed([[MetaUndergroundBeltBuilding, defaultBuildingVariant]]),

    [enumHubGoalRewards.reward_rotater_ccw]: typed([[MetaRotaterBuilding, enumRotaterVariants.ccw]]),
    [enumHubGoalRewards.reward_rotater_180]: typed([[MetaRotaterBuilding, enumRotaterVariants.rotate180]]),
    [enumHubGoalRewards.reward_miner_chainable]: typed([[MetaMinerBuilding, enumMinerVariants.chainable]]),
    [enumHubGoalRewards.reward_underground_belt_tier_2]: typed([
        [MetaUndergroundBeltBuilding, enumUndergroundBeltVariants.tier2],
    ]),
    [enumHubGoalRewards.reward_splitter]: typed([[MetaBalancerBuilding, enumBalancerVariants.smartSplitter]]),
    [enumHubGoalRewards.reward_merger]: typed([[MetaBalancerBuilding, enumBalancerVariants.smartMerger]]),
    [enumHubGoalRewards.reward_cutter_quad]: typed([[MetaCutterBuilding, enumCutterVariants.quad]]),
    [enumHubGoalRewards.reward_painter_double]: typed([[MetaPainterBuilding, enumPainterVariants.double]]),
    [enumHubGoalRewards.reward_storage]: typed([[MetaStorageBuilding, defaultBuildingVariant]]),

    [enumHubGoalRewards.reward_belt_reader]: typed([[MetaReaderBuilding, defaultBuildingVariant]]),
    [enumHubGoalRewards.reward_display]: typed([[MetaDisplayBuilding, defaultBuildingVariant]]),
    [enumHubGoalRewards.reward_constant_signal]: typed([
        [MetaConstantSignalBuilding, defaultBuildingVariant],
    ]),
    [enumHubGoalRewards.reward_logic_gates]: typed([[MetaLogicGateBuilding, defaultBuildingVariant]]),
    [enumHubGoalRewards.reward_filter]: typed([[MetaFilterBuilding, defaultBuildingVariant]]),
    [enumHubGoalRewards.reward_virtual_processing]: null,

    [enumHubGoalRewards.reward_wires_painter_and_levers]: typed([
        [MetaReaderBuilding, defaultBuildingVariant],
    ]),
    [enumHubGoalRewards.reward_freeplay]: null,
    [enumHubGoalRewards.reward_blueprints]: null,
    [enumHubGoalRewards.no_reward]: null,
    [enumHubGoalRewards.no_reward_freeplay]: null,
    [enumHubGoalRewards.reward_demo_end]: null,

    // new rewards

    [newHubGoalRewards.reward_deep_miner]: typed([[MetaMinerBuilding, deepMinerVariant]]),
    [newHubGoalRewards.reward_shape_combiner]: typed([[MetaShapeCombinerBuilding, defaultBuildingVariant]]),
    [newHubGoalRewards.reward_belt_crossing]: typed([[MetaBeltCrossingBuilding, defaultBuildingVariant]]),
    [newHubGoalRewards.reward_corner_crossing]: typed([
        [MetaBeltCrossingBuilding, enumBeltCrossingVariants.corner],
    ]),
    [newHubGoalRewards.reward_line_crossing]: typed([
        [MetaBeltCrossingBuilding, enumBeltCrossingVariants.switcher],
    ]),
    [newHubGoalRewards.reward_shape_compressor]: typed([
        [MetaShapeCompressorBuilding, defaultBuildingVariant],
    ]),
    [newHubGoalRewards.reward_laser_cutter]: typed([[MetaCutterBuilding, laserCutterVariant]]),
    [newHubGoalRewards.reward_hyperlink]: typed([[MetaHyperlinkBuilding, defaultBuildingVariant]]),
    [newHubGoalRewards.reward_smart_tunnel]: typed([
        [MetaUndergroundBeltBuilding, smartUndergroundBeltVariant],
    ]),
    [newHubGoalRewards.reward_quad_painter]: typed([[MetaPainterBuilding, enumPainterVariants.quad]]),
    [newHubGoalRewards.reward_quad_stacker]: typed([[MetaStackerBuilding, quadStackerVariant]]),
    [newHubGoalRewards.reward_mini_storage]: typed([[MetaStorageBuilding, miniStorageVariant]]),

    [newHubGoalRewards.reward_upgrades]: null,
    [newHubGoalRewards.reward_upgrade_tier]: null,
    [newHubGoalRewards.reward_research]: null,
    [newHubGoalRewards.reward_research_t2]: null,
    [newHubGoalRewards.reward_research_t3]: null,
    [newHubGoalRewards.reward_ratprints]: null,
};

/**
 *
 * @param {ModInterface} modInterface
 */
export function replaceGoalExplanations(modInterface) {
    modInterface.replaceMethod(HUDUnlockNotification, "showForLevel", function ($original, [level, reward]) {
        const isResearch = !level;
        this.root.soundProxy.playUi(SOUNDS.levelComplete);

        const levels = this.root.gameMode.getLevelDefinitions();
        // Don't use getIsFreeplay() because we want the freeplay level up to show
        if (level > levels.length) {
            this.root.hud.signals.notification.dispatch(
                T.ingame.notifications.freeplayLevelComplete.replace("<level>", String(level)),
                enumNotificationType.success
            );
            return;
        }

        this.root.app.inputMgr.makeSureAttachedAndOnTop(this.inputReciever);
        if (isResearch) {
            this.elemTitle.innerText = "RESEARCH";
        } else {
            this.elemTitle.innerText = T.ingame.levelCompleteNotification.levelTitle.replace(
                "<level>",
                ("" + level).padStart(2, "0")
            );
        }

        const rewardName = T.storyRewards[reward].title;

        let html = `
        <div class="rewardName">
            ${T.ingame.levelCompleteNotification.unlockText.replace("<reward>", rewardName)}
        </div>
        
        <div class="rewardDesc">
            ${T.storyRewards[reward].desc}
        </div>

        `;

        html += "<div class='images'>";
        const gained = newHubGoalRewardsToContentUnlocked[reward];
        if (gained) {
            gained.forEach(([metaBuildingClass, variant]) => {
                const metaBuilding = gMetaBuildingRegistry.findByClass(metaBuildingClass);
                html += `<div class="buildingExplanation" data-icon="building_tutorials/${
                    metaBuilding.getId() + (variant === defaultBuildingVariant ? "" : "-" + variant)
                }.png"></div>`;
            });
        }
        html += "</div>";

        this.elemContents.innerHTML = html;
        this.visible = true;

        if (this.buttonShowTimeout) {
            clearTimeout(this.buttonShowTimeout);
        }

        this.element.querySelector("button.close").classList.remove("unlocked");

        this.element.querySelector("button.close").classList.add("unlocked");

        this.element.querySelector("button.close").innerHTML = isResearch ? "Continue" : "Next Level";
    });
}
