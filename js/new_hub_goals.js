import { ModInterface } from "shapez/mods/mod_interface";

/** @enum {string} */
export const newHubGoalRewards = {
    reward_deep_miner: "reward_deep_miner",
    reward_shape_combiner: "reward_shape_combiner",
    reward_belt_crossing: "reward_belt_crossing",
    reward_ratprints: "reward_ratprints",
    reward_shape_compressor: "reward_shape_compressor",
    reward_laser_cutter: "reward_laser_cutter",
    reward_hyperlink: "reward_hyperlink",
    reward_research: "reward_research",
    reward_research_t2: "reward_research_t2",
    reward_research_t3: "reward_research_t3",
    reward_smart_tunnel: "reward_smart_tunnel",
    reward_upgrades: "reward_upgrades",
    reward_upgrade_tier: "reward_upgrade_tier",
    reward_quad_painter: "reward_quad_painter",
    reward_quad_stacker: "reward_quad_stacker",
    reward_mini_storage: "reward_mini_storage",
    reward_corner_crossing: "reward_corner_crossing",
    reward_line_crossing: "reward_line_crossing",
};

const newRewardTranslations = {
    [newHubGoalRewards.reward_deep_miner]: {
        title: "Deep Miner",
        desc: `
            You unlocked the <strong>Deep Miner</strong>! <br><br>
            Yes, you can't chain it, BUT it outputs much more than a normal miner, making it possible to get more than before out of a deposit.`,
    },
    [newHubGoalRewards.reward_shape_combiner]: {
        title: "Shape Combiner",
        desc: `
            Congratulations, you've unlocked the <strong>shape combiner</strong>!
            With the shape combiner, you can combine two base game shapes to create new merged shapes!<br><br>
            While this might not seem like much, it will change <strong>everything</strong>!`,
    },
    [newHubGoalRewards.reward_belt_crossing]: {
        title: "Belt Crossing",
        desc: `
            You unlocked the <strong>Belt Crossing</strong>! <br><br>
            The belt crossing passes two belts over each other <strong>with no interaction between them</strong>! <br><br>
            Incredibly useful, the belt crossing can help you compact your factories down to a fraction of their previous size!`,
    },
    [newHubGoalRewards.reward_ratprints]: {
        title: "Ratprints",
        desc: "You've just unlocked <strong>ratprints</strong>, which are more powerful bugprints. These powerful creatures can copy any building that the bugprint can't!<br><br>Use them wisely... for as long as they allow it.",
    },
    [newHubGoalRewards.reward_shape_compressor]: {
        title: "Smelter",
        desc: "The <strong>smelter</strong> takes shapes and melts them! When they get hot enough, each individual layer is merged together into one mega-shape. The possibilities are now endless!<br><br>And we're only just getting started...",
    },
    [newHubGoalRewards.reward_laser_cutter]: {
        title: "Laser Cutter",
        desc: `
            You unlocked the <strong>Laser Cutter</strong>! <br><br>
            It accepts wire inputs for each corner and cuts off the indicated corners. With this, you can make even more complex floating shapes. (yay)`,
    },
    [newHubGoalRewards.reward_hyperlink]: {
        title: "Hyperlink",
        desc: `
            You've unlocked the <strong>Hyperlink</strong>! <br><br>
            The hyperlink transport up to 3 belts of items at near-instant speed from an entrance to an exit! <br><br>
            You can also input a hyperlink directly into a hub! Think of all the possibilities!`,
    },
    [newHubGoalRewards.reward_research]: {
        title: "Research",
        desc: "Congratulations! You have unlocked the first new main mechanic in Shapez Industries, <strong>Research</strong>!<br>With research, you no longer unlock variants from the hub! Instead, you can unlock them in the <strong>research tab</strong>, a new tab in the top right of your screen!<br><br>Each <strong>tier</strong> of research has a unique shape that is required to research it, starting with the shape you just delivered!<br><br>Make sure to remember to research variants, as they are very useful!",
    },
    [newHubGoalRewards.reward_research_t2]: {
        title: "Research Tier 2",
        desc: "With the power of <strong>SCIENCE</strong>, you can now research tier 2 variants. This means even cooler variants for you to play around with!<br><br>Look closely... There might just be some brand new variants in there ;)",
    },
    [newHubGoalRewards.reward_research_t3]: {
        title: "Research Tier 3",
        desc: "<strong>Research Tier 3</strong> is now available!<br><br>You know what this means, you know what it does, the only thing you don't know is why there are so many weird belt crossing variants.<br><br>If you figure it out, make sure to let me know ;)",
    },
    [newHubGoalRewards.reward_smart_tunnel]: {
        title: "Smart Tunnel",
        desc: `
            You unlocked the <strong>Smart Tunnel</strong>! <br><br>
            The smart tunnel does not connect to the other variants, and can also have inputs and outputs from the sides for EXTREME compactness.`,
    },
    [newHubGoalRewards.reward_upgrades]: {
        title: "Speed Upgrades",
        desc: "You can now research <strong>Speed Upgrades</strong>! Each upgrade type speeds up a different kind of building.<br><br> Press the new icon in the top right to access the shop!<br><br>Courtesy of shapez industries, all four kinds of upgrades now require the same shape!",
    },
    [newHubGoalRewards.reward_upgrade_tier]: {
        title: "Upgrades Tier <x>",
        desc: "Upgrades go brrr!<br><br>You can now unlock the next tier of upgrades... And that's about it! What did you expect?",
    },
    [newHubGoalRewards.reward_quad_painter]: {
        title: "Quad Painter",
        desc: "You've unlocked the <strong>Quad Painter</strong>! This is <strong>NOT THE SAME</strong> as the quad painter of the base game. Instead, this painter accepts up to four colour inputs, and only paints the <strong>layers</strong> corresponding to the active wire inputs. Make sure to attach wires though, otherwise it won't function!",
    },
    [newHubGoalRewards.reward_quad_stacker]: {
        title: "Quad Stacker",
        desc: `
            You unlocked the <strong>Quad Stacker</strong>! <br><br>
            It accepts up to four inputs, but it does not need all four to function.<br><br>
            So long as you have the primary left input, it will stack all the other inputs on top.`,
    },
    [newHubGoalRewards.reward_mini_storage]: {
        title: "Mini Storage",
        desc: "You've just unlocked the <strong>mini storage</strong>! The mini storage stores a smaller amount of shapes than the full size one, but is VERY useful as an overflow gate.<br><br>Think automatic machines...",
    },
    [newHubGoalRewards.reward_corner_crossing]: {
        title: "Corner Crossing",
        desc: "You've unlocked the <strong>corner crossing</strong>! A variant of the belt crossing, this can be used to do even more weird and wacky things :)",
    },
    [newHubGoalRewards.reward_line_crossing]: {
        title: "Line Crossing",
        desc: "Think balancer but belt crossing, and you'll have the <strong>line crossing</strong>!",
    },

    // existing ones
    reward_freeplay: {
        title: "Freeplay",
        desc: `Congratulations! You've unlocked <strong>free-play mode</strong>! This means
            that shapes are now <strong>randomly</strong> generated!<br><br>
            Since the hub will require a <strong>throughput</strong> from now
            on, the next step is to build an automated machine for delivering shapes. 
            The hub outputs a signal of the level shape for you to use!<br><br>
            Since this is <strong>SHAPEZ INDUSTRIES</strong>, if you decide to make a MAM I would love to see it on the discord, as it will be so different!<br><br>
            <strong>Thank you for playing, and I hope you enjoyed my mod!</strong><br>
            ~ Sense101
            `,
    },
    reward_blueprints: {
        title: "Bugprints",
        desc: `With the power of bugprints, you can now copy and paste <strong>TRANSPORT buildings</strong>! Select
            an area (Hold CTRL, then drag with your mouse), and press 'C' to
            copy it.<br><br>Pasting it is <strong>not free</strong>, you need to
            produce <strong>bugprints</strong> to afford it!.<br><br>
            Do not underestimate their power.`,
    },
    reward_wires_painter_and_levers: {
        title: "Wires Layer",
        desc: `You just unlocked the <strong>Wires Layer</strong>: It is a separate
            layer on top of the regular layer that you can access by pressing <strong>E</strong>.<br><br>
            As I'm such a nice guy, you've just unlocked every single building on the wires layer. You've also unlocked the belt reader!<br><br>
            Not that you can do much with them.`,
    },

    // resarch of old variants
    reward_rotater_ccw: {
        title: "CCW Rotater",
        desc: "You have unlocked a variant of the <strong>rotator</strong> - It allows you to rotate shapes counter-clockwise!",
    },
    reward_miner_chainable: {
        title: "Extractor (Chain)",
        desc: "You have unlocked the <strong>chained extractor</strong>! It can <strong>forward its resources</strong> to other extractors so you can more efficiently extract resources!<br><br> PS: The old extractor has been replaced in your toolbar now!",
    },
    reward_underground_belt_tier_2: {
        title: "Tunnel Tier II",
        desc: "You have unlocked a new variant of the <strong>tunnel</strong> - It has a <strong>bigger range</strong>, and you can also mix-n-match those tunnels now!",
    },
    reward_merger: {
        title: "Smart Merger",
        desc: "You have unlocked a <strong>merger</strong> variant of the <strong>balancer</strong> - It accepts up to three inputs and merges them into one belt!",
    },
    reward_splitter: {
        title: "Smart Splitter",
        desc: "You have unlocked a <strong>splitter</strong> variant of the <strong>balancer</strong> - It accepts one input and splits them into up to three belts!",
    },
    reward_cutter_quad: {
        title: "Quad Cutter",
        desc: "You have unlocked a variant of the <strong>cutter</strong> - It allows you to cut shapes in <strong>four parts</strong> instead of just two!",
    },
    reward_painter_double: {
        title: "Double Painter",
        desc: "You have unlocked a variant of the <strong>painter</strong> - It works similar to the regular painter but processes <strong>two shapes at once</strong>, consuming just one color instead of two!",
    },
    reward_rotater_180: {
        title: "180° Rotator",
        desc: "You just unlocked the 180 degrees <strong>rotator</strong>! - It allows you to rotate a shape by 180 degrees (Surprise! :D)",
    },
};

/**
 *
 * @param {ModInterface} modInterface
 */
export function registerNewGoalTranslations(modInterface) {
    for (const key in newRewardTranslations) {
        const { title, desc } = newRewardTranslations[key];

        modInterface.registerTranslations("en", {
            storyRewards: {
                [key]: {
                    title,
                    desc,
                },
            },
        });
    }
}
