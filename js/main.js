import { Blueprint } from "shapez/game/blueprint";
import { MetaBalancerBuilding } from "shapez/game/buildings/balancer";
import { MetaMinerBuilding } from "shapez/game/buildings/miner";
import { MetaUndergroundBeltBuilding } from "shapez/game/buildings/underground_belt";
import { HUDBlueprintPlacer } from "shapez/game/hud/parts/blueprint_placer";
import { Mod } from "shapez/mods/mod";
import {
    BlueprintExtension,
    BlueprintPlacerExtension,
    overrideLockedBlueprintsDialogue,
    pinNewBlueprintType,
} from "./extensions/blueprint_extension";
import {
    addNewBalancerVariants,
    BalancerExtension,
    overrideBalancerHandle,
} from "./extensions/balancer_extension";
import { MetaBeltCrossingBuilding } from "./buildings/belt_crossing";
import { addDeepMinerMultiplier, addNewMinerVariants, MinerExtension } from "./extensions/miner_extension";
import {
    addCombinedShapeDefinitions,
    MetaShapeCombinerBuilding,
    registerShapeCombinerProcessorType,
} from "./buildings/shape_combiner";
import {
    addNewUndergroundBeltVariants,
    overrideUndergroundBeltFindReciever,
    UndergroundBeltExtension,
} from "./extensions/underground_belt_extension";
import { addBeltCrossingOutputCheck, BeltCrossingComponent } from "./components/belt_crossing";
import { DeepMinerComponent } from "./components/deep_miner";
import { HideSlotsComponent, hideSlotsWhenPlacing } from "./components/hide_slots";
import { SmartBalancerComponent } from "./components/smart_balancer";
import { SmartUndergroundBeltComponent } from "./components/smart_underground_belt";
import { extendGameMode } from "./extensions/game_mode_extension";
import { newHubGoalRewards, registerNewGoalTranslations } from "./new_hub_goals";
import { BeltCrossingSystem } from "./systems/belt_crossing";
import { SmartBalancerSystem } from "./systems/smart_balancer";
import { SmartUnderGroundBeltSystem } from "./systems/smart_underground_belt";
import { MetaStorageBuilding } from "shapez/game/buildings/storage";
import {
    addNewStorageVariants,
    addSmallerDrawForMini,
    StorageExtension,
} from "./extensions/storage_extension";
import { MetaStackerBuilding } from "shapez/game/buildings/stacker";
import {
    addNewStackerVariants,
    addQuadStackerProcessorType,
    addQuadStackerProcessRequirement,
    StackerExtension,
} from "./extensions/stacker_extension";
import { ShapeDefinition } from "shapez/game/shape_definition";
import { ShapeDefinitionExtension, StaticDefinitionExtension } from "./extensions/shape_definition_extension";
import {
    MetaShapeCompressorBuilding,
    registerShapeCompressorProcessorType,
} from "./buildings/shape_compressor";
import { MainMenuState } from "shapez/states/main_menu";
import {
    constantSignalEditEditConstantSignal,
    getWireBuildingIsUnlocked,
    hubSystemRedrawHubBaseTexture,
} from "./methodOverrides";
import { MetaCutterBuilding } from "shapez/game/buildings/cutter";
import {
    addLaserCutterProcessorType,
    addNewCutterVariants,
    CutterExtension,
} from "./extensions/cutter_extension";
import { HUDConstantSignalEdit } from "shapez/game/hud/parts/constant_signal_edit";
import {
    addHyperlinkAcceptorsToHub,
    addHyperlinkOutputCheck,
    addHyperlinkSlotPreviews,
    MetaHyperlinkBuilding,
} from "./buildings/hyperlink";
import { HyperlinkComponent } from "./components/hyperlink";
import { HyperlinkAcceptorComponent } from "./components/hyperlink_acceptor";
import { HyperlinkEjectorComponent } from "./components/hyperlink_ejector";
import { HyperlinkSystem } from "./systems/hyperlink";
import { HyperlinkEjectorSystem } from "./systems/hyperlink_ejector";
import { HubSystem } from "shapez/game/systems/hub";
import { MetaConstantSignalBuilding } from "shapez/game/buildings/constant_signal";
import { MetaLogicGateBuilding } from "shapez/game/buildings/logic_gate";
import { MetaVirtualProcessorBuilding } from "shapez/game/buildings/virtual_processor";
import { MetaTransistorBuilding } from "shapez/game/buildings/transistor";
import { MetaAnalyzerBuilding } from "shapez/game/buildings/analyzer";
import { MetaComparatorBuilding } from "shapez/game/buildings/comparator";
import { HUDShop } from "shapez/game/hud/parts/shop";
import { calculateMaxTierOnDeserialize, HUDShopExtension } from "./extensions/shop_extension";
import { enumPainterVariants, MetaPainterBuilding } from "shapez/game/buildings/painter";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { MetaReaderBuilding } from "shapez/game/buildings/reader";
import { HUDTutorialVideoOffer } from "shapez/game/hud/parts/tutorial_video_offer";
import { replaceGoalExplanations } from "./new_goal_mappings";
import { GameMenuExtension } from "./extensions/game_menu_extension";
import { HUDGameMenu } from "shapez/game/hud/parts/game_menu";
import { HUDResearch, researchVariants } from "./hud/research";
import { HubGoals } from "shapez/game/hub_goals";
import { HubGoalsExtension } from "./extensions/hub_goals_extension";
import { MainMenuExtension } from "./extensions/main_menu_extension";
import { MetaBeltBuilding } from "shapez/game/buildings/belt";
import { MetaRotaterBuilding } from "shapez/game/buildings/rotater";
import { MetaMixerBuilding } from "shapez/game/buildings/mixer";
import { MetaTrashBuilding } from "shapez/game/buildings/trash";

