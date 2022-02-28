import {
    enumColors,
    enumColorsToHexCode,
    enumColorToShortcode,
    enumShortcodeToColor,
} from "shapez/game/colors";
import {
    enumShortcodeToSubShape,
    enumSubShape,
    enumSubShapeToShortcode,
    ShapeDefinition,
} from "shapez/game/shape_definition";
import { THEME } from "shapez/game/theme";

/**
 * @typedef {{
 * linkedBefore?: boolean,
 * linkedAfter?: boolean,
 * subShape: enumSubShape,
 * color: enumColors,
 * }} ShapeLayerItem
 */

/**
 * Order is Q1 (tr), Q2(br), Q3(bl), Q4(tl)
 * @typedef {[ShapeLayerItem?, ShapeLayerItem?, ShapeLayerItem?, ShapeLayerItem?]} ShapeLayer
 */

const degsToRads = Math.PI / 180;

/** @type {Object<string, (options: {context: CanvasRenderingContext2D, dims: number}) => void>} */
export const MOD_ADDITIONAL_SUB_SHAPE_DRAWERS = {};

/**
 * @param {string} id
 * @param {string} shortCode
 * @param {(options: {context: CanvasRenderingContext2D, dims: number}) => void} draw
 */
export function addModSubShapeType(id, shortCode, draw) {
    if (shortCode.length !== 1) {
        throw new Error("Bad short code: " + shortCode);
    }
    enumSubShape[id] = id;
    enumSubShapeToShortcode[id] = shortCode;
    enumShortcodeToSubShape[shortCode] = id;

    MOD_ADDITIONAL_SUB_SHAPE_DRAWERS[id] = draw;
}

