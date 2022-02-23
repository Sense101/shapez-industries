import { Component } from "shapez/game/component";
import { typeItemSingleton } from "shapez/game/item_resolver";
import { types } from "shapez/savegame/serialization";

export class HyperlinkComponent extends Component {
    static getId() {
        return "Hyperlink";
    }

    static getSchema() {
        return {
            items: types.fixedSizeArray(typeItemSingleton),
        };
    }

    constructor({ active = true, maxItems = 2 }) {
        super();

        this.active = active;
        this.items = [];
        this.maxItems = maxItems;
    }

    tryTakeItem(item) {
        if (this.items.length < this.maxItems) {
            this.items.push(item);
            return true;
        }
        return false;
    }
}
