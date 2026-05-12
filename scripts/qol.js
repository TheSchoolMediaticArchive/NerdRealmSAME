import {
    world,
    system,
    WeatherType,
    ItemStack
} from "@minecraft/server";
const MAILBOX_COOLDOWNS = new Map();
const INITIALIZED_ALTARS = new Set();
const INITIALIZED_UNDOERS = new Set();
const UNDOER_COOLDOWNS = new Map();
const ADMIN_USERS = ["TaxCollector381"];
const UNCRAFT_RECIPES = {
    "minecraft:iron_block":        [{ result: "minecraft:iron_ingot",    count: 9 }],
    "minecraft:gold_block":        [{ result: "minecraft:gold_ingot",    count: 9 }],
    "minecraft:diamond_block":     [{ result: "minecraft:diamond",       count: 9 }],
    "minecraft:emerald_block":     [{ result: "minecraft:emerald",       count: 9 }],
    "minecraft:coal_block":        [{ result: "minecraft:coal",          count: 9 }],
    "minecraft:copper_block":      [{ result: "minecraft:copper_ingot",  count: 9 }],
    "minecraft:lapis_block":       [{ result: "minecraft:lapis_lazuli",  count: 9 }],
    "minecraft:redstone_block":    [{ result: "minecraft:redstone",      count: 9 }],
    "minecraft:netherite_block":   [{ result: "minecraft:netherite_ingot", count: 9 }],
    "minecraft:raw_iron_block":    [{ result: "minecraft:raw_iron",      count: 9 }],
    "minecraft:raw_gold_block":    [{ result: "minecraft:raw_gold",      count: 9 }],
    "minecraft:raw_copper_block":  [{ result: "minecraft:raw_copper",    count: 9 }],
    "minecraft:amethyst_block":    [{ result: "minecraft:amethyst_shard", count: 4 }],
    "minecraft:quartz_block":      [{ result: "minecraft:quartz",        count: 4 }],
    "minecraft:bone_block":        [{ result: "minecraft:bone_meal",     count: 9 }],
    "minecraft:hay_block":         [{ result: "minecraft:wheat",         count: 9 }],
    "minecraft:melon":             [{ result: "minecraft:melon_slice",   count: 9 }],
    "minecraft:nether_wart_block": [{ result: "minecraft:nether_wart",   count: 9 }],
    "minecraft:dried_kelp_block":  [{ result: "minecraft:dried_kelp",    count: 9 }],
    "minecraft:honeycomb_block":   [{ result: "minecraft:honeycomb",     count: 4 }],
    "minecraft:packed_ice":        [{ result: "minecraft:ice",           count: 9 }],
    "minecraft:blue_ice":          [{ result: "minecraft:packed_ice",    count: 9 }],
    "minecraft:snow_block":        [{ result: "minecraft:snowball",      count: 4 }],
    "minecraft:clay":              [{ result: "minecraft:clay_ball",     count: 4 }],
    "minecraft:glowstone":         [{ result: "minecraft:glowstone_dust",count: 4 }],
    "minecraft:slime":             [{ result: "minecraft:slime_ball",    count: 9 }],
    "minecraft:sea_lantern":       [
        { result: "minecraft:prismarine_shard",  count: 4 },
        { result: "minecraft:prismarine_crystals", count: 5 }
    ],
    "minecraft:prismarine":        [{ result: "minecraft:prismarine_shard", count: 4 }],
    "minecraft:prismarine_bricks": [{ result: "minecraft:prismarine_shard", count: 9 }],
    "minecraft:dark_prismarine":   [
        { result: "minecraft:prismarine_shard", count: 8 },
        { result: "minecraft:black_dye", count: 1 }
    ],
    "minecraft:magma":             [{ result: "minecraft:magma_cream",   count: 4 }],
    "minecraft:nether_brick":      [{ result: "minecraft:netherbrick",   count: 4 }],
    "minecraft:red_nether_bricks": [
        { result: "minecraft:netherbrick", count: 2 },
        { result: "minecraft:nether_wart", count: 2 }
    ],
    "minecraft:sandstone":         [{ result: "minecraft:sand",          count: 4 }],
    "minecraft:chiseled_sandstone":[{ result: "minecraft:sandstone_slab",count: 2 }],
    "minecraft:cut_sandstone":     [{ result: "minecraft:sandstone",     count: 4 }],
    "minecraft:smooth_sandstone":  [{ result: "minecraft:sandstone",     count: 1 }],
    "minecraft:red_sandstone":     [{ result: "minecraft:red_sand",      count: 4 }],
    "minecraft:chiseled_red_sandstone":[{ result: "minecraft:red_sandstone_slab",count: 2 }],
    "minecraft:cut_red_sandstone": [{ result: "minecraft:red_sandstone", count: 4 }],
    "minecraft:smooth_red_sandstone":[{ result: "minecraft:red_sandstone",count: 1 }],
    "minecraft:oak_planks":        [{ result: "minecraft:oak_log",       count: 1 }],
    "minecraft:spruce_planks":     [{ result: "minecraft:spruce_log",    count: 1 }],
    "minecraft:birch_planks":      [{ result: "minecraft:birch_log",     count: 1 }],
    "minecraft:jungle_planks":     [{ result: "minecraft:jungle_log",    count: 1 }],
    "minecraft:acacia_planks":     [{ result: "minecraft:acacia_log",    count: 1 }],
    "minecraft:dark_oak_planks":   [{ result: "minecraft:dark_oak_log",  count: 1 }],
    "minecraft:mangrove_planks":   [{ result: "minecraft:mangrove_log",  count: 1 }],
    "minecraft:cherry_planks":     [{ result: "minecraft:cherry_log",    count: 1 }],
    "minecraft:bamboo_planks":     [{ result: "minecraft:bamboo_block",  count: 1 }],
    "minecraft:crimson_planks":    [{ result: "minecraft:crimson_stem",  count: 1 }],
    "minecraft:warped_planks":     [{ result: "minecraft:warped_stem",   count: 1 }],
    "minecraft:stick":             [{ result: "minecraft:planks",        count: 1 }],
    "minecraft:bowl":              [{ result: "minecraft:planks",        count: 3 }],
    "minecraft:chest":             [{ result: "minecraft:planks",        count: 8 }],
    "minecraft:crafting_table":    [{ result: "minecraft:planks",        count: 4 }],
    "minecraft:barrel":            [{ result: "minecraft:planks",        count: 6 }, { result: "minecraft:wooden_slab", count: 2 }],
    "minecraft:bread":             [{ result: "minecraft:wheat",         count: 3 }],
    "minecraft:cake":              [
        { result: "minecraft:wheat", count: 3 },
        { result: "minecraft:sugar", count: 2 },
        { result: "minecraft:egg", count: 1 },
        { result: "minecraft:bucket", count: 3 }
    ],
    "minecraft:cookie":            [{ result: "minecraft:wheat", count: 2 }, { result: "minecraft:cocoa_beans", count: 1 }],
    "minecraft:pumpkin_pie":       [{ result: "minecraft:pumpkin", count: 1 }, { result: "minecraft:sugar", count: 1 }, { result: "minecraft:egg", count: 1 }],
    "minecraft:white_wool":        [{ result: "minecraft:string",        count: 4 }],
    "minecraft:orange_wool":       [{ result: "minecraft:string",        count: 4 }],
    "minecraft:magenta_wool":      [{ result: "minecraft:string",        count: 4 }],
    "minecraft:light_blue_wool":   [{ result: "minecraft:string",        count: 4 }],
    "minecraft:yellow_wool":       [{ result: "minecraft:string",        count: 4 }],
    "minecraft:lime_wool":         [{ result: "minecraft:string",        count: 4 }],
    "minecraft:pink_wool":         [{ result: "minecraft:string",        count: 4 }],
    "minecraft:gray_wool":         [{ result: "minecraft:string",        count: 4 }],
    "minecraft:light_gray_wool":   [{ result: "minecraft:string",        count: 4 }],
    "minecraft:cyan_wool":         [{ result: "minecraft:string",        count: 4 }],
    "minecraft:purple_wool":       [{ result: "minecraft:string",        count: 4 }],
    "minecraft:blue_wool":         [{ result: "minecraft:string",        count: 4 }],
    "minecraft:brown_wool":        [{ result: "minecraft:string",        count: 4 }],
    "minecraft:green_wool":        [{ result: "minecraft:string",        count: 4 }],
    "minecraft:red_wool":          [{ result: "minecraft:string",        count: 4 }],
    "minecraft:black_wool":        [{ result: "minecraft:string",        count: 4 }],
    "minecraft:iron_pickaxe":      [{ result: "minecraft:iron_ingot", count: 3 }, { result: "minecraft:stick", count: 2 }],
    "minecraft:iron_axe":          [{ result: "minecraft:iron_ingot", count: 3 }, { result: "minecraft:stick", count: 2 }],
    "minecraft:iron_shovel":       [{ result: "minecraft:iron_ingot", count: 1 }, { result: "minecraft:stick", count: 2 }],
    "minecraft:iron_hoe":          [{ result: "minecraft:iron_ingot", count: 2 }, { result: "minecraft:stick", count: 2 }],
    "minecraft:iron_sword":        [{ result: "minecraft:iron_ingot", count: 2 }, { result: "minecraft:stick", count: 1 }],
    "minecraft:iron_helmet":       [{ result: "minecraft:iron_ingot", count: 5 }],
    "minecraft:iron_chestplate":   [{ result: "minecraft:iron_ingot", count: 8 }],
    "minecraft:iron_leggings":     [{ result: "minecraft:iron_ingot", count: 7 }],
    "minecraft:iron_boots":        [{ result: "minecraft:iron_ingot", count: 4 }],
    "minecraft:golden_pickaxe":    [{ result: "minecraft:gold_ingot", count: 3 }, { result: "minecraft:stick", count: 2 }],
    "minecraft:golden_axe":        [{ result: "minecraft:gold_ingot", count: 3 }, { result: "minecraft:stick", count: 2 }],
    "minecraft:golden_shovel":     [{ result: "minecraft:gold_ingot", count: 1 }, { result: "minecraft:stick", count: 2 }],
    "minecraft:golden_hoe":        [{ result: "minecraft:gold_ingot", count: 2 }, { result: "minecraft:stick", count: 2 }],
    "minecraft:golden_sword":      [{ result: "minecraft:gold_ingot", count: 2 }, { result: "minecraft:stick", count: 1 }],
    "minecraft:golden_helmet":     [{ result: "minecraft:gold_ingot", count: 5 }],
    "minecraft:golden_chestplate": [{ result: "minecraft:gold_ingot", count: 8 }],
    "minecraft:golden_leggings":   [{ result: "minecraft:gold_ingot", count: 7 }],
    "minecraft:golden_boots":      [{ result: "minecraft:gold_ingot", count: 4 }],
    "minecraft:diamond_pickaxe":   [{ result: "minecraft:diamond", count: 3 }, { result: "minecraft:stick", count: 2 }],
    "minecraft:diamond_axe":       [{ result: "minecraft:diamond", count: 3 }, { result: "minecraft:stick", count: 2 }],
    "minecraft:diamond_shovel":    [{ result: "minecraft:diamond", count: 1 }, { result: "minecraft:stick", count: 2 }],
    "minecraft:diamond_hoe":       [{ result: "minecraft:diamond", count: 2 }, { result: "minecraft:stick", count: 2 }],
    "minecraft:diamond_sword":     [{ result: "minecraft:diamond", count: 2 }, { result: "minecraft:stick", count: 1 }],
    "minecraft:diamond_helmet":    [{ result: "minecraft:diamond", count: 5 }],
    "minecraft:diamond_chestplate":[{ result: "minecraft:diamond", count: 8 }],
    "minecraft:diamond_leggings":  [{ result: "minecraft:diamond", count: 7 }],
    "minecraft:diamond_boots":     [{ result: "minecraft:diamond", count: 4 }],
    "minecraft:netherite_pickaxe": [{ result: "minecraft:diamond_pickaxe", count: 1 }, { result: "minecraft:netherite_ingot", count: 1 }],
    "minecraft:netherite_axe":     [{ result: "minecraft:diamond_axe", count: 1 }, { result: "minecraft:netherite_ingot", count: 1 }],
    "minecraft:netherite_shovel":  [{ result: "minecraft:diamond_shovel", count: 1 }, { result: "minecraft:netherite_ingot", count: 1 }],
    "minecraft:netherite_hoe":     [{ result: "minecraft:diamond_hoe", count: 1 }, { result: "minecraft:netherite_ingot", count: 1 }],
    "minecraft:netherite_sword":   [{ result: "minecraft:diamond_sword", count: 1 }, { result: "minecraft:netherite_ingot", count: 1 }],
    "minecraft:netherite_helmet":  [{ result: "minecraft:diamond_helmet", count: 1 }, { result: "minecraft:netherite_ingot", count: 1 }],
    "minecraft:netherite_chestplate":[{ result: "minecraft:diamond_chestplate", count: 1 }, { result: "minecraft:netherite_ingot", count: 1 }],
    "minecraft:netherite_leggings":[{ result: "minecraft:diamond_leggings", count: 1 }, { result: "minecraft:netherite_ingot", count: 1 }],
    "minecraft:netherite_boots":   [{ result: "minecraft:diamond_boots", count: 1 }, { result: "minecraft:netherite_ingot", count: 1 }],
    "minecraft:rail":              [{ result: "minecraft:iron_ingot", count: 6 }, { result: "minecraft:stick", count: 1 }],
    "minecraft:powered_rail":      [{ result: "minecraft:gold_ingot", count: 6 }, { result: "minecraft:stick", count: 1 }, { result: "minecraft:redstone", count: 1 }],
    "minecraft:detector_rail":     [{ result: "minecraft:iron_ingot", count: 6 }, { result: "minecraft:stone_pressure_plate", count: 1 }, { result: "minecraft:redstone", count: 1 }],
    "minecraft:activator_rail":    [{ result: "minecraft:iron_ingot", count: 6 }, { result: "minecraft:stick", count: 2 }, { result: "minecraft:redstone_torch", count: 1 }],
    "minecraft:minecart":          [{ result: "minecraft:iron_ingot", count: 5 }],
    "minecraft:hopper_minecart":   [{ result: "minecraft:hopper", count: 1 }, { result: "minecraft:minecart", count: 1 }],
    "minecraft:chest_minecart":    [{ result: "minecraft:chest", count: 1 }, { result: "minecraft:minecart", count: 1 }],
    "minecraft:tnt_minecart":      [{ result: "minecraft:tnt", count: 1 }, { result: "minecraft:minecart", count: 1 }],
    "minecraft:furnace_minecart":  [{ result: "minecraft:furnace", count: 1 }, { result: "minecraft:minecart", count: 1 }],
    "minecraft:redstone_torch":    [{ result: "minecraft:redstone", count: 1 }, { result: "minecraft:stick", count: 1 }],
    "minecraft:redstone_lamp":     [{ result: "minecraft:redstone", count: 4 }, { result: "minecraft:glowstone", count: 1 }],
    "minecraft:repeater":          [{ result: "minecraft:redstone", count: 1 }, { result: "minecraft:redstone_torch", count: 2 }, { result: "minecraft:stone", count: 3 }],
    "minecraft:comparator":        [{ result: "minecraft:redstone_torch", count: 3 }, { result: "minecraft:quartz", count: 1 }, { result: "minecraft:stone", count: 3 }],
    "minecraft:piston":            [{ result: "minecraft:planks", count: 3 }, { result: "minecraft:cobblestone", count: 4 }, { result: "minecraft:iron_ingot", count: 1 }, { result: "minecraft:redstone", count: 1 }],
    "minecraft:sticky_piston":     [{ result: "minecraft:piston", count: 1 }, { result: "minecraft:slime_ball", count: 1 }],
    "minecraft:hopper":            [{ result: "minecraft:iron_ingot", count: 5 }, { result: "minecraft:chest", count: 1 }],
    "minecraft:dropper":           [{ result: "minecraft:cobblestone", count: 7 }, { result: "minecraft:redstone", count: 1 }],
    "minecraft:dispenser":         [{ result: "minecraft:cobblestone", count: 7 }, { result: "minecraft:bow", count: 1 }, { result: "minecraft:redstone", count: 1 }],
    "minecraft:observer":          [{ result: "minecraft:cobblestone", count: 6 }, { result: "minecraft:redstone", count: 2 }, { result: "minecraft:quartz", count: 1 }],
    "minecraft:iron_door":         [{ result: "minecraft:iron_ingot", count: 6 }],
    "minecraft:iron_trapdoor":     [{ result: "minecraft:iron_ingot", count: 4 }],
    "minecraft:iron_bars":         [{ result: "minecraft:iron_ingot", count: 6 }],
    "minecraft:chain":             [{ result: "minecraft:iron_ingot", count: 1 }, { result: "minecraft:iron_nugget", count: 2 }],
    "minecraft:bucket":            [{ result: "minecraft:iron_ingot", count: 3 }],
    "minecraft:shears":            [{ result: "minecraft:iron_ingot", count: 2 }],
    "minecraft:flint_and_steel":   [{ result: "minecraft:iron_ingot", count: 1 }, { result: "minecraft:flint", count: 1 }],
    "minecraft:compass":           [{ result: "minecraft:iron_ingot", count: 4 }, { result: "minecraft:redstone", count: 1 }],
    "minecraft:clock":             [{ result: "minecraft:gold_ingot", count: 4 }, { result: "minecraft:redstone", count: 1 }],
    "minecraft:spyglass":          [{ result: "minecraft:amethyst_shard", count: 2 }, { result: "minecraft:copper_ingot", count: 1 }],
    "minecraft:shield":            [{ result: "minecraft:planks", count: 6 }, { result: "minecraft:iron_ingot", count: 1 }],
    "minecraft:anvil":             [{ result: "minecraft:iron_block", count: 3 }, { result: "minecraft:iron_ingot", count: 4 }],
    "minecraft:cauldron":          [{ result: "minecraft:iron_ingot", count: 7 }],
    "minecraft:tripwire_hook":     [{ result: "minecraft:iron_ingot", count: 1 }, { result: "minecraft:stick", count: 1 }, { result: "minecraft:planks", count: 1 }],
    "minecraft:furnace":           [{ result: "minecraft:cobblestone", count: 8 }],
    "minecraft:blast_furnace":     [{ result: "minecraft:iron_ingot", count: 5 }, { result: "minecraft:furnace", count: 1 }, { result: "minecraft:smooth_stone", count: 3 }],
    "minecraft:smoker":            [{ result: "minecraft:log", count: 4 }, { result: "minecraft:furnace", count: 1 }],
    "minecraft:stonecutter":       [{ result: "minecraft:iron_ingot", count: 1 }, { result: "minecraft:stone", count: 3 }],
    "minecraft:brewing_stand":     [{ result: "minecraft:blaze_rod", count: 1 }, { result: "minecraft:cobblestone", count: 3 }],
    "minecraft:enchanting_table":  [{ result: "minecraft:book", count: 1 }, { result: "minecraft:diamond", count: 2 }, { result: "minecraft:obsidian", count: 4 }],
    "minecraft:ender_chest":       [{ result: "minecraft:obsidian", count: 8 }, { result: "minecraft:ender_eye", count: 1 }],
    "minecraft:beacon":            [{ result: "minecraft:glass", count: 5 }, { result: "minecraft:nether_star", count: 1 }, { result: "minecraft:obsidian", count: 3 }],
    "minecraft:jukebox":           [{ result: "minecraft:planks", count: 8 }, { result: "minecraft:diamond", count: 1 }],
    "minecraft:note_block":        [{ result: "minecraft:planks", count: 8 }, { result: "minecraft:redstone", count: 1 }],
    "minecraft:copper_golem_statue": [{ result: "minecraft:nether_star",count: 1}]
};
const OFFERINGS = [
    {
        title: "DIAMONDS",
        block: "minecraft:water",
        effect: "village_hero",
        amp: 255,
        dur: 2600,
        msg: "§bThe water spirits accept your offering..."
    },
    {
        title: "CARROTS",
        block: "minecraft:water",
        effect: "night_vision",
        amp: 1,
        dur: 2400,
        msg: "§eYour eyes adjust to the deep..."
    },
    {
        title: "LIGHTNING",
        block: "minecraft:air",
        effect: null,
        msg: "§6The sky cracks open!",
        action: (loc, dim, player) => {
            dim.spawnEntity("minecraft:lightning_bolt", loc);
            dim.setWeather(WeatherType.Thunder, 6000);
        }
    }
];
const RING = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1]
];
function getBlock(dimension, base, dx, dy, dz) {
    try {
        return dimension.getBlock({
            x: base.x + dx,
            y: base.y + dy,
            z: base.z + dz
        });
    } catch {
        return null;
    }
}
function spawnParticleBurst(dimension, centre, count = 12, spread = 0.6, spreadY = 0.8) {
    const types = [
        "minecraft:electric_spark_particle",
        "minecraft:mob_spell_ambient",
        "minecraft:totem_particle"
    ];
    for (let i = 0; i < count; i++) {
        const rx = (Math.random() - 0.5) * 2 * spread;
        const ry = Math.random() * spreadY;
        const rz = (Math.random() - 0.5) * 2 * spread;
        try {
            dimension.spawnParticle(types[i % types.length], {
                x: centre.x + rx,
                y: centre.y + ry,
                z: centre.z + rz
            });
        } catch {}
    }
}
function getOxidationLevel(block) {
    if (!block || block.typeId !== "minecraft:lightning_rod") return -1;
    try {
        const age = block.permutation.getState("age") ?? 
                    block.permutation.getState("oxidation_state") ?? 
                    block.permutation.getState("oxidized_amount");
        if (age === null || age === undefined) return 0;
        return Math.min(3, Math.max(0, parseInt(age) || 0));
    } catch (e) {
        return 0;  
    }
}
function isWaxed(block) {
    if (!block) return false;
    try {
        const waxedState = block.permutation.getState("waxed");
        return waxedState === true || waxedState === 1 || waxedState === "true";
    } catch (e) {
        return false;
    }
}
function getOxidationStatus(oxidationLevel, isWaxedBlock) {
    if (isWaxedBlock) {
        return { 
            status: "§6Waxed - Protected", 
            multiplier: 1.0, 
            hint: "§e✓ Waxed rods are protected from oxidation" 
        };
    }
    switch (oxidationLevel) {
        case 0:
            return { 
                status: "§aUnoxidized", 
                multiplier: 1.0, 
                hint: "§a✓ Perfect condition" 
            };
        case 1:
            return { 
                status: "§eExposed", 
                multiplier: 0.85, 
                hint: "§e⚠ Slight oxidation - consider waxing" 
            };
        case 2:
            return { 
                status: "§6Weathered", 
                multiplier: 0.65, 
                hint: "§6⚠ Significant oxidation - wax with honeycomb blocks" 
            };
        case 3:
            return { 
                status: "§4Fully Oxidized", 
                multiplier: 0.35, 
                hint: "§4✗ Critical oxidation - performance severely degraded" 
            };
        default:
            return { 
                status: "§7Unknown", 
                multiplier: 0.5, 
                hint: "§7Unknown state" 
            };
    }
}
function validateAltar(dropperBlock, dimension) {
    const loc = dropperBlock.location;
    if (dropperBlock.permutation.getState("facing_direction") !== 1) {
        return "§cThe dropper must face upward.";
    }
    const pedestal = getBlock(dimension, loc, 0, -1, 0);
    if (!pedestal || pedestal.typeId !== "minecraft:cobblestone") {
        return "§cPlace §lcobblestone§r§c directly beneath the dropper.";
    }
    for (const [dx, dz] of RING) {
        const stair = getBlock(dimension, loc, dx, -1, dz);
        if (!stair || !stair.typeId.includes("stone_brick_stair")) {
            return `§cPlace §lstone brick stairs§r§c around the cobblestone base.`;
        }
    }
    const lowerRod = getBlock(dimension, loc, 0, 1, 0);
    if (!lowerRod || lowerRod.typeId !== "minecraft:lightning_rod") {
        return "§cPlace a §llightning rod§r§c on top of the dropper.";
    }
    const lowerOxid = getOxidationLevel(lowerRod);
    const lowerWaxed = isWaxed(lowerRod);
    if (lowerOxid === 3 && !lowerWaxed) {
        return "§4✗ Lower lightning rod is fully oxidized! Wax it with honeycomb blocks.";
    }
    const lowerIron = getBlock(dimension, loc, 0, 2, 0);
    if (!lowerIron || lowerIron.typeId !== "minecraft:iron_block") {
        return "§cPlace an §liron block§r§c on top of the lightning rod.";
    }
    for (const [dx, dz] of RING) {
        const cobble = getBlock(dimension, loc, dx, 2, dz);
        if (!cobble || cobble.typeId !== "minecraft:cobblestone") {
            return `§cSurround the iron block (Y+2) with §lcobblestone§r§c.`;
        }
    }
    for (const [dx, dz] of RING) {
        const stair = getBlock(dimension, loc, dx, 3, dz);
        if (!stair || !stair.typeId.includes("stone_brick_stair")) {
            return `§cPlace a ring of §lstone brick stairs§r§c at Y+3.`;
        }
    }
    const upperIron = getBlock(dimension, loc, 0, 4, 0);
    if (!upperIron || upperIron.typeId !== "minecraft:iron_block") {
        return "§cPlace an §liron block§r§c above the upper stair ring (Y+4).";
    }
    const upperRod = getBlock(dimension, loc, 0, 5, 0);
    if (!upperRod || upperRod.typeId !== "minecraft:lightning_rod") {
        return "§cPlace a §llightning rod§r§c at the very top (Y+5).";
    }
    const upperOxid = getOxidationLevel(upperRod);
    const upperWaxed = isWaxed(upperRod);
    if (upperOxid === 3 && !upperWaxed) {
        return "§4✗ Upper lightning rod is fully oxidized! Wax it with honeycomb blocks.";
    }
    return null; 
}
function validateUndoer(anchorBlock, dimension) {
    const loc = anchorBlock.location;
    const pedestal = getBlock(dimension, loc, 0, -1, 0);
    if (!pedestal || pedestal.typeId !== "minecraft:cobblestone") {
        return "§cPlace §lcobblestone§r§c beneath the iron block.";
    }
    for (const [dx, dz] of RING) {
        const stair = getBlock(dimension, loc, dx, -1, dz);
        if (!stair || !stair.typeId.includes("stone_brick_stair")) {
            return "§cPlace §lstone brick stairs§r§c around the cobblestone base.";
        }
    }
    const airSlot = getBlock(dimension, loc, 0, 1, 0);
    if (!airSlot || airSlot.typeId !== "minecraft:air") {
        return "§cThe space above the iron block must be §lair§r§c (the uncraft slot).";
    }
    const lowerRod = getBlock(dimension, loc, 0, 2, 0);
    if (!lowerRod || lowerRod.typeId !== "minecraft:lightning_rod") {
        return "§cPlace a §llightning rod§r§c above the air slot.";
    }
    const lowerOxid = getOxidationLevel(lowerRod);
    const lowerWaxed = isWaxed(lowerRod);
    if (lowerOxid === 3 && !lowerWaxed) {
        return "§4✗ Lower lightning rod is fully oxidized! Wax it with honeycomb blocks.";
    }
    const midIron = getBlock(dimension, loc, 0, 3, 0);
    if (!midIron || midIron.typeId !== "minecraft:iron_block") {
        return "§cPlace an §liron block§r§c above the lightning rod.";
    }
    for (const [dx, dz] of RING) {
        const stair = getBlock(dimension, loc, dx, 3, dz);
        if (!stair || !stair.typeId.includes("stone_brick_stair")) {
            return "§cSurround the iron block (Y+3) with §lstone brick stairs§r§c.";
        }
    }
    for (const [dx, dz] of RING) {
        const stair = getBlock(dimension, loc, dx, 4, dz);
        if (!stair || !stair.typeId.includes("stone_brick_stair")) {
            return "§cPlace an inverted ring of §lstone brick stairs§r§c at Y+4.";
        }
    }
    const redstone = getBlock(dimension, loc, 0, 5, 0);
    if (!redstone || redstone.typeId !== "minecraft:redstone_block") {
        return "§cPlace a §lredstone block§r§c at Y+5.";
    }
    const upperRod = getBlock(dimension, loc, 0, 6, 0);
    if (!upperRod || upperRod.typeId !== "minecraft:lightning_rod") {
        return "§cPlace a §llightning rod§r§c at the very top (Y+6).";
    }
    const upperOxid = getOxidationLevel(upperRod);
    const upperWaxed = isWaxed(upperRod);
    if (upperOxid === 3 && !upperWaxed) {
        return "§4✗ Upper lightning rod is fully oxidized! Wax it with honeycomb blocks.";
    }
    return null; 
}
export function initQOL() {
    world.afterEvents.playerBreakBlock.subscribe(event => {
        const broken = event.block;
        const dim    = event.dimension;
        if (broken.typeId === "minecraft:dropper") {
            const k = `${broken.location.x},${broken.location.y},${broken.location.z}`;
            INITIALIZED_ALTARS.delete(k);
            try { broken.removeTag("package_warper_initialized"); } catch {}
            return;
        }
        if (broken.typeId === "minecraft:iron_block") {
            const k = `${broken.location.x},${broken.location.y},${broken.location.z}`;
            INITIALIZED_UNDOERS.delete(k);
            try { broken.removeTag("undoer_initialized"); } catch {}
        }
        try {
            const area = dim.getBlocks(
                {
                    from: {
                        x: broken.location.x - 6,
                        y: broken.location.y - 6,
                        z: broken.location.z - 6
                    },
                    to: {
                        x: broken.location.x + 6,
                        y: broken.location.y + 6,
                        z: broken.location.z + 6
                    }
                },
                { includeTypes: ["minecraft:dropper"] }
            );
            for (const b of area ?? []) {
                const k = `${b.location.x},${b.location.y},${b.location.z}`;
                INITIALIZED_ALTARS.delete(k);
                try { b.removeTag("package_warper_initialized"); } catch {}
            }
        } catch {}
        try {
            const ironBlocks = dim.getBlocks(
                {
                    from: {
                        x: broken.location.x - 6,
                        y: broken.location.y - 6,
                        z: broken.location.z - 6
                    },
                    to: {
                        x: broken.location.x + 6,
                        y: broken.location.y + 6,
                        z: broken.location.z + 6
                    }
                },
                { includeTypes: ["minecraft:iron_block"] }
            );
            for (const b of ironBlocks ?? []) {
                const k = `${b.location.x},${b.location.y},${b.location.z}`;
                INITIALIZED_UNDOERS.delete(k);
                try { b.removeTag("undoer_initialized"); } catch {}
            }
        } catch {}
    });
    system.runInterval(() => {
        const overworld = world.getDimension("overworld");
        for (const player of world.getPlayers()) {
            const nearbyItems = overworld.getEntities({
                type: "minecraft:item",
                location: player.location,
                maxDistance: 5
            });
            for (const item of nearbyItems) {
                handleItemEntities(item, overworld);
            }
            checkMailboxContraption(player, overworld);
            checkUndoerContraption(player, overworld);
        }
        const allItems = overworld.getEntities({ type: "minecraft:item" });
        for (const item of allItems) {
            checkUndoerItemDrop(item, overworld);
        }
    }, 10);
}
function checkUndoerContraption(player, dimension) {
    const hit = player.getBlockFromViewDirection?.({ maxDistance: 6 });
    if (!hit) return;
    const block = hit.block;
    if (!block || block.typeId !== "minecraft:iron_block") return;
    const loc = block.location;
    const above = getBlock(dimension, loc, 0, 1, 0);
    if (!above || above.typeId !== "minecraft:air") return;
    const below = getBlock(dimension, loc, 0, -1, 0);
    if (!below || below.typeId !== "minecraft:cobblestone") return;
    const undoerKey = `${loc.x},${loc.y},${loc.z}`;
    const isInitialized = INITIALIZED_UNDOERS.has(undoerKey);
    if (!isInitialized) {
        const hint = validateUndoer(block, dimension);
        if (hint) {
            player.onScreenDisplay.setActionBar(`§7[Undoer] ${hint}`);
            return;
        }
        INITIALIZED_UNDOERS.add(undoerKey);
        try { block.addTag?.("undoer_initialized"); } catch {}
        player.onScreenDisplay.setTitle("§6§lThe Undoer", {
            fadeInDuration:  4,
            stayDuration:    40,
            fadeOutDuration: 10
        });
        const nearby = dimension.getPlayers({ location: loc, maxDistance: 12 });
        for (const p of nearby) {
            p.onScreenDisplay.setActionBar("§e✦ §6§lThe Undoer §r§ehas been awakened!");
        }
        dimension.spawnEntity("minecraft:lightning_bolt", {
            x: loc.x + 0.5,
            y: loc.y + 6,
            z: loc.z + 0.5
        });
        dimension.playSound(
            "ambient.weather.thunder",
            { x: loc.x + 0.5, y: loc.y + 3, z: loc.z + 0.5 },
            { volume: 1, pitch: 0.9 }
        );
        spawnParticleBurst(dimension, { x: loc.x + 0.5, y: loc.y + 1.0, z: loc.z + 0.5 }, 24, 0.8, 1.2);
        system.runTimeout(() => {
            spawnParticleBurst(dimension, { x: loc.x + 0.5, y: loc.y + 2.5, z: loc.z + 0.5 }, 20, 1.2, 1.0);
        }, 3);
        system.runTimeout(() => {
            spawnParticleBurst(dimension, { x: loc.x + 0.5, y: loc.y + 4.0, z: loc.z + 0.5 }, 18, 1.4, 1.0);
        }, 6);
        system.runTimeout(() => {
            spawnParticleBurst(dimension, { x: loc.x + 0.5, y: loc.y + 6.0, z: loc.z + 0.5 }, 30, 2.0, 1.2);
        }, 10);
        return;
    }
    player.onScreenDisplay.setActionBar("§6§lThe Undoer");
}
function checkUndoerItemDrop(itemEntity, dimension) {
    const itemComp = itemEntity.getComponent("minecraft:item");
    if (!itemComp || !itemComp.itemStack) return;
    const itemLoc = itemEntity.location;
    let anchorBlock = null;
    let anchorLoc = null;
    anchorBlock = getBlock(dimension, itemLoc, 0, -1, 0);
    if (anchorBlock?.typeId === "minecraft:iron_block") {
        anchorLoc = anchorBlock.location;
    } else {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const testBlock = getBlock(dimension, itemLoc, dx, -1, dz);
                if (testBlock?.typeId === "minecraft:iron_block") {
                    const testKey = `${testBlock.location.x},${testBlock.location.y},${testBlock.location.z}`;
                    if (INITIALIZED_UNDOERS.has(testKey)) {
                        anchorBlock = testBlock;
                        anchorLoc = testBlock.location;
                        break;
                    }
                }
            }
            if (anchorBlock) break;
        }
    }
    if (!anchorBlock || !anchorLoc) return;
    const undoerKey = `${anchorLoc.x},${anchorLoc.y},${anchorLoc.z}`;
    if (!INITIALIZED_UNDOERS.has(undoerKey)) return;
    if (UNDOER_COOLDOWNS.has(undoerKey)) return;
    const itemTypeId = itemComp.itemStack.typeId;
    const recipe = UNCRAFT_RECIPES[itemTypeId];
    if (!recipe) return;
    UNDOER_COOLDOWNS.set(undoerKey, true);
    system.runTimeout(() => { UNDOER_COOLDOWNS.delete(undoerKey); }, 30);
    try { itemEntity.remove(); } catch {}
    const lowerRod = getBlock(dimension, anchorLoc, 0, 2, 0);
    const upperRod = getBlock(dimension, anchorLoc, 0, 6, 0);
    const lowerOxid = getOxidationLevel(lowerRod);
    const upperOxid = getOxidationLevel(upperRod);
    const maxOxid = Math.max(lowerOxid, upperOxid);
    const anyWaxed = isWaxed(lowerRod) || isWaxed(upperRod);
    const oxidStatus = getOxidationStatus(maxOxid, anyWaxed);
    const successMultiplier = oxidStatus.multiplier;
    const uncraftSuccess = Math.random() < successMultiplier;
    dimension.spawnEntity("minecraft:lightning_bolt", {
        x: anchorLoc.x + 0.5,
        y: anchorLoc.y + 6,
        z: anchorLoc.z + 0.5
    });
    dimension.playSound(
        uncraftSuccess ? "random.anvil_land" : "random.fizz",
        { x: anchorLoc.x + 0.5, y: anchorLoc.y + 1, z: anchorLoc.z + 0.5 },
        { pitch: uncraftSuccess ? 0.5 : 0.3, volume: 0.8 }
    );
    spawnParticleBurst(
        dimension,
        { x: anchorLoc.x + 0.5, y: anchorLoc.y + 1.5, z: anchorLoc.z + 0.5 },
        20, 0.7, 0.8
    );
    system.runTimeout(() => {
        if (uncraftSuccess) {
            for (const ingredient of recipe) {
                const outputItem = new ItemStack(ingredient.result, ingredient.count);
                dimension.spawnItem(outputItem, {
                    x: anchorLoc.x + 0.5 + (Math.random() - 0.5) * 0.3,
                    y: anchorLoc.y + 2.0,
                    z: anchorLoc.z + 0.5 + (Math.random() - 0.5) * 0.3
                });
            }
            dimension.playSound(
                "random.pop",
                { x: anchorLoc.x + 0.5, y: anchorLoc.y + 1, z: anchorLoc.z + 0.5 },
                { pitch: 1.2, volume: 1 }
            );
        } else {
            const returnItem = new ItemStack(itemTypeId, itemComp.itemStack.amount);
            returnItem.nameTag = itemComp.itemStack.nameTag;
            dimension.spawnItem(returnItem, {
                x: anchorLoc.x + 0.5,
                y: anchorLoc.y + 2.0,
                z: anchorLoc.z + 0.5
            });
            dimension.playSound(
                "random.break",
                { x: anchorLoc.x + 0.5, y: anchorLoc.y + 1, z: anchorLoc.z + 0.5 },
                { pitch: 0.7, volume: 1 }
            );
        }
    }, 10);
}
function checkMailboxContraption(player, dimension) {
    const hit = player.getBlockFromViewDirection?.({ maxDistance: 6 });
    if (!hit) return;
    const dropper = hit.block;
    if (!dropper || dropper.typeId !== "minecraft:dropper") return;
    if (dropper.permutation.getState("facing_direction") !== 1) return;
    const loc = dropper.location;
    const altarKey = `${loc.x},${loc.y},${loc.z}`;
    const isInitialized = INITIALIZED_ALTARS.has(altarKey);
    if (!isInitialized) {
        const hint = validateAltar(dropper, dimension);
        if (hint) {
            player.onScreenDisplay.setActionBar(`§7[Altar] ${hint}`);
            return;
        }
        INITIALIZED_ALTARS.add(altarKey);
        try { dropper.addTag?.("package_warper_initialized"); } catch {}
        player.onScreenDisplay.setTitle("§5§lPackage Warper", {
            fadeInDuration:  4,
            stayDuration:    40,
            fadeOutDuration: 10
        });
        const nearby = dimension.getPlayers({ location: loc, maxDistance: 12 });
        for (const p of nearby) {
            p.onScreenDisplay.setActionBar("§d✦ §5§lPackage Warper §r§dhas been awakened!");
        }
        dimension.spawnEntity("minecraft:lightning_bolt", {
            x: loc.x + 0.5,
            y: loc.y + 5,
            z: loc.z + 0.5
        });
        dimension.playSound(
            "ambient.weather.thunder",
            { x: loc.x + 0.5, y: loc.y + 3, z: loc.z + 0.5 },
            { volume: 1, pitch: 0.8 }
        );
        spawnParticleBurst(dimension, { x: loc.x + 0.5, y: loc.y + 0.5, z: loc.z + 0.5 }, 24, 0.8, 1.2);
        system.runTimeout(() => {
            spawnParticleBurst(dimension, { x: loc.x + 0.5, y: loc.y + 2.0, z: loc.z + 0.5 }, 20, 1.2, 1.0);
        }, 3);
        system.runTimeout(() => {
            spawnParticleBurst(dimension, { x: loc.x + 0.5, y: loc.y + 3.5, z: loc.z + 0.5 }, 18, 1.4, 1.0);
        }, 6);
        system.runTimeout(() => {
            spawnParticleBurst(dimension, { x: loc.x + 0.5, y: loc.y + 5.0, z: loc.z + 0.5 }, 30, 2.0, 1.2);
        }, 10);
        return;
    }
    player.onScreenDisplay.setActionBar("§5§lPackage Warper");
    const key = `${loc.x},${loc.y},${loc.z}`;
    if (MAILBOX_COOLDOWNS.has(key)) return;
    const invComp = dropper.getComponent("minecraft:inventory");
    if (!invComp) return;
    const container = invComp.container;
    if (!container) return;
    let targetName = null;
    let paperSlot  = -1;
    let warpPackage = null;
    let packageSlot = -1;
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (!item) continue;
        if (item.typeId === "minecraft:paper" && item.nameTag) {
            targetName = item.nameTag.trim();
            paperSlot  = i;
        }
        if (item.typeId === "minecraft:written_book" || item.typeId === "minecraft:bundle") {
            warpPackage = item;
            packageSlot = i;
        }
    }
    if (!targetName || !warpPackage) return;
    const recipient = world.getAllPlayers().find(
        p => p.name.toLowerCase() === targetName.toLowerCase()
    );
    if (!recipient) return;
    const upperRod = getBlock(dimension, loc, 0, 5, 0);
    const lowerRod = getBlock(dimension, loc, 0, 1, 0);
    const upperOxid = getOxidationLevel(upperRod);
    const lowerOxid = getOxidationLevel(lowerRod);
    const maxOxid = Math.max(upperOxid, lowerOxid);
    const anyWaxed = isWaxed(upperRod) || isWaxed(lowerRod);
    let maxWarpDistance = null;  
    let oxidationStatus = "§aOptimal";
    if (anyWaxed && maxOxid < 3) {
        maxWarpDistance = null;  
        oxidationStatus = "§6Waxed";
    } else if (maxOxid >= 3) {
        maxWarpDistance = 32;
        oxidationStatus = "§4CRITICAL - 32 blocks max";
    } else if (maxOxid >= 2) {
        maxWarpDistance = 64;
        oxidationStatus = "§6Weathered - 64 blocks max";
    } else if (maxOxid >= 1) {
        maxWarpDistance = 128;
        oxidationStatus = "§eExposed - 128 blocks max";
    }
    const dx = recipient.location.x - loc.x;
    const dz = recipient.location.z - loc.z;
    const horizontalDist = Math.sqrt(dx * dx + dz * dz);
    if (maxWarpDistance !== null && horizontalDist > maxWarpDistance) {
        dimension.playSound(
            "random.fizz",
            { x: loc.x + 0.5, y: loc.y + 3, z: loc.z + 0.5 },
            { pitch: 0.5, volume: 1 }
        );
        const itemToReturn = new ItemStack(warpPackage.typeId, 1);
        itemToReturn.nameTag = warpPackage.nameTag;
        container.addItem(itemToReturn);
        container.setItem(packageSlot, undefined);
        player.onScreenDisplay.setActionBar(`§4Warp Failed - Distance ${Math.floor(horizontalDist)}/${maxWarpDistance} blocks. ${oxidationStatus}`);
        spawnParticleBurst(dimension, { x: loc.x + 0.5, y: loc.y + 5.5, z: loc.z + 0.5 }, 15, 1.0, 0.8);
        return;
    }
    MAILBOX_COOLDOWNS.set(key, true);
    system.runTimeout(() => { MAILBOX_COOLDOWNS.delete(key); }, 20);
    const burntPaper = new ItemStack("minecraft:charcoal", 1);
    burntPaper.nameTag = `§8Charred Paper that faintly spells out "${targetName}"`;
    container.setItem(paperSlot, burntPaper);
    container.setItem(packageSlot, undefined);
    const snapPackage = dimension.spawnItem(warpPackage, {
        x: loc.x + 0.5,
        y: loc.y + 5.5,
        z: loc.z + 0.5
    });
    try { snapPackage.applyImpulse({ x: 0, y: 0, z: 0 }); } catch {}
    dimension.spawnItem(burntPaper, {
        x: loc.x + 0.5,
        y: loc.y + 0.1,
        z: loc.z + 0.5
    });
    dimension.playSound(
        "note.pling",
        { x: loc.x + 0.5, y: loc.y + 3, z: loc.z + 0.5 },
        { pitch: 1.8, volume: 1 }
    );
    spawnParticleBurst(
        dimension,
        { x: loc.x + 0.5, y: loc.y + 5.5, z: loc.z + 0.5 },
        10, 0.5, 0.6
    );
    system.runTimeout(() => {
        try { snapPackage.remove(); } catch {}
        recipient.dimension.spawnItem(warpPackage, {
            x: recipient.location.x,
            y: recipient.location.y + 1,
            z: recipient.location.z
        });
        recipient.playSound("note.pling", { pitch: 2, volume: 1 });
        recipient.sendMessage("§d✦ A strange package materializes beside you.");
    }, 6);
}
function handleItemEntities(itemEntity, overworld) {
    const itemComp = itemEntity.getComponent("minecraft:item");
    if (!itemComp || !itemComp.itemStack) return;
    const nameTag = itemComp.itemStack.nameTag;
    if (!nameTag) return;
    const players = overworld.getPlayers({
        location: itemEntity.location,
        maxDistance: 4
    });
    if (players.length === 0) return;
    const dropper = players[0];
    if (nameTag === nameTag.toUpperCase()) {
        const match = OFFERINGS.find(o => o.title === nameTag);
        if (match) {
            const block = overworld.getBlock(itemEntity.location);
            if (match.block !== "minecraft:air" && block.typeId !== match.block) return;
            if (match.effect) {
                dropper.addEffect(match.effect, match.dur, {
                    amplifier: match.amp,
                    showParticles: false
                });
            }
            if (match.adminOnly && !ADMIN_USERS.includes(dropper.name)) {
                dropper.sendMessage("§4You are not authorized to use this offering!");
                return;
            }
            if (match.action) match.action(itemEntity.location, overworld, dropper);
            dropper.sendMessage(match.msg);
            try { itemEntity.remove(); } catch {}
        } else if (nameTag.length > 3) {
            executeAnger(dropper, itemEntity, overworld);
        }
    }
}
function executeAnger(player, itemEntity, dimension) {
    player.sendMessage("§4THE GODS ARE FURIOUS BY YOUR TYPOS!");
    dimension.spawnEntity("minecraft:lightning_bolt", player.location);
    dimension.createExplosion(player.location, 4, {
        breaksBlocks: true,
        causesFire:   true
    });
    try { itemEntity.remove(); } catch {}
}