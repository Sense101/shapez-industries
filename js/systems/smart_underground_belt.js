import { gMetaBuildingRegistry } from "shapez/core/global_registries";
import { Vector } from "shapez/core/vector";
import { getCodeFromBuildingData } from "shapez/game/building_codes";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { MetaUndergroundBeltBuilding } from "shapez/game/buildings/underground_belt";
import { smartUndergroundBeltVariant } from "../extensions/underground_belt_extension";
import { SmartUndergroundBeltComponent } from "../components/smart_underground_belt";
import { enumUndergroundBeltMode } from "shapez/game/components/underground_belt";

/**
 * Manages all smart Balancers
 */
export class SmartUnderGroundBeltSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [SmartUndergroundBeltComponent]);

        // add signals to recompute rotation variants
        this.root.signals.entityDestroyed.add(this.updateSmartBalancerVariant, this);
        this.root.signals.entityAdded.add(this.updateSmartBalancerVariant, this);
    }

    updateSmartBalancerVariant(entity) {
        if (!this.root.gameInitialized) {
            return;
        }

        const staticComp = entity.components.StaticMapEntity;
        if (!staticComp) {
            return;
        }

        const metaUndergroundBelt = gMetaBuildingRegistry.findByClass(MetaUndergroundBeltBuilding);
        // Compute affected area
        const originalRect = staticComp.getTileSpaceBounds();
        const affectedArea = originalRect.expandedInAllDirections(1);

        for (let x = affectedArea.x; x < affectedArea.right(); ++x) {
            for (let y = affectedArea.y; y < affectedArea.bottom(); ++y) {
                if (originalRect.containsPoint(x, y)) {
                    // Make sure we don't update the original entity
                    continue;
                }

                const targetEntity = this.root.map.getLayerContentXY(x, y, "regular");

                if (!targetEntity) {
                    continue;
                }

                const undergroundBeltComp = targetEntity.components.UndergroundBelt;
                const smartUndergroundBeltComp =
                    targetEntity.components[SmartUndergroundBeltComponent.getId()];

                const staticComp = targetEntity.components.StaticMapEntity;

                if (!undergroundBeltComp || !smartUndergroundBeltComp) {
                    // Not a smart tunnel
                    continue;
                }

                const originalRotationVariant = smartUndergroundBeltComp.rotationVariant;
                const mode = Object.values(enumUndergroundBeltMode)[originalRotationVariant % 2];

                if (mode == enumUndergroundBeltMode.receiver) {
                    // it's a reciever
                    this.root.systemMgr.systems.itemEjector.recomputeSingleEntityCache(targetEntity);
                    const ejectorComp = targetEntity.components.ItemEjector;
                    if (ejectorComp.slots[0].cachedTargetEntity) {
                        continue;
                    }
                }

                const rotationVariant = metaUndergroundBelt.computeRotationVariantForSmart(
                    this.root,
                    new Vector(x, y),
                    staticComp.originalRotation,
                    mode,
                    originalRotationVariant
                );

                if (rotationVariant != originalRotationVariant) {
                    smartUndergroundBeltComp.rotationVariant = rotationVariant;

                    // Update stuff

                    targetEntity.components.ItemAcceptor.clear();
                    targetEntity.components.ItemEjector.clear();

                    metaUndergroundBelt.updateVariants(
                        targetEntity,
                        rotationVariant,
                        smartUndergroundBeltVariant
                    );

                    // Update code as well
                    staticComp.code = getCodeFromBuildingData(
                        metaUndergroundBelt,
                        smartUndergroundBeltVariant,
                        rotationVariant
                    );

                    // Make sure the chunks know about the update
                    this.root.signals.entityChanged.dispatch(targetEntity);
                }
            }
        }
    }
}
