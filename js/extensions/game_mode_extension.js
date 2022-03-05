import { findNiceIntegerValue } from "shapez/core/utils";
import { UpgradeTiers, LevelDefinition, RegularGameMode } from "shapez/game/modes/regular";
import { enumHubGoalRewards } from "shapez/game/tutorial_goals";
import { ModInterface } from "shapez/mods/mod_interface";
import { MOD_SIGNALS } from "shapez/mods/mod_signals";
import { newHubGoalRewards } from "../new_hub_goals";

export const rocketShape = "SbCu--Cu:--Cb--Cb:1u--Sr--:----1r--";
export const finalGameShape = "Ru1w--1w:--1w--1w:----Ru--";
export const blueprintShapes = [
    "Sb----Sb:CbCbCbCb:--CwCw--",
    "Sb----Sb:3b3b3b3b:--3w3w--",
    "SbSbSbSb:1b1b1b1b:--CwCw--",
];

export const researchShapes = ["CyCyCyCy:Cw--Cw--", "2y2y2y2y:6wWw6wWw", "__2y__2y:6wW_6wW_:6_Wr6_Wg"];

export const upgradeShapes = [
    "SuSuSuSu",
    "SrSrSrSr:SpSpSpSp",
    "3r3r3r3r:SpSpSpSp:3r3r3r3r",
    "3r______:Sp______",
    "3r______:Sp--Sp--:--3w--3w:3w______",
];

const upgradesCache = {};

/**
 * Generates all upgrades
 * @returns {Object<string, UpgradeTiers>} */
function generateUpgrades(limitedVersion = false) {
    if (upgradesCache[limitedVersion]) {
        return upgradesCache[limitedVersion];
    }

    const fixedImprovements = [0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5];
    const numEndgameUpgrades = 1000 - fixedImprovements.length - 1;

    function generateInfiniteUnlocks() {
        return new Array(numEndgameUpgrades).fill(null).map((_, i) => ({
            required: [
                { shape: upgradeShapes[4], amount: 15000 + i * 1500 },
                { shape: finalGameShape, amount: 20000 + i * 2000 },
                { shape: rocketShape, amount: 25000 + i * 2500 },
            ],
            excludePrevious: true,
        }));
    }

    // Fill in endgame upgrades
    for (let i = 0; i < numEndgameUpgrades; ++i) {
        // always 0.1
        fixedImprovements.push(0.1);
    }

    const upgrades = {
        belt: [
            {
                required: [{ shape: upgradeShapes[0], amount: 50 }],
            },
            {
                required: [{ shape: upgradeShapes[1], amount: 500 }],
            },
            {
                required: [{ shape: upgradeShapes[2], amount: 1500 }],
            },
            {
                required: [{ shape: upgradeShapes[3], amount: 5000 }],
            },
            {
                required: [{ shape: upgradeShapes[4], amount: 10000 }],
            },
            {
                required: [{ shape: upgradeShapes[4], amount: 12500 }],
                excludePrevious: true,
            },
            {
                required: [
                    { shape: upgradeShapes[4], amount: 15000 },
                    { shape: finalGameShape, amount: 20000 },
                ],
                excludePrevious: true,
            },
            ...generateInfiniteUnlocks(),
        ],
        miner: [
            {
                required: [{ shape: upgradeShapes[0], amount: 50 }],
            },
            {
                required: [{ shape: upgradeShapes[1], amount: 500 }],
            },
            {
                required: [{ shape: upgradeShapes[2], amount: 1500 }],
            },
            {
                required: [{ shape: upgradeShapes[3], amount: 5000 }],
            },
            {
                required: [{ shape: upgradeShapes[4], amount: 10000 }],
            },
            {
                required: [{ shape: upgradeShapes[4], amount: 12500 }],
                excludePrevious: true,
            },
            {
                required: [
                    { shape: upgradeShapes[4], amount: 15000 },
                    { shape: finalGameShape, amount: 20000 },
                ],
                excludePrevious: true,
            },
            ...generateInfiniteUnlocks(),
        ],
        processors: [
            {
                required: [{ shape: upgradeShapes[0], amount: 50 }],
            },
            {
                required: [{ shape: upgradeShapes[1], amount: 500 }],
            },
            {
                required: [{ shape: upgradeShapes[2], amount: 1500 }],
            },
            {
                required: [{ shape: upgradeShapes[3], amount: 5000 }],
            },
            {
                required: [{ shape: upgradeShapes[4], amount: 10000 }],
            },
            {
                required: [{ shape: upgradeShapes[4], amount: 12500 }],
                excludePrevious: true,
            },
            {
                required: [
                    { shape: upgradeShapes[4], amount: 15000 },
                    { shape: finalGameShape, amount: 20000 },
                ],
                excludePrevious: true,
            },
            ...generateInfiniteUnlocks(),
        ],
        painting: [
            {
                required: [{ shape: upgradeShapes[0], amount: 50 }],
            },
            {
                required: [{ shape: upgradeShapes[1], amount: 500 }],
            },
            {
                required: [{ shape: upgradeShapes[2], amount: 1500 }],
            },
            {
                required: [{ shape: upgradeShapes[3], amount: 5000 }],
            },
            {
                required: [{ shape: upgradeShapes[4], amount: 10000 }],
            },
            {
                required: [{ shape: upgradeShapes[4], amount: 12500 }],
                excludePrevious: true,
            },
            {
                required: [
                    { shape: upgradeShapes[4], amount: 15000 },
                    { shape: finalGameShape, amount: 20000 },
                ],
                excludePrevious: true,
            },
            ...generateInfiniteUnlocks(),
        ],
    };

    // Automatically generate tier levels
    for (const upgradeId in upgrades) {
        const upgradeTiers = upgrades[upgradeId];

        let currentTierRequirements = [];
        for (let i = 0; i < upgradeTiers.length; ++i) {
            const tierHandle = upgradeTiers[i];
            tierHandle.improvement = fixedImprovements[i];
            const originalRequired = tierHandle.required.slice();

            for (let k = currentTierRequirements.length - 1; k >= 0; --k) {
                const oldTierRequirement = currentTierRequirements[k];
                if (!tierHandle.excludePrevious) {
                    tierHandle.required.unshift({
                        shape: oldTierRequirement.shape,
                        amount: oldTierRequirement.amount,
                    });
                }
            }
            currentTierRequirements.push(
                ...originalRequired.map(req => ({
                    amount: req.amount,
                    shape: req.shape,
                }))
            );
            currentTierRequirements.forEach(tier => {
                tier.amount = findNiceIntegerValue(tier.amount * 2);
            });
        }
    }

    MOD_SIGNALS.modifyUpgrades.dispatch(upgrades);

    upgradesCache[limitedVersion] = upgrades;
    return upgrades;
}