export const ShapeDefinitionExtension = ({ $old }) => ({
    /**
     * Returns a unique id for this shape
     * @returns {string}
     */
    getHash() {
        if (this.cachedHash) {
            return this.cachedHash;
        }

        let id = "";
        for (let layerIndex = 0; layerIndex < this.layers.length; ++layerIndex) {
            /** @type {ShapeLayer} */
            const layer = this.layers[layerIndex];

            let layerId = "";
            for (let index = 0; index < 4; ++index) {
                const item = layer[index];
                const lastItem = layer[(index + 3) % 4];
                if (item) {
                    const shapeCode = enumSubShapeToShortcode[item.subShape];
                    const colorCode = enumColorToShortcode[item.color];
                    if (item.linkedBefore) {
                        assert(lastItem, "Item is linked but the item before is null");
                        if (item.subShape == lastItem.subShape) {
                            layerId += "_";
                        } else {
                            layerId += shapeCode;
                        }
                        layerId += "_";

                        if (layerId == "________") {
                            layerId = shapeCode + colorCode + "______";
                        }
                        const colors = [...layerId].filter((value, index) => index % 2 == 1).join("");
                        if (colors == "____") {
                            let firstShapePos = 0;
                            for (let i = 6; i >= 0; i -= 2) {
                                if (layerId[i] != "_") {
                                    firstShapePos = i;
                                }
                            }
                            const part1 = layerId.slice(0, firstShapePos + 1);
                            const part2 = layerId.slice(firstShapePos + 2);
                            layerId = part1 + colorCode + part2;
                        }
                    } else {
                        layerId += shapeCode + enumColorToShortcode[item.color];
                    }
                } else {
                    layerId += "--";
                }
            }
            id += layerId;

            if (layerIndex < this.layers.length - 1) {
                id += ":";
            }
        }
        this.cachedHash = id;
        return id;
    },

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} context
     * @param {number} w
     * @param {number} h
     * @param {number} dpi
     */
    internalGenerateShapeBuffer(canvas, context, w, h, dpi) {
        context.translate((w * dpi) / 2, (h * dpi) / 2);
        context.scale((dpi * w) / 23, (dpi * h) / 23);

        const quadrantSize = 10;

        context.fillStyle = THEME.items.circleBackground;
        // @ts-ignore it doesn't recognise context.beginCircle
        context.beginCircle(0, 0, quadrantSize * 1.15);
        context.fill();

        // this is the important part
        for (let layerIndex = 0; layerIndex < this.layers.length; ++layerIndex) {
            let rotation = 0;

            /** @type {Array<ShapeLayerItem>}*/
            const layer = this.layers[layerIndex];

            const layerScale = Math.max(0.1, 0.9 - layerIndex * 0.22);
            const dims = quadrantSize * layerScale;

            let pathActive = false;
            for (let index = 0; index < layer.length; ++index) {
                const item = layer[index];
                if (!item) {
                    // this quadrant is empty
                    rotation += 90;
                    rotateContext(context, 90);
                    continue;
                }

                const { linkedBefore, linkedAfter, subShape, color } = item;

                if (!pathActive) {
                    context.beginPath(); // @TODO might not work here
                    pathActive = true;
                }

                context.strokeStyle = THEME.items.outline;
                context.lineWidth = THEME.items.outlineWidth;
                context.fillStyle = enumColorsToHexCode[color];

                if (!linkedBefore) {
                    context.moveTo(0, 0);
                }

                this.drawOuterSubShape(context, dims, subShape);

                if (!linkedAfter) {
                    // we have no linked item
                    context.lineTo(-THEME.items.outlineWidth / 2, 0);
                    context.fill();
                    context.stroke();
                    context.closePath();
                    pathActive = false;
                }
                // rotate at the end
                rotation += 90;
                rotateContext(context, 90);
            }

            if (pathActive) {
                context.fill();
                context.stroke();

                // outline the first shape once more to fill the gap
                this.drawOuterSubShape(context, dims, layer[0].subShape);
                context.stroke();
                context.closePath();
            }

            // reset rotation for next layer
            rotateContext(context, -rotation);
        }
    },

    /**
     * @param {CanvasRenderingContext2D} context
     * @param {number} dims
     * @param {string} subShape
     */
    drawOuterSubShape(context, dims, subShape) {
        if (MOD_ADDITIONAL_SUB_SHAPE_DRAWERS[subShape]) {
            MOD_ADDITIONAL_SUB_SHAPE_DRAWERS[subShape]({
                context,
                dims,
            });
        } else {
            switch (subShape) {
                case enumSubShape.rect: {
                    context.lineTo(0, -dims);
                    context.lineTo(dims, -dims);
                    context.lineTo(dims, 0);
                    break;
                }
                case enumSubShape.star: {
                    const moveInwards = dims * 0.4;
                    context.lineTo(0, -dims + moveInwards);
                    context.lineTo(dims, -dims);
                    context.lineTo(dims - moveInwards, 0);
                    break;
                }

                case enumSubShape.windmill: {
                    const moveInwards = dims * 0.4;
                    context.lineTo(0, -dims + moveInwards);
                    context.lineTo(dims, -dims);
                    context.lineTo(dims, 0);
                    break;
                }

                case enumSubShape.circle: {
                    context.lineTo(0, -dims);
                    context.arcTo(dims, -dims, dims, 0, dims);
                    break;
                }

                default: {
                    throw new Error("Unkown sub shape: " + subShape);
                }
            }
        }
    },

    /**
     * Returns a definition with only the given quadrants
     * @param {Array<number>} includeQuadrants
     * @returns {ShapeDefinition}
     */
    cloneFilteredByQuadrants(includeQuadrants) {
        const newLayers = this.getClonedLayers();
        for (let layerIndex = 0; layerIndex < newLayers.length; ++layerIndex) {
            /** @type {ShapeLayer} */
            const layer = newLayers[layerIndex];
            let anyContents = false;
            for (let quadrantIndex = 0; quadrantIndex < 4; ++quadrantIndex) {
                if (includeQuadrants.indexOf(quadrantIndex) < 0) {
                    const lastQuadrant = layer[(quadrantIndex + 3) % 4];
                    const nextQuadrant = layer[(quadrantIndex + 1) % 4];
                    layer[quadrantIndex] = null;
                    if (lastQuadrant) {
                        lastQuadrant.linkedAfter = false;
                    }
                    if (nextQuadrant) {
                        nextQuadrant.linkedBefore = false;
                    }
                } else if (layer[quadrantIndex]) {
                    anyContents = true;
                }
            }

            // Check if the layer is entirely empty
            if (!anyContents) {
                newLayers.splice(layerIndex, 1);
                layerIndex -= 1;
            }
        }
        return new ShapeDefinition({ layers: newLayers });
    },

    /**
     * Clones the shape and colors everything in the given colors
     * @param {[enumColors, enumColors, enumColors, enumColors]} colors
     */
    cloneAndPaintWith4Colors(colors) {
        const newLayers = this.getClonedLayers();

        for (let layerIndex = 0; layerIndex < newLayers.length; ++layerIndex) {
            if (colors[layerIndex]) {
                const quadrants = newLayers[layerIndex];
                for (let quadrantIndex = 0; quadrantIndex < 4; ++quadrantIndex) {
                    const item = quadrants[quadrantIndex];
                    if (item) {
                        item.color = colors[layerIndex];
                    }
                }
            }
        }
        return new ShapeDefinition({ layers: newLayers });
    },
});

/**
 * Cache which shapes are valid short keys and which not
 * @type {Map<string, boolean>}
 */
const SHORT_KEY_CACHE = new Map();

// ------------------------------------------------------------------ //
// just NEVER look at the code below here, it gives me physical pain, but not that much anymore
// ------------------------------------------------------------------ //

