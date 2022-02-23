import { Component } from "shapez/game/component";

export class SmartUndergroundBeltComponent extends Component {
    static getId() {
        return "SmartUndergroundBelt";
    }

    /**
     *
     * @param {object} param0
     * @param {number=} param0.rotationVariant The rotation variant of the smart tunnel
     */
    constructor({ rotationVariant = 0 }) {
        super();

        this.rotationVariant = rotationVariant;
    }
}
