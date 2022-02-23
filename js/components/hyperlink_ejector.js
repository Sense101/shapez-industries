import { enumDirection, enumDirectionToVector, Vector } from "shapez/core/vector";
import { BaseItem } from "shapez/game/base_item";
import { Component } from "shapez/game/component";
import { Entity } from "shapez/game/entity";
import { typeItemSingleton } from "shapez/game/item_resolver";
import { types } from "shapez/savegame/serialization";
import { HyperlinkSlot } from "./hyperlink_acceptor";

/**
 * @typedef {{
 *    pos: Vector,
 *    direction: enumDirection,
 *    cachedTargetEntity?: Entity
 * }} HyperlinkEjectorSlot
 */

export class HyperlinkEjectorComponent extends Component {
    static getId() {
        return "HyperlinkEjector";
    }

    /**
     *
     * @param {object} param0
     * @param {Array<{pos: Vector, direction: enumDirection }>=} param0.slots The slots to eject on
     * @param {boolean=} param0.renderFloatingItems Whether to render items even if they are not connected
     */
    constructor({ slots = [], renderFloatingItems = true }) {
        super();

        this.setSlots(slots);
        this.renderFloatingItems = renderFloatingItems;
        this.lastUsedSlot = null;
        this.hasSpaceToMove = false;
    }

    /**
     * @param {Array<{pos: Vector, direction: enumDirection }>} slots The slots to eject on
     */
    setSlots(slots) {
        /** @type {Array<HyperlinkEjectorSlot>} */
        this.slots = [];
        for (let i = 0; i < slots.length; ++i) {
            const slot = slots[i];
            this.slots.push({
                pos: slot.pos,
                direction: slot.direction,
                cachedTargetEntity: null,
            });
        }
    }

    /**
     * Returns where this slot ejects to
     * @param {HyperlinkEjectorSlot} slot
     * @returns {Vector}
     */
    getSlotTargetLocalTile(slot) {
        const directionVector = enumDirectionToVector[slot.direction];
        return slot.pos.add(directionVector);
    }

    /**
     * Returns whether any slot ejects to the given local tile
     * @param {Vector} tile
     */
    anySlotEjectsToLocalTile(tile) {
        for (let i = 0; i < this.slots.length; ++i) {
            if (this.getSlotTargetLocalTile(this.slots[i]).equals(tile)) {
                return true;
            }
        }
        return false;
    }
}