export const StaticDefinitionExtension = ({ $old }) => ({
    /**
     * Generates the definition from the given short key
     * @param {string} key
     * @returns {ShapeDefinition}
     */
    fromShortKey(key) {
        const sourceLayers = key.split(":");
        let layers = [];
        for (let i = 0; i < sourceLayers.length; ++i) {
            const text = sourceLayers[i];
            assert(text.length === 8, "Invalid shape key | wrong length: " + key);

            /** @type {ShapeLayer} */
            const items = [];

            let linkedShapes = 1;

            // add initial
            for (let i = 0; i < 4; ++i) {
                const shapeText = text[i * 2 + 0];
                const colorText = text[i * 2 + 1];

                if (shapeText == "-") {
                    // it's nothing
                    assert(colorText == "-", "Invalid shape key | shape is null but not color: ", key);
                    items.push(null);
                    continue;
                }

                const subShape = enumShortcodeToSubShape[shapeText];
                const color = enumShortcodeToColor[colorText];

                if (colorText == "_") {
                    //it's linked
                    items.push({
                        linkedBefore: true,
                        subShape: subShape || null,
                        color: null,
                    });
                    linkedShapes++;
                } else if (subShape) {
                    assert(color, "Invalid shape key | invalid color: " + key);
                    items.push({
                        subShape,
                        color,
                    });
                } else {
                    assert(false, "Invalid shape key: " + key);
                }
            }

            // now loop through items to complete links
            for (let itemIndex = 0; itemIndex < 4; ++itemIndex) {
                const item = items[itemIndex];
                const lastItem = items[(itemIndex + 3) % 4];

                let lastFullItem;
                for (let i = 1; i < 4; i++) {
                    const fullItem = items[(itemIndex + 4 - i) % 4];
                    if (fullItem && fullItem.subShape) {
                        lastFullItem = fullItem;
                        break;
                    }
                }

                if (item && item.linkedBefore) {
                    assert(lastItem, "Item is set to linked but the item before is null: " + lastItem);
                    assert(
                        lastFullItem,
                        "Item is set to linked but the last full item before is null: " + key
                    );
                    lastItem.linkedAfter = true;
                    item.color = lastFullItem.color;
                    if (!item.subShape) {
                        item.subShape = lastFullItem.subShape;
                    }
                }
            }

            if (linkedShapes > 3) {
                // we are linked all the way round
                for (let i = 0; i < items.length; i++) {
                    items[i].linkedBefore = true;
                    items[i].linkedAfter = true;
                }
            }
            layers.push(items);
        }

        //@ts-ignore yes, you want to have four items. Understandable. But I don't want 4 so you'll have to manage.
        const definition = new ShapeDefinition({ layers });
        // We know the hash so save some work
        definition.cachedHash = key;
        return definition;
    },

    /**
     * Checks if a given string is a valid short key
     * @param {string} key
     * @returns {boolean}
     */
    isValidShortKey(key) {
        if (SHORT_KEY_CACHE.has(key)) {
            return SHORT_KEY_CACHE.get(key);
        }

        const result = isValidShortKeyInternal(key);
        SHORT_KEY_CACHE.set(key, result);
        return result;
    },
});

function isValidShortKeyInternal(key) {
    const sourceLayers = key.split(":");
    let layers = [];
    for (let i = 0; i < sourceLayers.length; ++i) {
        let text = sourceLayers[i];
        if (text.length != 8) {
            return false;
        }

        /** @type {Array<ShapeLayerItem>} */
        const items = [];
        /** @type {ShapeLayerItem} */
        let lastItem = null;
        /** @type {string|null} */
        let lastColor = null;

        for (let i = 0; i < text.length / 2; ++i) {
            const shapeText = text[i * 2 + 0];
            const lastShapeText = text[((i - 1) % (text.length / 2)) * 2];
            const colorText = text[i * 2 + 1];

            if (shapeText == "-") {
                if (colorText != "-") {
                    return false;
                }
                items.push(null);
                lastItem = null;
                continue;
            }

            if (shapeText == "_") {
                if (!lastItem) {
                    if (i < 3 && lastShapeText != "-") {
                        // add it on to the end so we can try again later
                        text += shapeText + colorText;
                        continue;
                    } else {
                        // we've already been round once, stop now
                        return false;
                    }
                }
                if (colorText != "_") {
                    return false;
                }
                continue;
            }

            const subShape = enumShortcodeToSubShape[shapeText];
            const color = enumShortcodeToColor[colorText];

            if (subShape) {
                const linked = colorText == "_";
                if (!(linked || color)) {
                    return false;
                }
                if (linked && lastShapeText == "-") {
                    return false;
                }
                if (linked && !lastColor) {
                    if (i >= 4) {
                        // we've already been round once, stop now
                        return false;
                    } else {
                        // add it on to the end so we can try again later
                        text += shapeText + colorText;
                        continue;
                    }
                }

                if (!linked) {
                    lastColor = color;
                }
                const newItem = {
                    length: 1,
                    linked,
                    color: lastColor,
                    subShape,
                };
                items.push(newItem);
                lastItem = newItem;
            } else if (shapeText !== "-") {
                return false;
            }
        }

        if (!items.length || items.length > 4) {
            return false;
        }
        layers.push(items);
    }

    if (layers.length === 0 || layers.length > 4) {
        return false;
    }

    return true;
}

/**
 *
 * @param {CanvasRenderingContext2D} context
 * @param {number} degrees
 */
function rotateContext(context, degrees) {
    context.rotate(degrees * degsToRads);
}
