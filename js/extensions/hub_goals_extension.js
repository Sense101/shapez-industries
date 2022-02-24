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

        //Floor Required amount to remove confusion
        const required = Math.min(200, Math.floor(4 + (storyIndex - 26) * 0.25));
        this.currentGoal = {
            definition: this.computeFreeplayShape(this.level),
            required,
            reward:
                this.level % 10 == 0
                    ? newHubGoalRewards.reward_upgrade_tier
                    : enumHubGoalRewards.no_reward_freeplay,
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
        const layerCount = clamp(this.level / 50, 2, 4);

        /** @type {Array<import("shapez/game/shape_definition").ShapeLayer>} */
        let layers = [];

        const rng = new RandomNumberGenerator(this.root.map.seed + "/" + level);

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
            /** @type {import("shapez/game/shape_definition").ShapeLayer} */
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

            // Sometimes they actually are missing *two* ones!
            // Make sure at max only one layer is missing it though, otherwise we could
            // create an uncreateable shape
            if (level > 75 && rng.next() > 0.9 && !anyIsMissingTwo) {
                layer[rng.nextIntRange(0, 4)] = null;
                anyIsMissingTwo = true;
            }

            layers.push(layer);
        }

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
