import { BeltPath } from "shapez/game/belt_path";
import { Component } from "shapez/game/component";
import { ItemEjectorSystem } from "shapez/game/systems/item_ejector";
import { ModInterface } from "shapez/mods/mod_interface";

export class BeltCrossingComponent extends Component {
    constructor(inputsToProcess = 1) {
        super();
        this.inputSlots = [];
        this.inputsToProcess = inputsToProcess;
    }

    static getId() {
        return "BeltCrossing";
    }

    tryTakeItem(item, sourceSlot) {
        // Check that we only take one item per slot
        for (let i = 0; i < this.inputSlots.length; ++i) {
            const slot = this.inputSlots[i];
            if (slot.sourceSlot === sourceSlot) {
                return false;
            }
        }

        this.inputSlots.push({ item, sourceSlot });
        return true;
    }
}

// --------------------------------------------- //

/**
 *
 * @param {ModInterface} modInterface
 */
export function addBeltCrossingOutputCheck(modInterface) {
    modInterface.replaceMethod(
        ItemEjectorSystem,
        "tryPassOverItem",
        function ($original, [item, reciever, slotIndex]) {
            const beltCrossingComp = reciever.components[BeltCrossingComponent.getId()];
            if (beltCrossingComp) {
                if (beltCrossingComp.tryTakeItem(item, slotIndex)) {
                    return true;
                }
                return false;
            }
            return $original(item, reciever, slotIndex);
        }
    );
    modInterface.replaceMethod(
        BeltPath,
        "computePassOverFunctionWithoutBelts",
        function ($original, [entity, matchingSlotIndex]) {
            const beltCrossingComp = entity.components[BeltCrossingComponent.getId()];
            if (beltCrossingComp) {
                return function (item) {
                    if (beltCrossingComp.tryTakeItem(item, matchingSlotIndex)) {
                        return true;
                    }
                };
            }
            return $original(entity, matchingSlotIndex);
        }
    );
}
