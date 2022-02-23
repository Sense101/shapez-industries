import { Component } from "shapez/game/component";

export class DeepMinerComponent extends Component {
    static getId() {
        return "DeepMiner";
    }

    /**
     *
     * @param {object} param0
     * @param {number=} param0.speedMultiplier The speed multiplier for the miner
     */
    constructor({ speedMultiplier = 2.5 }) {
        super();

        this.speedMultiplier = speedMultiplier;
    }
}