class ModImpl extends Mod {
    init() {
        // Add new buildings and variants
        this.addSmartBalancers();
        this.addDeepMiner();
        this.addShapeCombiner();
        this.addSmartTunnel();
        this.addBeltCrossing();
        this.addMiniStorage();
        this.addQuadStacker();
        this.addLaserCutter();
        this.addHyperlink();

        this.addShapeCompressor();
        this.replaceShapeLayerDraw();

        // add new features
        this.addHiddenSlotsComponent();
        this.addLoadSaveWarning();
        this.addTieredBlueprints();
        this.fixHubLevelScaling();
        this.addNewBuildingsToToolbar();
        this.correctWireBuildingUnlocks();

        this.addMaxUpgradeLevel();
        this.turnOffTutorials();
        this.extendGameMenu();
        this.addResearch();
        this.saveGainedRewards();
        this.changeQuadPainterDescription();

        registerNewGoalTranslations(this.modInterface);
        replaceGoalExplanations(this.modInterface);
        extendGameMode(this.modInterface);
        this.modInterface.extendClass(HubGoals, HubGoalsExtension);
    }

    addHiddenSlotsComponent() {
        this.modInterface.registerComponent(HideSlotsComponent);
        hideSlotsWhenPlacing(this.modInterface);
    }

    addSmartBalancers() {
        this.modInterface.registerComponent(SmartBalancerComponent);
        this.modInterface.registerGameSystem({
            id: "smartBalancer",
            systemClass: SmartBalancerSystem,
            before: "itemAcceptor",
        });
        this.modInterface.extendClass(MetaBalancerBuilding, BalancerExtension);
        addNewBalancerVariants(this.modInterface);
        overrideBalancerHandle(this.modInterface);
    }

    addDeepMiner() {
        this.modInterface.registerComponent(DeepMinerComponent);
        this.modInterface.extendClass(MetaMinerBuilding, MinerExtension);
        addDeepMinerMultiplier(this.modInterface);
        addNewMinerVariants(this.modInterface);
    }

    addShapeCombiner() {
        this.modInterface.registerNewBuilding({ metaClass: MetaShapeCombinerBuilding });
        addCombinedShapeDefinitions(this.modInterface);
        registerShapeCombinerProcessorType(this.modInterface);
        this.modInterface.replaceMethod(
            HUDConstantSignalEdit,
            "editConstantSignal",
            //@ts-ignore this works
            constantSignalEditEditConstantSignal
        );
    }

    addSmartTunnel() {
        this.modInterface.registerComponent(SmartUndergroundBeltComponent);
        this.modInterface.registerGameSystem({
            id: "smartUndergroundBelt",
            systemClass: SmartUnderGroundBeltSystem,
            before: "itemAcceptor",
        });
        this.modInterface.extendClass(MetaUndergroundBeltBuilding, UndergroundBeltExtension);
        addNewUndergroundBeltVariants(this.modInterface);
        overrideUndergroundBeltFindReciever(this.modInterface);
    }

