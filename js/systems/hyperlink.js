import { gMetaBuildingRegistry } from "shapez/core/global_registries";
import { enumAngleToDirection, enumDirectionToVector, Vector } from "shapez/core/vector";
import { getCodeFromBuildingData } from "shapez/game/building_codes";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { GameRoot } from "shapez/game/root";
import { MetaHyperlinkBuilding } from "../buildings/hyperlink";
import { HyperlinkComponent } from "../components/hyperlink";
import { HyperlinkAcceptorComponent } from "../components/hyperlink_acceptor";
import { HyperlinkEjectorComponent } from "../components/hyperlink_ejector";

export class HyperlinkSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [HyperlinkComponent]);

        this.root.signals.entityDestroyed.add(this.updateSurroundingHyperlinkPlacement, this);

        // Notice: These must come *after* the entity destroyed signals
        this.root.signals.entityAdded.add(this.updateSurroundingHyperlinkPlacement, this);
    }

    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];

            /** @type {HyperlinkComponent} */
            const hyperlinkComp = entity.components[HyperlinkComponent.getId()];
            /** @type {HyperlinkEjectorComponent} */
            const hyperlinkEjectorComp = entity.components[HyperlinkEjectorComponent.getId()];
            const ejectorComp = entity.components.ItemEjector;
            const staticComp = entity.components.StaticMapEntity;

            for (let i = 0; i < hyperlinkComp.items.length; i++) {
                const item = hyperlinkComp.items[i];

                if (hyperlinkEjectorComp.slots.length > 0) {
                    // we can eject to another hyperlink piece
                    const slot = hyperlinkEjectorComp.slots[0];
                    let target = slot.cachedTargetEntity;

                    if (target == null) {
                        slot.cachedTargetEntity = null;

                        const ejectSlotWsTile = staticComp.localTileToWorld(slot.pos);
                        const ejectSlotWsDirection = staticComp.localDirectionToWorld(slot.direction);
                        const ejectSlotWsDirectionVector = enumDirectionToVector[ejectSlotWsDirection];
                        const targetTile = ejectSlotWsTile.add(ejectSlotWsDirectionVector);

                        const newTarget = this.root.map.getLayerContentXY(
                            targetTile.x,
                            targetTile.y,
                            "regular"
                        );
                        if (
                            newTarget &&
                            newTarget.components[HyperlinkAcceptorComponent.getId()] &&
                            newTarget.components[HyperlinkAcceptorComponent.getId()].slots.length > 0
                        ) {
                            slot.cachedTargetEntity = newTarget;
                            target = newTarget;
                        }
                    }

                    if (target != null) {
                        if (target.components.Hub) {
                            // it's a hub, give it the item.
                            if (item.getItemType() == "shape") {
                                this.root.hubGoals.handleDefinitionDelivered(item.definition);
                                hyperlinkComp.items.splice(i, 1);
                                i--;
                            }
                        } else if (target.components[HyperlinkComponent.getId()].tryTakeItem(item)) {
                            hyperlinkComp.items.splice(i, 1);
                            i--;
                        }
                    }
                } else if (ejectorComp.slots.length > 2) {
                    // we are at the end of a hyperlink chain, eject as normal
                    const ejectSlot = ejectorComp.getFirstFreeSlot();
                    if (ejectSlot != null && ejectorComp.tryEject(ejectSlot, item)) {
                        hyperlinkComp.items.splice(i, 1);
                        i--;
                    }
                }
            }
        }
    }

    updateSurroundingHyperlinkPlacement(entity) {
        if (!this.root.gameInitialized) {
            return;
        }

        const staticComp = entity.components.StaticMapEntity;
        if (!staticComp) {
            return;
        }

        const metaHyperlink = gMetaBuildingRegistry.findByClass(MetaHyperlinkBuilding);
        // Compute affected area
        const originalRect = staticComp.getTileSpaceBounds();
        const affectedArea = originalRect.expandedInAllDirections(1);

        for (let x = affectedArea.x; x < affectedArea.right(); ++x) {
            for (let y = affectedArea.y; y < affectedArea.bottom(); ++y) {
                if (originalRect.containsPoint(x, y)) {
                    // I don't care.
                }

                const targetEntities = this.root.map.getLayersContentsMultipleXY(x, y);
                for (let i = 0; i < targetEntities.length; ++i) {
                    const targetEntity = targetEntities[i];

                    if (!targetEntity) {
                        continue;
                    }

                    const targetHyperlinkComp = targetEntity.components[HyperlinkComponent.getId()];
                    const targetStaticComp = targetEntity.components.StaticMapEntity;

                    if (!targetHyperlinkComp || !targetHyperlinkComp.active) {
                        // Not relevant
                        continue;
                    }

                    const { rotation, rotationVariant } =
                        metaHyperlink.computeOptimalDirectionAndRotationVariantAtTile({
                            root: this.root,
                            tile: new Vector(x, y),
                            rotation: targetStaticComp.originalRotation,
                            variant: defaultBuildingVariant,
                            layer: targetEntity.layer,
                        });

                    // Change stuff
                    targetStaticComp.rotation = rotation;
                    metaHyperlink.updateVariants(targetEntity, rotationVariant, defaultBuildingVariant);

                    // Update code as well
                    targetStaticComp.code = getCodeFromBuildingData(
                        metaHyperlink,
                        defaultBuildingVariant,
                        rotationVariant
                    );

                    // Make sure the chunks know about the update
                    this.root.signals.entityChanged.dispatch(targetEntity);
                }
            }
        }
    }
}
