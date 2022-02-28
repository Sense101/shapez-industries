import { RandomNumberGenerator } from "shapez/core/rng";
import { clamp } from "shapez/core/utils";
import { enumColors } from "shapez/game/colors";
import { enumSubShape, ShapeDefinition } from "shapez/game/shape_definition";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { enumCombinedShape } from "../buildings/shape_combiner";
import { newHubGoalRewards } from "../new_hub_goals";

export const HubGoalsExtension = ({ $old }) => ({
    /**
     * Creates the next goal
     */
    computeNextGoal() {
        const storyIndex = this.level - 1;
        const levels = this.root.gameMode.getLevelDefinitions();
        if (storyIndex < levels.length) {
            const { shape, required, reward, throughputOnly } = levels[storyIndex];
            this.currentGoal = {
                /** @type {ShapeDefinition} */
                definition: this.root.shapeDefinitionMgr.getShapeFromShortKey(shape),
                required,
                reward,
                throughputOnly,
            };
            return;
        }

        // we are at freeplay, work out a freeplay goal

        const required = Math.min(300, Math.floor(this.level / 10));
        let reward = enumHubGoalRewards.no_reward_freeplay;

        // this is super messy, but I really don't care
        if (this.level < 1100 && this.level % 10 == 0) {
            reward = newHubGoalRewards.reward_upgrade_tier;
        } else if (this.level < 11000 && this.level % 100 == 0) {
            reward = newHubGoalRewards.reward_upgrade_tier;
        } else if (this.level < 110000 && this.level % 1000 == 0) {
            reward = newHubGoalRewards.reward_upgrade_tier;
        } else if (this.level < 1100000 && this.level % 10000 == 0) {
            reward = newHubGoalRewards.reward_upgrade_tier;
        } else if (this.level < 11000000 && this.level % 100000 == 0) {
            reward = newHubGoalRewards.reward_upgrade_tier;
        } else if (this.level < 110000000 && this.level % 1000000 == 0) {
            reward = newHubGoalRewards.reward_upgrade_tier;
        }

        this.currentGoal = {
            definition: this.computeFreeplayShape(this.level),
            required,
            reward,
            throughputOnly: true,
        };
    },

    /**
     * Returns whether a given upgrade can be unlocked
     * @param {string} upgradeId
     */
    canUnlockUpgrade(upgradeId) {
        const tiers = this.root.gameMode.getUpgrades()[upgradeId];
        const currentLevel = this.getUpgradeLevel(upgradeId);

        if (currentLevel >= tiers.length || currentLevel >= this.root.hud.parts.shop.maxUpgradeTier) {
            // Max level
            return false;
        }

        const tierData = tiers[currentLevel];

        for (let i = 0; i < tierData.required.length; ++i) {
            const requirement = tierData.required[i];
            if ((this.storedShapes[requirement.shape] || 0) < requirement.amount) {
                return false;
            }
        }
        return true;
    },

    computeFreeplayShape(level) {
        const maxLayerCount = clamp(this.level / 25, 2, 4);

        /** @type {Array<import("./shape_definition_extension").ShapeLayer>} */
        let layers = [];

        const rng = new RandomNumberGenerator(this.root.map.seed + "/" + level);
        const layerCount = rng.nextIntRange(Math.max(1, maxLayerCount - 1), maxLayerCount + 1);

        const allColors = generateRandomColorSet(rng);

        const colorWheel = [
            enumColors.red,
            enumColors.yellow,
            enumColors.green,
            enumColors.cyan,
            enumColors.blue,
            enumColors.purple,
            enumColors.red,
            enumColors.yellow,
            enumColors.white,
        ];
        if (level > 50) {
            colorWheel.push(enumColors.uncolored);
        }

        const symmetries = [
            [
                // radial symmetry
                [0, 2],
                [1, 3],
            ],
            [
                // full round
                [0, 1, 2, 3],
            ],
        ];
        let availableShapes = [
            enumSubShape.rect,
            enumSubShape.circle,
            enumSubShape.star,
            enumCombinedShape.circlestar,
            enumCombinedShape.rectcircle,
            enumCombinedShape.starrect,
        ];
        if (rng.next() < 0.5) {
            availableShapes.push(
                enumSubShape.windmill,
                enumCombinedShape.circlewindmill,
                enumCombinedShape.rectwindmill,
                enumCombinedShape.starwindmill
            ); // windmill looks good only in radial symmetry
        } else {
            symmetries.push(
                [
                    // horizontal axis
                    [0, 3],
                    [1, 2],
                ],
                [
                    // vertical axis
                    [0, 1],
                    [2, 3],
                ],
                [
                    // diagonal axis
                    [0, 2],
                    [1],
                    [3],
                ],
                [
                    // other diagonal axis
                    [1, 3],
                    [0],
                    [2],
                ]
            );
        }
        const pickedSymmetry = rng.choice(symmetries); // pairs of quadrants that must be the same

        const randomShape = () => rng.choice(availableShapes);

        let anyIsMissingTwo = false;

        for (let i = 0; i < layerCount; ++i) {
            /** @type {import("./shape_definition_extension").ShapeLayer} */
            const layer = [null, null, null, null];
            const colors = allColors[i];

            for (let j = 0; j < pickedSymmetry.length; ++j) {
                const group = pickedSymmetry[j];
                const shape = randomShape();
                for (let k = 0; k < group.length; ++k) {
                    const quad = group[k];
                    layer[quad] = {
                        subShape: shape,
                        color: null,
                    };
                }
                if (rng.next() > 0.75) {
                    // link stuff
                    for (let k = 0; k < group.length; ++k) {
                        const index = group[k];
                        const quadBefore = (index + 3) % 4;
                        const quadAfter = (index + 1) % 4;
                        if (group.includes(quadBefore) && layer[quadBefore]) {
                            layer[quadBefore].linkedAfter = true;
                            layer[index].linkedBefore = true;
                        }
                        if (group.includes(quadAfter) && layer[quadAfter]) {
                            layer[quadAfter].linkedBefore = true;
                            layer[index].linkedAfter = true;
                        }
                    }
                }
            }

            let availableColors = colorWheel;

            for (let j = 0; j < colors.length; ++j) {
                const group = colors[j];
                const colorIndex = rng.nextIntRange(0, availableColors.length);
                for (let k = 0; k < group.length; ++k) {
                    const quad = group[k];
                    if (layer[quad]) {
                        layer[quad].color = availableColors[colorIndex];
                    }
                }
                availableColors.splice(colorIndex, 1);
            }

            for (let j = 0; j < pickedSymmetry.length; ++j) {
                const group = pickedSymmetry[j];
                if (rng.next() > 0.75) {
                    // link stuff
                    const color = layer[group[0]].color;
                    for (let k = 0; k < group.length; ++k) {
                        const index = group[k];
                        const quadBefore = (index + 3) % 4;
                        const quadAfter = (index + 1) % 4;
                        if (group.includes(quadBefore) && layer[quadBefore]) {
                            layer[quadBefore].linkedAfter = true;
                            layer[index].linkedBefore = true;
                        }
                        if (group.includes(quadAfter) && layer[quadAfter]) {
                            layer[quadAfter].linkedBefore = true;
                            layer[index].linkedAfter = true;
                        }

                        if (layer[index]) {
                            layer[index].color = color;
                        }
                    }
                }
            }

            if (level > 100 && rng.next() > 0.8) {
                layer[rng.nextIntRange(0, 4)] = null;
            }

            // Sometimes they actually are missing *two* ones!
            // Make sure at max only one layer is missing it though, otherwise we could
            // create an uncreateable shape
            if (level > 150 && rng.next() > 0.9 && !anyIsMissingTwo) {
                layer[rng.nextIntRange(0, 4)] = null;
                anyIsMissingTwo = true;
            }

            // and afterwards update links
            for (let quadrantIndex = 0; quadrantIndex < 4; ++quadrantIndex) {
                const quadrant = layer[quadrantIndex];
                if (quadrant) {
                    const lastQuadrant = layer[(quadrantIndex + 3) % 4];
                    const nextQuadrant = layer[(quadrantIndex + 1) % 4];
                    if (!lastQuadrant) {
                        quadrant.linkedBefore = false;
                    }
                    if (!nextQuadrant) {
                        quadrant.linkedAfter = false;
                    }
                }
            }

            layers.push(layer);
        }

        //@ts-ignore no it's not the same
        const definition = new ShapeDefinition({ layers });
        return this.root.shapeDefinitionMgr.registerOrReturnHandle(definition);
    },
});

function generateRandomColorSet(rng) {
    const allPositions = [];

    for (let i = 0; i < 4; i++) {
        const positions = [
            [
                [0, 1],
                [2, 3],
            ],
            [
                [1, 2],
                [0, 3],
            ],
            [
                [0, 2],
                [1, 3],
            ],
        ];

        const chance = rng.next();

        if (chance > 0.8) {
            positions.push([[0, 1, 2, 3]]);
        }

        allPositions.push(rng.choice(positions));
    }

    return allPositions;
}