    addBeltCrossing() {
        this.modInterface.registerNewBuilding({ metaClass: MetaBeltCrossingBuilding });
        this.modInterface.registerComponent(BeltCrossingComponent);
        this.modInterface.registerGameSystem({
            id: "beltCrossing",
            systemClass: BeltCrossingSystem,
            before: "itemProcessor",
        });
        addBeltCrossingOutputCheck(this.modInterface);
    }

    addTieredBlueprints() {
        this.modInterface.extendClass(Blueprint, BlueprintExtension);
        this.modInterface.extendClass(HUDBlueprintPlacer, BlueprintPlacerExtension);
        pinNewBlueprintType(this.modInterface);
        overrideLockedBlueprintsDialogue(this.modInterface);
    }

    addMiniStorage() {
        addSmallerDrawForMini(this.modInterface);
        addNewStorageVariants(this.modInterface);
        this.modInterface.extendClass(MetaStorageBuilding, StorageExtension);
    }

    addQuadStacker() {
        this.modInterface.extendClass(MetaStackerBuilding, StackerExtension);
        addQuadStackerProcessorType(this.modInterface);
        addQuadStackerProcessRequirement(this.modInterface);
        addNewStackerVariants(this.modInterface);
    }

    replaceShapeLayerDraw() {
        this.modInterface.extendClass(ShapeDefinition, ShapeDefinitionExtension);
        this.modInterface.extendObject(ShapeDefinition, StaticDefinitionExtension);
    }

    addShapeCompressor() {
        this.modInterface.registerNewBuilding({ metaClass: MetaShapeCompressorBuilding });
        registerShapeCompressorProcessorType(this.modInterface);
    }

    addLoadSaveWarning() {
        this.modInterface.extendClass(MainMenuState, MainMenuExtension);
    }

    addLaserCutter() {
        this.modInterface.extendClass(MetaCutterBuilding, CutterExtension);
        addLaserCutterProcessorType(this.modInterface);
        addNewCutterVariants(this.modInterface);
    }

    addHyperlink() {
        this.modInterface.registerNewBuilding({ metaClass: MetaHyperlinkBuilding });
        this.modInterface.registerComponent(HyperlinkComponent);
        this.modInterface.registerComponent(HyperlinkAcceptorComponent);
        this.modInterface.registerComponent(HyperlinkEjectorComponent);
        this.modInterface.registerGameSystem({
            id: "hyperlink",
            systemClass: HyperlinkSystem,
            before: "itemProcessor",
        });
        this.modInterface.registerGameSystem({
            id: "hyperlinkEjector",
            systemClass: HyperlinkEjectorSystem,
            before: "hyperlink",
        });
        addHyperlinkOutputCheck(this.modInterface);
        addHyperlinkSlotPreviews(this.modInterface);
        addHyperlinkAcceptorsToHub(this.modInterface);
    }

    fixHubLevelScaling() {
        this.modInterface.replaceMethod(
            HubSystem,
            "redrawHubBaseTexture",
            //@ts-ignore this works
            hubSystemRedrawHubBaseTexture
        );
    }

    addNewBuildingsToToolbar() {
        // still wish there was a nicer way to do this
        this.modLoader.signals.hudElementInitialized.add(element => {
            const name = "HUDBuildingsToolbar";
            if (element.constructor.name === name) {
                element["secondaryBuildings"].unshift(MetaBeltCrossingBuilding, MetaHyperlinkBuilding);
                element["secondaryBuildings"].push(MetaShapeCombinerBuilding, MetaShapeCompressorBuilding);

                //element["primaryBuildings"] = [
                //    MetaBeltBuilding,
                //    MetaBalancerBuilding,
                //    MetaUndergroundBeltBuilding,
                //    MetaMinerBuilding,
                //    MetaCutterBuilding,
                //    MetaRotaterBuilding,
                //    MetaStackerBuilding,
                //    MetaMixerBuilding,
                //    MetaPainterBuilding,
                //    MetaTrashBuilding,
                //];
            }
        });
    }

