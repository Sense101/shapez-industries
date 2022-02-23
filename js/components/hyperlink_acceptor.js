import { enumDirection, enumInvertedDirections, Vector } from "shapez/core/vector";
import { Component } from "shapez/game/component";

/**
 * @typedef {{
 * pos: Vector,
 * direction: enumDirection
 * }} HyperlinkSlot
 */

export class HyperlinkAcceptorComponent extends Component {
    static getId() {
        return "HyperlinkAcceptor";
    }

    /**
     *
     * @param {object} param0
     * @param {Array<HyperlinkSlot>} param0.slots The slots from which we accept items
     */
    constructor({ slots = [] }) {
        super();

        this.setSlots(slots);
    }

    /**
     *
     * @param {Array<HyperlinkSlot>} slots
     */
    setSlots(slots) {
        /** @type {Array<HyperlinkSlot>} */
        this.slots = [];
        for (let i = 0; i < slots.length; ++i) {
            const slot = slots[i];
            this.slots.push({
                pos: slot.pos,
                direction: slot.direction,
            });
        }
    }

    /**
     * Tries to find a slot on the acceptor which could accept from the direction
     * @param {Vector} targetLocalTile
     * @param {enumDirection} fromLocalDirection
     * @returns {HyperlinkSlot|null}
     */
    findMatchingSlot(targetLocalTile, fromLocalDirection) {
        const desiredDirection = enumInvertedDirections[fromLocalDirection];

        // Go over all slots and try to find a target slot
        for (let slotIndex = 0; slotIndex < this.slots.length; ++slotIndex) {
            const slot = this.slots[slotIndex];

            // Make sure the acceptor slot is on the right position
            if (!slot.pos.equals(targetLocalTile)) {
                continue;
            }

            if (desiredDirection === slot.direction) {
                return slot;
            }
        }

        return null;
    }
}
