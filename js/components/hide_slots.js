import { Component } from "shapez/game/component";
import { Entity } from "shapez/game/entity";
import { HUDBuildingPlacer } from "shapez/game/hud/parts/building_placer";
import { ModInterface } from "shapez/mods/mod_interface";

// Component to remove certain slots from an entity in specific situations

export class HideSlotsComponent extends Component {
    static getId() {
        return "HideSlots";
    }

    /**
     *
     * @param {object} param0
     * @param {Array<number>=} param0.hiddenAcceptorSlots The slots to hide when placing
     * @param {Array<number>=} param0.hiddenEjectorSlots The slots to hide when placing
     */
    constructor({ hiddenAcceptorSlots = [], hiddenEjectorSlots = [] }) {
        super();

        this.hiddenAcceptorSlots = hiddenAcceptorSlots;
        this.hiddenEjectorSlots = hiddenEjectorSlots;
    }

    /**
     * Removes hidden slots from the entity - called by the building placer
     * @param {Entity} entity
     */
    hideSlots(entity) {
        const acceptorComp = entity.components.ItemAcceptor;
        if (acceptorComp && this.hiddenAcceptorSlots.length) {
            let visibleSlots = [];
            for (let i = 0; i < acceptorComp.slots.length; i++) {
                if (!this.hiddenAcceptorSlots.includes(i)) {
                    visibleSlots.push(acceptorComp.slots[i]);
                }
            }
            acceptorComp.setSlots(visibleSlots);
        }

        const ejectorComp = entity.components.ItemEjector;
        if (ejectorComp && this.hiddenEjectorSlots.length) {
            let visibleSlots = [];
            for (let i = 0; i < ejectorComp.slots.length; i++) {
                if (!this.hiddenEjectorSlots.includes(i)) {
                    visibleSlots.push(ejectorComp.slots[i]);
                }
            }
            ejectorComp.setSlots(visibleSlots);
        }
    }
}

// -------------------------------------------- //

/**
 * @this {HUDBuildingPlacer}
 */
function runBeforeDraw() {
    if (!this.fakeEntity) {
        return;
    }

    /** @type {HideSlotsComponent} */
    const hideSlotsComp = this.fakeEntity.components[HideSlotsComponent.getId()];
    if (hideSlotsComp) {
        // change slots so they are hidden
        hideSlotsComp.hideSlots(this.fakeEntity);
    }
}

/**
 * @param {ModInterface} modInterface
 */
export function hideSlotsWhenPlacing(modInterface) {
    modInterface.runBeforeMethod(HUDBuildingPlacer, "drawMatchingAcceptorsAndEjectors", runBeforeDraw);
}
