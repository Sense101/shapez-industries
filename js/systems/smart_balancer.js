import { gMetaBuildingRegistry } from "shapez/core/global_registries";
import { Vector } from "shapez/core/vector";
import { MetaBalancerBuilding } from "shapez/game/buildings/balancer";
import { getCodeFromBuildingData } from "shapez/game/building_codes";
import { SmartBalancerComponent } from "../components/smart_balancer";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";

/**
 * Manages all smart Balancers
 */
export class SmartBalancerSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [SmartBalancerComponent]);

        // add signals to recompute rotation variants
        this.root.signals.entityDestroyed.add(this.updateSmartBalancerVariant, this);
        this.root.signals.entityChanged.add(this.updateSmartBalancerVariant, this);
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

        /** @type {MetaBalancerBuilding} */
        const metaBalancer = gMetaBuildingRegistry.findByClass(MetaBalancerBuilding);
        // Compute affected area
        const originalRect = staticComp.getTileSpaceBounds();
        const affectedArea = originalRect.expandedInAllDirections(1);

        for (let x = affectedArea.x; x < affectedArea.right(); ++x) {
            for (let y = affectedArea.y; y < affectedArea.bottom(); ++y) {
                if (originalRect.containsPoint(x, y)) {
                    // Make sure we don't update the original entity
                    continue;
                }

                const targetEntities = this.root.map.getLayersContentsMultipleXY(x, y);
                for (let i = 0; i < targetEntities.length; ++i) {
                    const targetEntity = targetEntities[i];

                    /** @type {SmartBalancerComponent} */
                    const smartBalancerComp = targetEntity.components[SmartBalancerComponent.getId()];
                    const staticComp = targetEntity.components.StaticMapEntity;

                    if (!smartBalancerComp || !smartBalancerComp.variant) {
                        // Not a smart balancer
                        continue;
                    }

                    const { rotationVariant } = metaBalancer.computeOptimalDirectionAndRotationVariantAtTile({
                        root: this.root,
                        tile: new Vector(x, y),
                        rotation: staticComp.originalRotation,
                        variant: smartBalancerComp.variant,
                        layer: targetEntity.layer,
                    });

                    // Check if new rotation variant is different
                    if (smartBalancerComp.rotationVariant != rotationVariant) {
                        smartBalancerComp.rotationVariant = rotationVariant;

                        metaBalancer.updateVariants(targetEntity, rotationVariant, smartBalancerComp.variant);

                        // Update code as well
                        staticComp.code = getCodeFromBuildingData(
                            metaBalancer,
                            smartBalancerComp.variant,
                            rotationVariant
                        );

                        // Make sure the chunks know about the update
                        this.root.signals.entityChanged.dispatch(targetEntity);
                    }
                }
            }
        }
    }
}
