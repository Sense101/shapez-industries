import { Rectangle } from "shapez/core/rectangle";
import { StaleAreaDetector } from "shapez/core/stale_area_detector";
import { enumDirectionToVector } from "shapez/core/vector";
import { BaseItem } from "shapez/game/base_item";
import { BeltComponent } from "shapez/game/components/belt";
import { Entity } from "shapez/game/entity";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";
import { HyperlinkAcceptorComponent } from "../components/hyperlink_acceptor";
import { HyperlinkEjectorComponent } from "../components/hyperlink_ejector";

export class HyperlinkEjectorSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [HyperlinkEjectorComponent]);

        this.staleAreaDetector = new StaleAreaDetector({
            root: this.root,
            name: "hyperlink-ejector",
            recomputeMethod: this.recomputeArea.bind(this),
        });

        this.staleAreaDetector.recomputeOnComponentsChanged(
            [HyperlinkEjectorComponent, HyperlinkAcceptorComponent, BeltComponent],
            1
        );

        this.root.signals.postLoadHook.add(this.recomputeCacheFull, this);
    }

    static getId() {
        return "hyperlinkEjector";
    }

    /**
     * Recomputes an area after it changed
     * @param {Rectangle} area
     */
    recomputeArea(area) {
        /** @type {Set<number>} */
        const seenUids = new Set();
        for (let x = 0; x < area.w; ++x) {
            for (let y = 0; y < area.h; ++y) {
                const tileX = area.x + x;
                const tileY = area.y + y;
                // @NOTICE: Item ejector currently only supports regular layer
                const contents = this.root.map.getLayerContentXY(tileX, tileY, "regular");
                if (contents && contents.components[HyperlinkEjectorComponent.getId()]) {
                    if (!seenUids.has(contents.uid)) {
                        seenUids.add(contents.uid);
                        this.recomputeSingleEntityCache(contents);
                    }
                }
            }
        }
    }

    /**
     * Recomputes the whole cache after the game has loaded
     */
    recomputeCacheFull() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            this.recomputeSingleEntityCache(entity);
        }
    }

    /**
     * @param {Entity} entity
     */
    recomputeSingleEntityCache(entity) {
        const ejectorComp = entity.components[HyperlinkEjectorComponent.getId()];
        const staticComp = entity.components.StaticMapEntity;
        for (let slotIndex = 0; slotIndex < ejectorComp.slots.length; ++slotIndex) {
            const ejectorSlot = ejectorComp.slots[slotIndex];

            // Clear the old cache.
            ejectorSlot.cachedTargetEntity = null;

            // Figure out where and into which direction we eject items
            const ejectSlotWsTile = staticComp.localTileToWorld(ejectorSlot.pos);
            const ejectSlotWsDirection = staticComp.localDirectionToWorld(ejectorSlot.direction);
            const ejectSlotWsDirectionVector = enumDirectionToVector[ejectSlotWsDirection];
            const ejectSlotTargetWsTile = ejectSlotWsTile.add(ejectSlotWsDirectionVector);

            // Try to find the given acceptor component to take the item
            // Since there can be cross layer dependencies, check on all layers
            const targetEntities = this.root.map.getLayersContentsMultipleXY(
                ejectSlotTargetWsTile.x,
                ejectSlotTargetWsTile.y
            );

            for (let i = 0; i < targetEntities.length; ++i) {
                const targetEntity = targetEntities[i];

                const targetStaticComp = targetEntity.components.StaticMapEntity;

                // Check for item acceptors
                const targetAcceptorComp = targetEntity.components[HyperlinkAcceptorComponent.getId()];
                if (!targetAcceptorComp) {
                    // Entity doesn't accept items
                    continue;
                }

                const matchingSlot = targetAcceptorComp.findMatchingSlot(
                    targetStaticComp.worldToLocalTile(ejectSlotTargetWsTile),
                    targetStaticComp.worldDirectionToLocal(ejectSlotWsDirection)
                );

                if (!matchingSlot) {
                    // No matching slot found
                    continue;
                }

                // A slot can always be connected to one other slot only
                ejectorSlot.cachedTargetEntity = targetEntity;
                break;
            }
        }
    }

    update() {
        this.staleAreaDetector.update();
    }
}
