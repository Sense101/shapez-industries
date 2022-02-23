import { Component } from "shapez/game/component";

export class SmartBalancerComponent extends Component {
    static getId() {
        return "SmartBalancer";
    }

    /**
     *
     * @param {object} param0
     * @param {string|null=} param0.variant The variant of the smart balancer
     * @param {number|null=} param0.rotationVariant The rotation variant of the smart balancer
     */
    constructor({ variant, rotationVariant }) {
        super();

        this.variant = variant;
        this.rotationVariant = rotationVariant;
    }
}