const levelDefinitionsCache = {};

/**
 * Generates the level definitions
 * @param {boolean} limitedVersion
 */
export function generateLevelDefinitions(limitedVersion = false) {
    if (levelDefinitionsCache[limitedVersion]) {
        return levelDefinitionsCache[limitedVersion];
    }
    const levelDefinitions = [
        // 1
        // Cutter
        {
            shape: "CuCuCuCu",
            required: 10,
            reward: enumHubGoalRewards.reward_cutter_and_trash,
        },

        // 2
        // Balancer
        {
            shape: "----CuCu",
            required: 15,
            reward: enumHubGoalRewards.reward_balancer,
        },

        // 3
        // Speed Upgrades
        {
            shape: "RuRuRuRu",
            required: 20,
            reward: newHubGoalRewards.reward_upgrades,
        },

        // 4
        // Rotater
        {
            shape: "RuRu----",
            required: 30,
            reward: enumHubGoalRewards.reward_rotater,
        },

        // 5
        // Tunnel
        {
            shape: "--RuRu--",
            required: 50,
            reward: enumHubGoalRewards.reward_tunnel,
        },

        // 6
        // Painter
        {
            shape: "------Cu",
            required: 60,
            reward: enumHubGoalRewards.reward_painter,
        },

        // 7
        // Mixer
        {
            shape: "CrCrCrCr",
            required: 80,
            reward: enumHubGoalRewards.reward_mixer,
        },

        // 8
        // Stacker
        {
            shape: "RyRy----",
            required: 100,
            reward: enumHubGoalRewards.reward_stacker,
        },

        // 9
        // Research
        {
            shape: researchShapes[0],
            required: 200,
            reward: newHubGoalRewards.reward_research,
        },

        // 10
        // Bugprints
        {
            shape: blueprintShapes[0],
            required: 350,
            reward: enumHubGoalRewards.reward_blueprints,
        },

        // 11
        // Upgrades T2
        {
            shape: upgradeShapes[1],
            required: 500,
            reward: newHubGoalRewards.reward_upgrade_tier,
        },

        // 12
        // Shape Combiner
        {
            shape: "RyCgRyCg:SrCrSrCr",
            required: 600,
            reward: newHubGoalRewards.reward_shape_combiner,
        },

        // 13
        // Wires & Belt Reader
        {
            shape: "1c1c1y1y",
            required: 800,
            reward: enumHubGoalRewards.reward_wires_painter_and_levers, // does not actually unlock quad painter
        },

        // 14
        // Ratprints
        {
            shape: blueprintShapes[1],
            required: 1000, // Per second!
            reward: newHubGoalRewards.reward_ratprints,
        },

        // 15
        // Upgrades T3
        {
            shape: upgradeShapes[2],
            required: 1500,
            reward: newHubGoalRewards.reward_upgrade_tier,
        },

        // 16
        // Research Tier 2
        {
            shape: researchShapes[1],
            required: 2000,
            reward: newHubGoalRewards.reward_research_t2,
        },

        // 17
        // Smelter
        {
            shape: "3r--3r--:3w3w3w3w:5r5r5r5r",
            required: 3000,
            reward: newHubGoalRewards.reward_shape_compressor,
        },

        // 18
        // Upgrades Tier 4
        {
            shape: upgradeShapes[3],
            required: 4000,
            reward: newHubGoalRewards.reward_upgrade_tier,
        },

        // 19
        // Storage
        {
            shape: "____--Cy:1g____--:5w5w5w5w", // preparement shape
            required: 4500,
            reward: enumHubGoalRewards.reward_storage,
        },

        // 20
        // Belt Crossing
        {
            shape: finalGameShape, // SI logo, this is where it gets interesting
            required: 5000,
            reward: newHubGoalRewards.reward_belt_crossing,
        },

        // 21
        // Research Tier 3
        {
            shape: researchShapes[2],
            required: 5500,
            reward: newHubGoalRewards.reward_research_t3,
        },

        // 22
        // Hyperlink
        {
            shape: "--Sw--Sw:--Sc--Sc:Cc--Cc--:--Sw--Sw",
            required: 6000,
            reward: newHubGoalRewards.reward_hyperlink,
        },

        // 23
        // Upgrades Tier 5
        {
            shape: upgradeShapes[4],
            required: 7000,
            reward: newHubGoalRewards.reward_upgrade_tier,
        },

        // 24
        // Display
        {
            shape: "2bR_Rb2_:Cb______:4w4w4w4w",
            required: 8000,
            reward: enumHubGoalRewards.reward_display,
        },

        // 25
        // Filter
        {
            shape: "4rRg4rRg:1w1r1w1r:Sg______",
            required: 9000,
            reward: enumHubGoalRewards.reward_filter,
        },

        // 26
        // Freeplay
        {
            shape: rocketShape,
            required: 10000,
            reward: enumHubGoalRewards.reward_freeplay,
        },
    ];

    MOD_SIGNALS.modifyLevelDefinitions.dispatch(levelDefinitions);

    levelDefinitionsCache[limitedVersion] = levelDefinitions;

    return levelDefinitions;
}

const GameModeExtension = ({ $old }) => ({
    /**
     * Should return all available upgrades
     * @returns {Object<string, UpgradeTiers>}
     */
    getUpgrades() {
        return generateUpgrades(!this.root.app.restrictionMgr.getHasExtendedUpgrades());
    },

    /**
     * Returns the goals for all levels including their reward
     * @returns {Array<LevelDefinition>}
     */
    getLevelDefinitions() {
        return generateLevelDefinitions(!this.root.app.restrictionMgr.getHasExtendedLevelsAndFreeplay());
    },

    /**
     * Should return whether free play is available or if the game stops
     * after the predefined levels
     * @returns {boolean}
     */
    getIsFreeplayAvailable() {
        return true;
    },

    /** @returns {string} */
    getBlueprintShapeKey() {
        return blueprintShapes[0];
    },
});

/**
 * @param {ModInterface} modInterface
 */
export function extendGameMode(modInterface) {
    modInterface.extendClass(RegularGameMode, GameModeExtension);
}