    // a bit messy, but it works
    correctWireBuildingUnlocks() {
        this.modInterface.replaceMethod(
            MetaConstantSignalBuilding,
            "getIsUnlocked",
            //@ts-ignore this works
            getWireBuildingIsUnlocked
        );
        this.modInterface.replaceMethod(
            MetaLogicGateBuilding,
            "getIsUnlocked",
            //@ts-ignore this works
            getWireBuildingIsUnlocked
        );
        this.modInterface.replaceMethod(
            MetaVirtualProcessorBuilding,
            "getIsUnlocked",
            //@ts-ignore this works
            getWireBuildingIsUnlocked
        );
        this.modInterface.replaceMethod(
            MetaAnalyzerBuilding,
            "getIsUnlocked",
            //@ts-ignore this works
            getWireBuildingIsUnlocked
        );
        this.modInterface.replaceMethod(
            MetaComparatorBuilding,
            "getIsUnlocked",
            //@ts-ignore this works
            getWireBuildingIsUnlocked
        );
        this.modInterface.replaceMethod(
            MetaTransistorBuilding,
            "getIsUnlocked",
            //@ts-ignore this works
            getWireBuildingIsUnlocked
        );
        this.modInterface.replaceMethod(
            MetaReaderBuilding,
            "getIsUnlocked",
            //@ts-ignore this works
            getWireBuildingIsUnlocked
        );
        this.modInterface.replaceMethod(
            MetaPainterBuilding,
            "getAvailableVariants",
            function ($original, [root]) {
                let variants = [defaultBuildingVariant, enumPainterVariants.mirrored];
                if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_painter_double)) {
                    variants.push(enumPainterVariants.double);
                }
                if (root.hubGoals.isRewardUnlocked(newHubGoalRewards.reward_quad_painter)) {
                    variants.push(enumPainterVariants.quad);
                }
                return variants;
            }
        );
    }

    addMaxUpgradeLevel() {
        this.modInterface.extendClass(HUDShop, HUDShopExtension);
        calculateMaxTierOnDeserialize(this.modInterface);
    }

    extendGameMenu() {
        this.modInterface.extendClass(HUDGameMenu, GameMenuExtension);
    }

    turnOffTutorials() {
        // this does what it's supposed to do
        this.modInterface.replaceMethod(HUDTutorialVideoOffer, "initialize", () => {});
    }

    addResearch() {
        this.modInterface.registerHudElement("research", HUDResearch);
        this.modInterface.replaceMethod(
            MetaPainterBuilding,
            "getAvailableVariants",
            function ($original, [root]) {
                let variants = [defaultBuildingVariant, enumPainterVariants.mirrored];
                if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_painter_double)) {
                    variants.push(enumPainterVariants.double);
                }
                if (root.hubGoals.isRewardUnlocked(newHubGoalRewards.reward_quad_painter)) {
                    variants.push(enumPainterVariants.quad);
                }
                return variants;
            }
        );
    }

    saveGainedRewards() {
        this.signals.gameSerialized.add(
            (/** @type {import("shapez/savegame/savegame").GameRoot} */ root, data) => {
                data.modExtraData["gainedRewards"] = root.hubGoals.gainedRewards;
            }
        );
        this.signals.gameDeserialized.add((root, data) => {
            root.app.settings.updateSetting("offerHints", false);
            const gainedRewards = data.modExtraData["gainedRewards"];
            if (gainedRewards) {
                root.hubGoals.gainedRewards = gainedRewards;

                const variants = Object.keys(researchVariants);
                for (let i = 0; i < variants.length; i++) {
                    const { reward } = researchVariants[variants[i]];
                    // check to see if we already researched it
                    if (gainedRewards[reward]) {
                        root.hud.parts.research.researchedVariants.push(variants[i]);
                        console.log("Adding reward from saved research: " + reward);
                    }
                    root.hud.parts.research.rerenderFull();
                }
            }

            const shop = root.hud.parts.shop;
            for (const upgradeId in shop.upgradeToElements) {
                const currentTier = root.hubGoals.getUpgradeLevel(upgradeId);
                if (currentTier > shop.maxUpgradeTier) {
                    root.hubGoals.upgradeLevels[upgradeId] = shop.maxUpgradeTier;
                    console.log(
                        "Resetting " + upgradeId + " upgrades to max tier - tier " + shop.maxUpgradeTier
                    );
                }
            }
        });
    }

    changeQuadPainterDescription() {
        this.modInterface.registerTranslations("en", {
            buildings: {
                painter: {
                    quad: {
                        description:
                            "Allows you to color each layer of a shape individually. Only slots with a <strong>truthy signal</strong> on the wires layer will be painted!",
                    },
                },
            },
        });
    }
}
