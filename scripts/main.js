import { world, system, CommandPermissionLevel, ItemStack ,EquipmentSlot,EnchantmentTypes} from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";
import { initQOL } from "./qol.js";
initQOL();
console.warn("[SAME] Script loading...");
const ADMINISTRATORS = ["TaxCollector381"];
const JAIL_CORD = { x: -47, y: 89, z: 1338 };
const BUNDLE_BLOCK_PROPERTY   = "same:blockBundles";
const INVENTORY_SYNC_PROPERTY = "same:inventorySync";
const CRASH_DROP_PROPERTY     = "same:antiCrashDrop";
const HOPPER_HOPPER_PROPERTY  = "same:hopperToHopper";
const PERSISTENT_DUPER_LIST_PROPERTY = "same:persistentDuperMachines";
const REVIVAL_PROPERTY        = "same:revivals";
let _bundleBlock   = null;
let _crashDrop     = null;
let _invSync       = null;
let _hopperToHopper = null;
function getBundleBlockingSetting()  { return (_bundleBlock   ??= world.getDynamicProperty(BUNDLE_BLOCK_PROPERTY)   ?? true); }
function getCrashDropSetting()       { return (_crashDrop     ??= world.getDynamicProperty(CRASH_DROP_PROPERTY)     ?? true); }
function getInventorySyncSetting()   { return (_invSync       ??= world.getDynamicProperty(INVENTORY_SYNC_PROPERTY) ?? false); }
function getHopperToHopperSetting()  { return (_hopperToHopper ??= world.getDynamicProperty(HOPPER_HOPPER_PROPERTY) ?? true); }
function setBundleBlockingSetting(v)  { _bundleBlock    = v; world.setDynamicProperty(BUNDLE_BLOCK_PROPERTY,   v); }
function setCrashDropSetting(v)       { _crashDrop      = v; world.setDynamicProperty(CRASH_DROP_PROPERTY,     v); }
function setInventorySyncSetting(v)   { _invSync        = v; world.setDynamicProperty(INVENTORY_SYNC_PROPERTY, v); }
function setHopperToHopperSetting(v)  { _hopperToHopper = v; world.setDynamicProperty(HOPPER_HOPPER_PROPERTY,  v); }
const WEBHOOK_URL = ""
const _alertQueue = [];
let _alertProcessing = false;
async function _processAlertQueue() {
    if (_alertProcessing) return;
    _alertProcessing = true;
    while (_alertQueue.length > 0) {
        const task = _alertQueue.shift();
        await task();
    }
    _alertProcessing = false;
}
async function AdminAlert(message, level, tag = "SAME", playerName = "Unknown") {
    const alertStyles = {
        critical: { sound: "note.bell",  color: "§4", webhookColor: 0xFF0000 },
        high:     { sound: "note.pling", color: "§c", webhookColor: 0xFF4500 },
        medium:   { sound: "note.bass",  color: "§e", webhookColor: 0xFFD700 },
        low:      { sound: "note.hat",   color: "§a", webhookColor: 0x00AA00 },
    };
    const tagStyles = {
        SAME: { label: "SAME", color: "§c" },
        SADG: { label: "SADG", color: "§6" },
        SLOG: { label: "SLOG", color: "§b" },
        SBAN: { label: "SBAN", color: "§4" },
        SKCK: { label: "SKCK", color: "§e" },
        SMUT: { label: "SMUT", color: "§d" },
        SWRN: { label: "SWRN", color: "§3" },
        SNET: { label: "SNET", color: "§a" },
        SINV: { label: "SINV", color: "§5" },
        SMOV: { label: "SMOV", color: "§2" },
    };
    const style  = alertStyles[level] ?? alertStyles.high;
    const tagDef = tagStyles[tag]     ?? tagStyles.SAME;
    for (const adminName of ADMINISTRATORS) {
        const admin = world.getPlayers().find(p => p.name === adminName);
        if (!admin) continue;
        admin.sendMessage(`${tagDef.color}[${tagDef.label}]§r ${style.color}[${level.toUpperCase()}]§r ${message}`);
        system.run(() => {
            try {
                admin.dimension.playSound(style.sound, admin.location, {
                    volume: 1.0, pitch: level === "critical" ? 1.8 : 1.0
                });
            } catch (e) {}
        });
    }
    _alertQueue.push(async () => {
        try {
            const netModule = await import("@minecraft/server-net").catch(() => null);
            if (!netModule) return;
            const { HttpRequest, HttpRequestMethod, HttpHeader, http } = netModule;
            const payload = {
                embeds: [{
                    title: `[${tagDef.label}] ${level.toUpperCase()} Alert`,
                    description: message,
                    color: style.webhookColor,
                    fields: [
                        { name: "Tag",       value: tagDef.label,            inline: true },
                        { name: "Level",     value: level.toUpperCase(),     inline: true },
                        { name: "Player",    value: playerName,              inline: true },
                        { name: "Timestamp", value: new Date().toUTCString(), inline: false },
                    ],
                    footer: { text: "SAME Anti-Cheat System" },
                }],
            };
            const req = new HttpRequest(WEBHOOK_URL);
            req.method = HttpRequestMethod.Post;
            req.headers = [
                new HttpHeader("Content-Type", "application/json"),
                new HttpHeader("User-Agent", "SAME-AntiCheat/1.0"),
            ];
            req.body = JSON.stringify(payload);
            await http.request(req);
        } catch (err) {
            console.error(`[SAME] Webhook failed: ${err}`);
        }
    });
    _processAlertQueue(); 
}
system.beforeEvents.startup.subscribe((init) => {
    console.warn("[SAME] Startup event fired!");
    const registry = init.customCommandRegistry;
    const cmdBase = { permissionLevel: CommandPermissionLevel.GameDirectors, cheatsRequired: true };
    registry.registerCommand({ name: "same:bundles",    description: "Toggle bundle-hopper blocking",               ...cmdBase }, (origin) => {
        const player = origin.sourceEntity;
        if (!player || player.typeId !== "minecraft:player") return { status: 0 };
        system.run(() => { const v = !getBundleBlockingSetting(); setBundleBlockingSetting(v); player.sendMessage(`§e[SADG]§r Bundle blocking: ${v ? "§aENABLED" : "§cDISABLED"}`); });
        return { status: 0 };
    });
    registry.registerCommand({ name: "same:status", description: "Check cheat prevention feature status", permissionLevel: CommandPermissionLevel.Any, cheatsRequired: true }, (origin) => {
        const player = origin.sourceEntity;
        if (!player || player.typeId !== "minecraft:player") return { status: 0 };
        system.run(() => {
            player.sendMessage(
                `§e[SADG] Status:§r\n` +
                `  Bundle Blocking:    ${getBundleBlockingSetting()  ? "§aMONITORING" : "§cDISABLED"}§r\n` +
                `  Inventory Sync:     ${getInventorySyncSetting()   ? "§aENABLED"    : "§cDISABLED"}§r\n` +
                `  Anti-Crash Drop:   ${getCrashDropSetting()        ? "§aENABLED"    : "§cDISABLED"}§r\n` +
                `  Hopper-to-Hopper:  ${getHopperToHopperSetting()   ? "§aALLOWED"   : "§cNOT ALLOWED"}§r`
            );
        });
        return { status: 0 };
    });
    registry.registerCommand({ name: "same:invcheck",   description: "Toggle Strict Inventory Synchronization",     ...cmdBase }, (origin) => {
        const player = origin.sourceEntity;
        if (!player || player.typeId !== "minecraft:player") return { status: 0 };
        system.run(() => { const v = !getInventorySyncSetting(); setInventorySyncSetting(v); player.sendMessage(`§e[SADG]§r Inventory Sync: ${v ? "§aENABLED" : "§cDISABLED"}`); });
        return { status: 0 };
    });
    registry.registerCommand({ name: "same:hth",        description: "Toggle hopper-to-hopper placement",           ...cmdBase }, (origin) => {
        const player = origin.sourceEntity;
        if (!player || player.typeId !== "minecraft:player") return { status: 0 };
        system.run(() => { const v = !getHopperToHopperSetting(); setHopperToHopperSetting(v); player.sendMessage(`§e[SADG]§r Hopper-to-Hopper: ${v ? "§aALLOWED" : "§cNOT ALLOWED"}`); });
        return { status: 0 };
    });
    registry.registerCommand({ name: "same:coursedrop", description: "Toggle Anti-Crash/Disconnect Drop protection", ...cmdBase }, (origin) => {
        const player = origin.sourceEntity;
        if (!player || player.typeId !== "minecraft:player") return { status: 0 };
        system.run(() => { const v = !getCrashDropSetting(); setCrashDropSetting(v); player.sendMessage(`§e[SADG]§r Anti-Crash Drop: ${v ? "§aENABLED" : "§cDISABLED"}`); });
        return { status: 0 };
    });
    registry.registerCommand({ name: "same:adminbook", description: "Get the admin book", ...cmdBase }, (origin) => {
        const player = origin.sourceEntity;
        if (!player || player.typeId !== "minecraft:player") return { status: 0 };
        system.run(() => {
            if (!ADMINISTRATORS.includes(player.name)) { player.sendMessage("§c[SAME]§r Not authorized!"); return; }
            const book = createAdminBook();
            const inv  = player.getComponent("inventory");
            if (inv?.container) {
                const added = inv.container.addItem(book);
                if (added) player.sendMessage("§a[SAME]§r Admin book added!");
                else { player.dimension.spawnItem(book, player.location); player.sendMessage("§a[SAME]§r Admin book dropped at your feet!"); }
            }
            player.playSound("note.pling", { volume: 1, pitch: 1.5 });
        });
        return { status: 0 };
    });
    registry.registerCommand({ name: "same:scandupers", description: "Scan world for dupe machines", ...cmdBase }, (origin) => {
        const player = origin.sourceEntity;
        if (!player || player.typeId !== "minecraft:player") return { status: 0 };
        if (!ADMINISTRATORS.includes(player.name)) { player.sendMessage("§c[SAME]§r Not authorized!"); return { status: 0 }; }
        system.run(() => {
            const machines = persistWorldDuperMachines();
            player.sendMessage(`§a[SAME]§r Scan complete. ${machines.length} dupe machine(s) found.`);
        });
        return { status: 0 };
    });
    registry.registerCommand({ name: "same:firestrike", description: "Fire an orbital strike at your location", ...cmdBase }, (origin) => {
        const player = origin.sourceEntity;
        if (!player || player.typeId !== "minecraft:player") return { status: 0 };
        system.run(() => {
            if (player.name == "TaxCollector381") {
              //Gone
            }
        });
        return { status: 0 };
    });
    registry.registerCommand({ name: "same:logs", description: "View recent sign and chest logs", ...cmdBase }, (origin) => {
        const player = origin.sourceEntity;
        if (!player || player.typeId !== "minecraft:player") return { status: 0 };
        if (!ADMINISTRATORS.includes(player.name)) { player.sendMessage("§c[SAME]§r Not authorized!"); return { status: 0 }; }
        system.run(async () => { await showLogsMenu(player); });
        return { status: 0 };
    });
    console.warn("[SAME] All commands registered.");
});
const FACE_TO_DIRECTION = { "Up": 0, "Down": 1, "North": 2, "South": 3, "West": 4, "East": 5 };
function getDirectionOffset(direction, multiplier) {
    const o = { x: 0, y: 0, z: 0 };
    if (direction === 0) o.y = -multiplier;
    else if (direction === 1) o.y = multiplier;
    else if (direction === 2) o.z = -multiplier;
    else if (direction === 3) o.z = multiplier;
    else if (direction === 4) o.x = -multiplier;
    else if (direction === 5) o.x = multiplier;
    return o;
}
const trackedContainers      = new Map();
const hopperH2HConfigs       = new Map();
const pistonPushedH2HZones   = new Map();
const playerHopperClickEvents= new Map();
const DUPED_BUNDLE_TAG       = "same:dupedBundle";
let _scanIntervalId = null;
function playerHasBundle(player) {
    try {
        const inv = player.getComponent("inventory");
        if (inv?.container) {
            for (let i = 0; i < inv.container.size; i++) {
                if (inv.container.getItem(i)?.typeId?.includes("bundle")) return true;
            }
        }
        if (player.getComponent("equippable")?.getEquipment("Offhand")?.typeId?.includes("bundle")) return true;
    } catch (e) {}
    return false;
}
function isItemDuped(item) {
    try {
        if (!item) return false;
        if (item.getDynamicProperty?.(DUPED_BUNDLE_TAG)) return true;
        return item.getLore?.()?.some(l => l.includes("DUPED")) ?? false;
    } catch (e) { return false; }
}
function tagItemAsDuped(item) {
    try {
        if (!item) return;
        item.setDynamicProperty?.(DUPED_BUNDLE_TAG, true);
        const lore = item.getLore?.() ?? [];
        if (!lore.some(l => l.includes("DUPED"))) { lore.push("§4§o[DUPED ITEM]"); item.setLore?.(lore); }
    } catch (e) { console.warn(`[SAME] Error tagging duped item: ${e}`); }
}
function checkHopperH2HConfiguration(block) {
    try {
        if (block.typeId !== "minecraft:hopper") return null;
        const facing = block.permutation.getState("facing_direction");
        const off1   = getDirectionOffset(facing, 1);
        const pos2   = { x: block.location.x + off1.x, y: block.location.y + off1.y, z: block.location.z + off1.z };
        const block2 = block.dimension.getBlock(pos2);
        if (!block2 || block2.typeId !== "minecraft:hopper") return null;
        const facing2 = block2.permutation.getState("facing_direction");
        const off2    = getDirectionOffset(facing2, 1);
        const back    = { x: pos2.x + off2.x, y: pos2.y + off2.y, z: pos2.z + off2.z };
        if (Math.floor(back.x) === Math.floor(block.location.x) &&
            Math.floor(back.y) === Math.floor(block.location.y) &&
            Math.floor(back.z) === Math.floor(block.location.z)) {
            return { hopper1: block.location, hopper2: pos2 };
        }
    } catch (e) {}
    return null;
}
function registerHopperH2HConfig(config, dimensionId) {
    if (!config) return;
    const key = `${config.hopper1.x},${config.hopper1.y},${config.hopper1.z},${dimensionId}`;
    hopperH2HConfigs.set(key, { ...config, dimensionId, timestamp: Date.now() });
}
function _runAllScans() {
    const now = Date.now();
    if (getBundleBlockingSetting()) {
        const validTypes = new Set(["minecraft:hopper","minecraft:dispenser","minecraft:dropper","minecraft:crafter"]);
        let batch = 0;
        for (const [key, data] of trackedContainers) {
            if (batch++ >= 8) break;
            if (now > data.expireTime) { trackedContainers.delete(key); continue; }
            try {
                const block = world.getDimension(data.dimensionId).getBlock(data.pos);
                if (!block || !validTypes.has(block.typeId)) { trackedContainers.delete(key); continue; }
                const container = block.getComponent("inventory")?.container;
                if (!container) continue;
                for (let s = 0; s < container.size; s++) {
                    const item = container.getItem(s);
                    if (!item?.typeId?.includes("bundle")) continue;
                    const last = data.lastAlertTime ?? 0;
                    if (now - last >= 8000) {
                        AdminAlert(`Bundle in container at ${data.pos.x},${data.pos.y},${data.pos.z} (${data.dimensionId}). Monitoring.`, "low", "SADG", "CONTAINER_MONITOR");
                        data.lastAlertTime = now;
                    }
                    break;
                }
            } catch (e) { trackedContainers.delete(key); }
        }
    }
    if (getBundleBlockingSetting()) {
        let batch = 0;
        for (const [key, data] of hopperH2HConfigs) {
            if (batch++ >= 5) break;
            if (now - data.timestamp > 300000) { hopperH2HConfigs.delete(key); continue; }
            try {
                const container = world.getDimension(data.dimensionId).getBlock(data.hopper1)?.getComponent("inventory")?.container;
                if (!container) continue;
                for (let s = 0; s < container.size; s++) {
                    const item = container.getItem(s);
                    if (!item?.typeId?.includes("bundle")) { if (data.bundleTimestamps) delete data.bundleTimestamps[s]; continue; }
                    const ts = data.bundleTimestamps?.[s] ?? now;
                    if (!data.bundleTimestamps) data.bundleTimestamps = {};
                    data.bundleTimestamps[s] = ts;
                    if (now - ts >= 3000 && !isItemDuped(item)) {
                        tagItemAsDuped(item); container.setItem(s, item);
                        AdminAlert(`Duped Bundle in H2H hopper at ${data.hopper1.x},${data.hopper1.y},${data.hopper1.z} (${data.dimensionId}).`, "high", "SADG", "SYSTEM");
                    }
                }
            } catch (e) { hopperH2HConfigs.delete(key); }
        }
    }
    if (getBundleBlockingSetting()) {
        let batch = 0;
        for (const [key, zone] of pistonPushedH2HZones) {
            if (batch++ >= 3) break;
            if (now - zone.timestamp > 10000) { pistonPushedH2HZones.delete(key); continue; }
            try {
                const container = world.getDimension(zone.dimensionId).getBlock(zone.hopper1)?.getComponent("inventory")?.container;
                if (!container) continue;
                for (let s = 0; s < container.size; s++) {
                    const item = container.getItem(s);
                    if (!item?.typeId?.includes("bundle")) { if (zone.bundleTimestamps) delete zone.bundleTimestamps[s]; continue; }
                    const ts = zone.bundleTimestamps?.[s] ?? now;
                    if (!zone.bundleTimestamps) zone.bundleTimestamps = {};
                    zone.bundleTimestamps[s] = ts;
                    if (now - ts >= 3000 && !isItemDuped(item)) {
                        tagItemAsDuped(item); container.setItem(s, item);
                        AdminAlert(`PISTON DUPE at ${zone.hopper1.x},${zone.hopper1.y},${zone.hopper1.z} (${zone.dimensionId}). Clicks: ${zone.clickCount}`, "critical", "SADG", "PISTON_SYSTEM");
                    }
                }
            } catch (e) { pistonPushedH2HZones.delete(key); }
        }
    }
    if (trackedContainers.size === 0 && hopperH2HConfigs.size === 0 && pistonPushedH2HZones.size === 0) {
        if (_scanIntervalId !== null) { system.clearRun(_scanIntervalId); _scanIntervalId = null; }
    }
}
function ensureScanInterval() {
    if (_scanIntervalId === null) {
        _scanIntervalId = system.runInterval(_runAllScans, 120);
    }
}
function detectPistonPushedH2HConfigs(pistonLoc, dimension) {
    const radius = 8;
    try {
        for (let x = -radius; x <= radius; x += 2) {
            for (let y = -radius; y <= radius; y += 2) {
                for (let z = -radius; z <= radius; z += 2) {
                    const block = dimension.getBlock({ x: pistonLoc.x + x, y: pistonLoc.y + y, z: pistonLoc.z + z });
                    if (!block || block.typeId !== "minecraft:hopper") continue;
                    const config = checkHopperH2HConfiguration(block);
                    if (!config) continue;
                    const zk = `${block.location.x},${block.location.y},${block.location.z},${dimension.id}`;
                    pistonPushedH2HZones.set(zk, { hopper1: config.hopper1, hopper2: config.hopper2, dimensionId: dimension.id, timestamp: Date.now(), clickCount: 0 });
                }
            }
        }
    } catch (e) { console.warn(`[SAME] Piston H2H detection error: ${e}`); }
}
world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    if (!getBundleBlockingSetting()) return;
    const { block, player } = event;
    const validTypes = new Set(["minecraft:hopper","minecraft:dispenser","minecraft:dropper","minecraft:crafter"]);
    if (!validTypes.has(block.typeId) || !playerHasBundle(player)) return;
    const pos = block.location;
    const key = `${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)},${block.dimension.id}`;
    trackedContainers.set(key, {
        pos: { x: Math.floor(pos.x), y: Math.floor(pos.y), z: Math.floor(pos.z) },
        dimensionId: block.dimension.id, expireTime: Date.now() + 120000
    });
    ensureScanInterval();
    if (block.typeId === "minecraft:hopper") {
        const zoneKey = `${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)},${block.dimension.id}`;
        if (pistonPushedH2HZones.has(zoneKey)) {
            const zone = pistonPushedH2HZones.get(zoneKey);
            zone.clickCount++;
            const now = Date.now();
            const pid = player.id;
            const clicks = (playerHopperClickEvents.get(pid) ?? []).filter(c => now - c.time < 5000);
            clicks.push({ time: now, zone: zoneKey });
            playerHopperClickEvents.set(pid, clicks);
            if (clicks.length >= 4) {
                AdminAlert(`Rapid hopper click by ${player.name}: ${clicks.length}x in 5s at ${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)}`, "high", "SADG", player.name);
            }
        }
    }
});
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { itemStack: item, block: targetBlock, player, blockFace } = event;
    if (item?.typeId !== "minecraft:hopper" || targetBlock.typeId !== "minecraft:hopper") return;
    const existingFacing    = targetBlock.permutation.getState("facing_direction");
    const existingPointsNew = existingFacing === FACE_TO_DIRECTION[blockFace];
    const newPointsExisting = blockFace !== "Up" && blockFace !== "Down";
    if (existingPointsNew && newPointsExisting && getHopperToHopperSetting() === false) {
        event.cancel = true;
        system.run(() => {
            player.playSound("note.bass", { pitch: 0.5, volume: 1 });
            player.sendMessage("§c[SADG]§r Hopper-to-Hopper placements are §cNOT ALLOWED§r on this realm.");
        });
        AdminAlert(`H2H placement blocked at ${Math.floor(player.location.x)},${Math.floor(player.location.y)},${Math.floor(player.location.z)}`, "medium", "SADG", player.name);
    }
});
world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const { block, player } = event;
    if (block.typeId === "minecraft:hopper") {
        system.run(() => {
            const config = checkHopperH2HConfiguration(block);
            if (config) { registerHopperH2HConfig(config, block.dimension.id); ensureScanInterval(); }
        });
    }
});
system.runInterval(() => {
    for (const adminName of ADMINISTRATORS) {
        const admin = world.getPlayers().find(p => p.name === adminName);
        if (!admin) continue;
        try {
            const eq = admin.getComponent("equippable");
            const main = eq?.getEquipment("Mainhand");
            if (main?.typeId?.includes("bundle") && isItemDuped(main)) { admin.onScreenDisplay.setActionBar("§4§l⚠ DUPED ITEM IN HAND ⚠"); continue; }
            const off = eq?.getEquipment("Offhand");
            if (off?.typeId?.includes("bundle") && isItemDuped(off)) { admin.onScreenDisplay.setActionBar("§4§l⚠ DUPED ITEM IN OFFHAND ⚠"); continue; }
            const inv = admin.getComponent("inventory")?.container;
            if (inv) {
                for (let i = 0; i < inv.size; i++) {
                    const it = inv.getItem(i);
                    if (it?.typeId?.includes("bundle") && isItemDuped(it)) { admin.onScreenDisplay.setActionBar(`§4§l⚠ DUPED ITEM IN INVENTORY (Slot ${i + 1}) ⚠`); break; }
                }
            }
        } catch (e) {}
    }
}, 60);
world.afterEvents.pistonActivate.subscribe((event) => {
    const pistonComponent = event.piston;
    if (!pistonComponent || !event.isExpanding) return;
    const piston    = pistonComponent.block;
    if (!piston) return;
    const dimension = piston.dimension;
    const pistonLoc = piston.location;
    system.run(() => {
        detectPistonPushedH2HConfigs(pistonLoc, dimension);
        ensureScanInterval();
        const pistonFacing = piston.permutation.getState("facing_direction");
        if (pistonFacing === undefined) return;
        const headOff = getDirectionOffset(pistonFacing, 1);
        const headPos = { x: pistonLoc.x + headOff.x, y: pistonLoc.y + headOff.y, z: pistonLoc.z + headOff.z };
        for (let reach = 0; reach <= 4; reach++) {
            const checkPos = {
                x: headPos.x + headOff.x * reach,
                y: headPos.y + headOff.y * reach,
                z: headPos.z + headOff.z * reach
            };
            const block = dimension.getBlock(checkPos);
            if (!block || block.typeId !== "minecraft:hopper") continue;
            const config = checkHopperH2HConfiguration(block);
            if (config) {
                block.setType("minecraft:air");
                dimension.spawnParticle("minecraft:large_explosion", checkPos);
                dimension.playSound("note.bass", checkPos, { pitch: 0.5, volume: 1 });
                break;
            }
        }
    });
});
world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const { block, player } = event;
    const validTypes = new Set(["minecraft:dispenser","minecraft:dropper"]);
    if (!validTypes.has(block.typeId)) return;
    const facing = block.permutation.getState("facing_direction");
    if (facing === undefined) return;
    const off1   = getDirectionOffset(facing, 1);
    const pos2   = { x: block.location.x + off1.x, y: block.location.y + off1.y, z: block.location.z + off1.z };
    const block2 = block.dimension.getBlock(pos2);
    if (!block2 || !validTypes.has(block2.typeId)) return;
    const off2  = getDirectionOffset(block2.permutation.getState("facing_direction"), 1);
    const back  = { x: pos2.x + off2.x, y: pos2.y + off2.y, z: pos2.z + off2.z };
    if (Math.floor(back.x) === Math.floor(block.location.x) &&
        Math.floor(back.y) === Math.floor(block.location.y) &&
        Math.floor(back.z) === Math.floor(block.location.z)) {
        system.run(() => {
            const cur = block.dimension.getBlock(block.location);
            if (!validTypes.has(cur?.typeId)) return;
            cur.setType("minecraft:air");
            block.dimension.spawnItem(new ItemStack(block.typeId, 1), block.location);
            block.dimension.playSound("note.bass", block.location, { pitch: 0.5, volume: 1 });
            block.dimension.spawnParticle("minecraft:villager_angry", block.location);
        });
    }
});
const recentDisconnects = [];
const playerLocations   = new Map();
system.runInterval(() => {
    if (!getCrashDropSetting()) return;
    for (const player of world.getPlayers()) {
        try { playerLocations.set(player.id, { location: player.location, dimensionId: player.dimension.id }); }
        catch (e) {}
    }
}, 40);
world.afterEvents.playerLeave.subscribe((event) => {
    if (!getCrashDropSetting()) return;
    const last = playerLocations.get(event.playerId);
    if (!last) return;
    recentDisconnects.push({ ...last, time: Date.now() });
    const now = Date.now();
    while (recentDisconnects.length > 0 && now - recentDisconnects[0].time > 5000) recentDisconnects.shift();
    playerLocations.delete(event.playerId);
});
world.afterEvents.entitySpawn.subscribe((event) => {
    if (!getCrashDropSetting()) return;
    const { entity } = event;
    if (entity.typeId !== "minecraft:item") return;
    const spawnTime = Date.now();
    const spawnLoc  = entity.location;
    const spawnDim  = entity.dimension.id;
    for (const dc of recentDisconnects) {
        if (spawnTime - dc.time > 3000 || dc.dimensionId !== spawnDim) continue;
        const dx = spawnLoc.x - dc.location.x, dy = spawnLoc.y - dc.location.y, dz = spawnLoc.z - dc.location.z;
        if (dx*dx + dy*dy + dz*dz <= 9) {
            try { entity.remove(); } catch (e) {}
            return;
        }
    }
});
function getPlayerInventoryMap(player) {
    const counts = {};
    const container = player.getComponent("inventory")?.container;
    if (container) {
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item) counts[item.typeId] = (counts[item.typeId] ?? 0) + item.amount;
        }
    }
    return counts;
}
const pendingUpdates      = new Map();
const lastCommittedCounts = new Map();
function savePlayerInventory(player) {
    if (!getInventorySyncSetting()) return;
    try {
        const current  = getPlayerInventoryMap(player);
        const pid      = player.id;
        if (!lastCommittedCounts.has(pid)) {
            const stored = world.getDynamicProperty(`dp_inv_${pid}`);
            lastCommittedCounts.set(pid, stored ? JSON.parse(stored) : {});
        }
        const committed   = lastCommittedCounts.get(pid);
        const SAFE_DELAY  = 15000;
        const now         = Date.now();
        const hasIncrease = Object.keys(current).some(id => (current[id] ?? 0) > (committed[id] ?? 0));
        if (hasIncrease) {
            const pending = pendingUpdates.get(pid);
            if (pending && now - pending.timestamp > SAFE_DELAY) {
                world.setDynamicProperty(`dp_inv_${pid}`, JSON.stringify(current));
                lastCommittedCounts.set(pid, current);
                pendingUpdates.delete(pid);
            } else if (!pending) {
                pendingUpdates.set(pid, { counts: current, timestamp: now });
            }
        } else {
            world.setDynamicProperty(`dp_inv_${pid}`, JSON.stringify(current));
            lastCommittedCounts.set(pid, current);
            pendingUpdates.delete(pid);
        }
    } catch (e) { console.warn("[SAME] Save Error: " + e); }
}
system.runInterval(() => {
    if (!getInventorySyncSetting()) return;
    for (const player of world.getPlayers()) savePlayerInventory(player);
}, 60);
const ADMIN_BOOK_NAME = "SAME";
const OM_BOOK_NAME    = "SAMEOM";
function isAdminBook(item)          { return item?.typeId === "minecraft:book" && item.nameTag === ADMIN_BOOK_NAME; }
function isOrbitalMarkerBook(item)  { return item?.typeId === "minecraft:book" && item.nameTag === OM_BOOK_NAME; }
function createAdminBook() {
    const book = new ItemStack("minecraft:book", 1);
    book.nameTag = ADMIN_BOOK_NAME;
    book.setLore(["§6§lADMIN TOOL", "§7Right-click to open admin menu", "§8SAME Anti-Cheat System"]);
    return book;
}
function createOrbitalMarkerBook(markerName) {
    const book = new ItemStack("minecraft:book", 1);
    book.nameTag = OM_BOOK_NAME;
    book.setLore(["§4§lORBITAL MARKER", markerName ? `§7Name: §e${markerName}` : "§7Name: §8(none)", "§7Right-click ground to place marker", "§8SAME Orbital Strike System"]);
    return book;
}
function getDupersList() {
    return world.getPlayers()
        .map(p => { const k = `same_offences_${p.id}`; const o = world.getDynamicProperty(k) ?? 0; return { name: p.name, id: p.id, offences: o, location: p.location, dimension: p.dimension.id }; })
        .filter(d => d.offences > 0);
}
function getHTHAreas() {
    const out = [];
    for (const [, c] of hopperH2HConfigs)       out.push({ pos1: c.hopper1, pos2: c.hopper2, dimension: c.dimensionId, timestamp: c.timestamp });
    for (const [, z] of pistonPushedH2HZones)   out.push({ pos1: z.hopper1, pos2: z.hopper2, dimension: z.dimensionId, timestamp: z.timestamp, type: "piston-pushed" });
    return out;
}
function getPersistentDuperMachines() {
    const raw = world.getDynamicProperty(PERSISTENT_DUPER_LIST_PROPERTY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
}
function savePersistentDuperMachines(list) {
    try { world.setDynamicProperty(PERSISTENT_DUPER_LIST_PROPERTY, JSON.stringify(list)); } catch (e) {}
}
function addPersistentDuperMachine(entry) {
    const list = getPersistentDuperMachines();
    if (list.some(i => i.id === entry.id)) return;
    list.push(entry);
    savePersistentDuperMachines(list);
}
function getNearbyDupeComponents(pos, dimension, radius = 4) {
    const types = new Set();
    const valid = new Set(["minecraft:redstone_wire","minecraft:repeater","minecraft:comparator","minecraft:piston","minecraft:sticky_piston","minecraft:observer","minecraft:redstone_torch","minecraft:lever","minecraft:stone_button","minecraft:wooden_button","minecraft:daylight_detector","minecraft:tripwire_hook"]);
    for (let dx = -radius; dx <= radius; dx += 2) {
        for (let dy = -radius; dy <= radius; dy += 2) {
            for (let dz = -radius; dz <= radius; dz += 2) {
                const b = dimension.getBlock({ x: pos.x+dx, y: pos.y+dy, z: pos.z+dz });
                if (!b || !valid.has(b.typeId)) continue;
                if (b.typeId.includes("redstone"))              types.add("Redstone");
                if (b.typeId.includes("repeater") || b.typeId.includes("comparator")) types.add("Repeater/Comparator");
                if (b.typeId.includes("piston")   || b.typeId.includes("observer"))   types.add("Piston/Observer");
                if (b.typeId.includes("lever")    || b.typeId.includes("button") || b.typeId.includes("tripwire")) types.add("Trigger");
            }
        }
    }
    return [...types];
}
function normalizeLocation(loc) { return { x: Math.floor(loc.x), y: Math.floor(loc.y), z: Math.floor(loc.z) }; }
function getMachineId(config, type) {
    return `${type}:${config.dimensionId}:${Math.floor(config.hopper1.x)},${Math.floor(config.hopper1.y)},${Math.floor(config.hopper1.z)}:${Math.floor(config.hopper2.x)},${Math.floor(config.hopper2.y)},${Math.floor(config.hopper2.z)}`;
}
function scanNearbyForH2HMachines(center, dimension, radius = 12) {
    const found = [];
    const minX = Math.floor(center.x - radius), maxX = Math.floor(center.x + radius);
    const minY = Math.max(0, Math.floor(center.y - 6)), maxY = Math.min(255, Math.floor(center.y + 6));
    const minZ = Math.floor(center.z - radius), maxZ = Math.floor(center.z + radius);
    for (let x = minX; x <= maxX; x += 3) {
        for (let y = minY; y <= maxY; y += 3) {
            for (let z = minZ; z <= maxZ; z += 3) {
                const block = dimension.getBlock({ x, y, z });
                if (!block || block.typeId !== "minecraft:hopper") continue;
                const config = checkHopperH2HConfiguration(block);
                if (!config) continue;
                const id = getMachineId(config, "H2H");
                if (found.some(m => m.id === id)) continue;
                const h1 = normalizeLocation(config.hopper1);
                const components = [...new Set([...getNearbyDupeComponents(h1, dimension, 3), ...getNearbyDupeComponents(normalizeLocation(config.hopper2), dimension, 3)])];
                if (components.length === 0) continue;
                found.push({ id, type: "H2H", dimensionId: dimension.id, hopper1: h1, hopper2: normalizeLocation(config.hopper2), components, detectedAt: Date.now() });
            }
        }
    }
    return found;
}
function persistWorldDuperMachines() {
    const machines = [];
    for (const dimId of ["overworld","nether","the_end"]) {
        let dim; try { dim = world.getDimension(dimId); } catch (_) { continue; }
        for (const player of world.getPlayers().filter(p => p.dimension.id === dimId)) {
            for (const machine of scanNearbyForH2HMachines(player.location, dim, 12)) {
                addPersistentDuperMachine(machine); machines.push(machine);
            }
        }
    }
    for (const [, c] of hopperH2HConfigs) {
        const m = { id: `H2H_TRACKED:${c.dimensionId}:${Math.floor(c.hopper1.x)},${Math.floor(c.hopper1.y)},${Math.floor(c.hopper1.z)}:${Math.floor(c.hopper2.x)},${Math.floor(c.hopper2.y)},${Math.floor(c.hopper2.z)}`, type:"H2H_TRACKED", dimensionId:c.dimensionId, hopper1:normalizeLocation(c.hopper1), hopper2:normalizeLocation(c.hopper2), components:getNearbyDupeComponents(normalizeLocation(c.hopper1), world.getDimension(c.dimensionId)), detectedAt:c.timestamp };
        addPersistentDuperMachine(m); machines.push(m);
    }
    for (const [, z] of pistonPushedH2HZones) {
        const m = { id: `PISTON_ZONE:${z.dimensionId}:${Math.floor(z.hopper1.x)},${Math.floor(z.hopper1.y)},${Math.floor(z.hopper1.z)}:${Math.floor(z.hopper2.x)},${Math.floor(z.hopper2.y)},${Math.floor(z.hopper2.z)}`, type:"PISTON_ZONE", dimensionId:z.dimensionId, hopper1:normalizeLocation(z.hopper1), hopper2:normalizeLocation(z.hopper2), components:getNearbyDupeComponents(normalizeLocation(z.hopper1), world.getDimension(z.dimensionId)), detectedAt:z.timestamp };
        addPersistentDuperMachine(m); machines.push(m);
    }
    return machines;
}
const REVIVAL_EXPIRY_MS = 20 * 60 * 1000; 
const REVIVABLE_ENTITIES = new Set([
    "minecraft:cat","minecraft:dog","minecraft:wolf",
    "minecraft:horse","minecraft:donkey","minecraft:mule",
    "minecraft:llama","minecraft:parrot",
    "minecraft:villager","minecraft:zombie_villager"
]);
let _revivalCache = null; 
function _loadRevivalsFromStorage() {
    if (_revivalCache !== null) return; 
    try {
        const raw = world.getDynamicProperty(REVIVAL_PROPERTY);
        const all = raw ? JSON.parse(raw) : [];
        const now = Date.now();
        _revivalCache = all.filter(r => (now - r.deathTime) < REVIVAL_EXPIRY_MS);
    } catch (e) {
        console.warn(`[SAME] Revival load error: ${e}`);
        _revivalCache = [];
    }
}
function getRevivals() {
    _loadRevivalsFromStorage();
    const now = Date.now();
    _revivalCache = _revivalCache.filter(r => (now - r.deathTime) < REVIVAL_EXPIRY_MS);
    return _revivalCache;
}
function saveRevivals(list) {
    _revivalCache = list;
    try { world.setDynamicProperty(REVIVAL_PROPERTY, JSON.stringify(list)); }
    catch (e) { console.warn(`[SAME] Revival save error: ${e}`); }
}
function addRevivalEntry(entity) {
    const revivals = getRevivals();
    let ownerId = null;
    try { ownerId = entity.getComponent("tameable")?.tamedToPlayerId ?? null; } catch (_) {}
    let variant = 0;
    try { variant = entity.getComponent("variant")?.value ?? 0; } catch (_) {}
    revivals.push({
        id:          `rv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        typeId:      entity.typeId,
        name:        entity.nameTag || "Unnamed",
        location:    { x: Math.floor(entity.location.x), y: Math.floor(entity.location.y), z: Math.floor(entity.location.z) },
        dimensionId: entity.dimension.id,
        deathTime:   Date.now(),
        expiresAt:   Date.now() + REVIVAL_EXPIRY_MS,
        ownerId,
        variant,
    });
    saveRevivals(revivals);
    console.warn(`[SAME] Revival queued: ${entity.typeId} "${entity.nameTag}" at ${Math.floor(entity.location.x)},${Math.floor(entity.location.y)},${Math.floor(entity.location.z)}`);
}
function removeRevival(revivalId) {
    saveRevivals(getRevivals().filter(r => r.id !== revivalId));
}
function reviveEntity(data, dimension) {
    try {
        const loc  = { x: data.location.x + 0.5, y: data.location.y, z: data.location.z + 0.5 };
        const ent  = dimension.spawnEntity(data.typeId, loc);
        if (data.name && data.name !== "Unnamed") ent.nameTag = data.name;
        if (data.ownerId) {
            try {
                const tc = ent.getComponent("tameable");
                if (tc) tc.tamedToPlayerId = data.ownerId;
            } catch (_) {}
        }
        if (data.variant) {
            try { const vc = ent.getComponent("variant"); if (vc) vc.value = data.variant; } catch (_) {}
        }
        dimension.spawnParticle("minecraft:totem_particle", loc);
        dimension.playSound("random.totem", loc, { volume: 1.0, pitch: 1.0 });
        return ent;
    } catch (e) { console.warn(`[SAME] Revival failed: ${e}`); return null; }
}
world.afterEvents.entityDie.subscribe((event) => {
    const entity = event.deadEntity;
    if (!REVIVABLE_ENTITIES.has(entity.typeId)) return;
    let isTamed = false;
    try { isTamed = entity.getComponent("tameable")?.tamedToPlayerId != null; } catch (_) {}
    const isVillager = entity.typeId === "minecraft:villager" || entity.typeId === "minecraft:zombie_villager";
    if (isTamed || isVillager) {
        system.run(() => { addRevivalEntry(entity); });
    }
});
system.runInterval(() => {
    const before = (_revivalCache ?? []).length;
    getRevivals(); 
    if (_revivalCache && _revivalCache.length !== before) {
        saveRevivals(_revivalCache);
        console.warn(`[SAME] Pruned ${before - _revivalCache.length} expired revival(s)`);
    }
}, 6000);
async function showRevivalMenu(player) {
    const revivals = getRevivals();
    if (revivals.length === 0) {
        const f = new MessageFormData().title("§aNo Revivals Available")
            .body("§7No dead animals or villagers are available for revival.\n\n§8Revivals expire after 20 minutes.")
            .button1("§aBack to Menu").button2("§cClose");
        const r = await f.show(player);
        if (!r.canceled && r.selection === 0) await showAdminMenu(player);
        return;
    }
    const now  = Date.now();
    const form = new ActionFormData().title("§a§lRevive Animals / Villagers")
        .body(`§7${revivals.length} revival(s) available. Click one to revive it now:\n\n` +
              revivals.map((r, i) => {
                  const mins = Math.ceil((r.expiresAt - now) / 60000);
                  return `§a${i+1}. §f${r.typeId.replace("minecraft:","")} §7"${r.name}" §e(${mins}m left)`;
              }).join("\n"));
    for (const rev of revivals) {
        const etype = rev.typeId.replace("minecraft:","");
        const mins  = Math.ceil((rev.expiresAt - now) / 60000);
        form.button(`§a${etype}\n§7"${rev.name}" · §e${mins}m left`, "textures/items/totem");
    }
    form.button("§aBack to Menu", "textures/ui/arrow_left");
    const response = await form.show(player);
    if (response.canceled) return;
    if (response.selection === revivals.length) { await showAdminMenu(player); return; }
    const sel  = revivals[response.selection];
    const dim  = world.getDimension(sel.dimensionId);
    const ent  = reviveEntity(sel, dim);
    if (ent) {
        removeRevival(sel.id);
        const etype = sel.typeId.replace("minecraft:","");
        player.sendMessage(`§a[SAME]§r Revived ${etype} "${sel.name}" at ${sel.location.x},${sel.location.y},${sel.location.z}!`);
        player.playSound("random.levelup", { volume: 1.0, pitch: 1.0 });
        AdminAlert(`Admin ${player.name} revived ${sel.typeId} "${sel.name}"`, "low", "SAME", player.name);
    } else {
        player.sendMessage("§c[SAME]§r Revival failed — entity could not be spawned.");
    }
}
async function showPersistentDupersMenu(player) {
    const machines = getPersistentDuperMachines();
    if (machines.length === 0) {
        const f = new MessageFormData().title("§9Persistent Dupe Machines").body("§7No dupe machine entries recorded yet.").button1("§aBack to Menu").button2("§cClose");
        const r = await f.show(player);
        if (!r.canceled && r.selection === 0) await showAdminMenu(player);
        return;
    }
    const body = machines.map((m, i) =>
        `§c${i+1}. ${m.type} §7at ${m.hopper1.x},${m.hopper1.y},${m.hopper1.z} ↔ ${m.hopper2.x},${m.hopper2.y},${m.hopper2.z} §8[${m.dimensionId}]`
    ).join("\n");
    const f = new MessageFormData().title("§9Persistent Dupe Machines").body(body).button1("§aBack to Menu").button2("§cClose");
    const r = await f.show(player);
    if (!r.canceled && r.selection === 0) await showAdminMenu(player);
}
async function showScanWorldDupersMenu(player) {
    const machines = persistWorldDuperMachines();
    const f = new MessageFormData().title("§dWorld Dupe Machine Scan")
        .body(machines.length === 0 ? "§7No dupe machines found." : `§a${machines.length} machine(s) found and added to persistent list.`)
        .button1("§aBack to Menu").button2("§cClose");
    const r = await f.show(player);
    if (!r.canceled && r.selection === 0) await showAdminMenu(player);
}
async function showAdminMenu(player) {
    const form = new ActionFormData().title("§6§lSAME Admin Panel").body("§7Choose an option:")
        .button("§eDupe Options",                "textures/items/bundle")
        .button("§cList of Dupers",              "textures/items/book_writable")
        .button("§dScan World Dupe Machines",    "textures/items/feather")
        .button("§9Dupe Machines Recorded",      "textures/items/book_writable")
        .button("§bH2H Areas",                   "textures/blocks/hopper_inside")
        .button("§aRevive Animals/Villagers",    "textures/items/totem")
        .button("§7Give Book and Quill",         "textures/items/writable_book");
    const r = await form.show(player);
    if (r.canceled) return;
    const mythicmode = player.name === "MythicTension";
    switch (r.selection) {
        case 0: await showDupeOptionsMenu(player);        break;
        case 1: await showDupersMenu(player, mythicmode); break;
        case 2: await showScanWorldDupersMenu(player);    break;
        case 3: await showPersistentDupersMenu(player);   break;
        case 4: await showHTHAreasMenu(player);           break;
        case 5: await showRevivalMenu(player);            break;
        case 6: giveBookAndQuill(player);                 break;
    }
}
async function showDupeOptionsMenu(player) {
    const form = new ActionFormData().title("§eDupe Prevention Settings")
        .body(`§7Current Settings:\n\n` +
              `§fBundle Blocking:    ${getBundleBlockingSetting()  ? "§aENABLED"    : "§cDISABLED"}\n` +
              `§fInventory Sync:     ${getInventorySyncSetting()   ? "§aENABLED"    : "§cDISABLED"}\n` +
              `§fAnti-Crash Drop:    ${getCrashDropSetting()       ? "§aENABLED"    : "§cDISABLED"}\n` +
              `§fHopper-to-Hopper:  ${getHopperToHopperSetting()  ? "§aALLOWED"    : "§cNOT ALLOWED"}\n\n§7Choose a setting to toggle:`)
        .button(`§eBundle Blocking ${getBundleBlockingSetting()  ? "§c[DISABLE]" : "§a[ENABLE]"}`,   "textures/items/bundle")
        .button(`§eInventory Sync  ${getInventorySyncSetting()   ? "§c[DISABLE]" : "§a[ENABLE]"}`,   "textures/items/book_writable")
        .button(`§eAnti-Crash Drop ${getCrashDropSetting()       ? "§c[DISABLE]" : "§a[ENABLE]"}`,   "textures/items/ender_pearl")
        .button(`§eHopper-to-Hopper ${getHopperToHopperSetting() ? "§c[DISABLE]" : "§a[ENABLE]"}`,  "textures/blocks/hopper_inside")
        .button("§aBack to Menu", "textures/ui/arrow_left");
    const r = await form.show(player);
    if (r.canceled) return;
    if (r.selection === 4) { await showAdminMenu(player); return; }
    switch (r.selection) {
        case 0: setBundleBlockingSetting(!getBundleBlockingSetting());  player.sendMessage(`§a[SAME]§r Bundle Blocking: ${getBundleBlockingSetting()  ? "§aENABLED" : "§cDISABLED"}`); break;
        case 1: setInventorySyncSetting(!getInventorySyncSetting());    player.sendMessage(`§a[SAME]§r Inventory Sync: ${getInventorySyncSetting()   ? "§aENABLED" : "§cDISABLED"}`); break;
        case 2: setCrashDropSetting(!getCrashDropSetting());            player.sendMessage(`§a[SAME]§r Anti-Crash Drop: ${getCrashDropSetting()      ? "§aENABLED" : "§cDISABLED"}`); break;
        case 3: setHopperToHopperSetting(!getHopperToHopperSetting()); player.sendMessage(`§a[SAME]§r Hopper-to-Hopper: ${getHopperToHopperSetting() ? "§aALLOWED" : "§cNOT ALLOWED"}`); break;
    }
    await showDupeOptionsMenu(player);
}
async function showDupersMenu(player, mythicmode) {
    const dupers = mythicmode
        ? world.getPlayers().map(p => { const o = world.getDynamicProperty(`same_offences_${p.id}`) ?? 0; return { name: p.name, id: p.id, offences: o, location: p.location, dimension: p.dimension.id }; })
        : getDupersList();
    if (dupers.length === 0) {
        const f = new MessageFormData().title("§cNo Dupers Found").body("§7No players with dupe offences.").button1("§aBack to Menu").button2("§cClose");
        const r = await f.show(player);
        if (!r.canceled && r.selection === 0) await showAdminMenu(player);
        return;
    }
    const form = new ActionFormData().title(`§c${mythicmode ? "All Players" : "Dupers List"}`)
        .body(`§7${mythicmode ? "All players:" : `${dupers.length} duper(s):\n\n${dupers.map(d=>`§c${d.name}§7: ${d.offences} offences`).join('\n')}`}`);
    for (const d of dupers) form.button(`§c${d.name} (${d.offences})`, "textures/items/book_writable");
    form.button("§aBack to Menu", "textures/ui/arrow_left");
    const r = await form.show(player);
    if (r.canceled) return;
    if (r.selection === dupers.length) { await showAdminMenu(player); return; }
    await showDuperPranksMenu(player, dupers[r.selection], mythicmode);
}
async function showDuperPranksMenu(player, duper, mythicmode) {
    const form = new ActionFormData().title(`§cPranks: ${duper.name}`)
        .body(`§7Player: §c${duper.name}\n§7Offences: §c${duper.offences}\n§7Location: §e${Math.floor(duper.location.x)}, ${Math.floor(duper.location.y)}, ${Math.floor(duper.location.z)} (${duper.dimension})\n\n§7Choose an action:`)
        .button("§eLightning Strike",   "textures/blocks/command_block")
        .button("§cCreeper Explosion",  "textures/entity/creeper/creeper")
        .button("§4Send to Void / Kick","textures/blocks/barrier")
        .button("§aSend to Jail",       "textures/blocks/iron_bars")
        .button("§aTP to Player",       "textures/blocks/bedrock")
        .button("§aBack to Dupers List","textures/ui/arrow_left");
    const r = await form.show(player);
    if (r.canceled) return;
    if (r.selection === 5) { await showDupersMenu(player, mythicmode); return; }
    const target = world.getPlayers().find(p => p.name === duper.name);
    if (!target) { player.sendMessage("§c[SAME]§r Player not found online!"); return; }
    switch (r.selection) {
        case 0: 
            target.dimension.spawnEntity("minecraft:lightning_bolt", target.location);
            player.sendMessage(`§a[SAME]§r Struck §c${duper.name}§r with lightning!`);
            AdminAlert(`Admin ${player.name} struck ${duper.name} with lightning!`, "medium", "SAME", player.name);
            break;
        case 1: 
            target.dimension.createExplosion(target.location, 3, { breaksBlocks: false });
            player.sendMessage(`§a[SAME]§r Created explosion near §c${duper.name}§r!`);
            AdminAlert(`Admin ${player.name} created explosion near ${duper.name}!`, "medium", "SAME", player.name);
            break;
        case 2: 
            if (mythicmode) {
                target.kick("Unknown Error.");
                AdminAlert(`Admin ${player.name} kicked ${duper.name}!`, "high", "SAME", player.name);
            } else {
                target.teleport({ x: target.location.x, y: -100, z: target.location.z });
                player.sendMessage(`§a[SAME]§r Sent §c${duper.name}§r to the void!`);
                AdminAlert(`Admin ${player.name} sent ${duper.name} to the void!`, "high", "SAME", player.name);
            }
            break; 
        case 3: 
            target.teleport(JAIL_CORD);
            player.sendMessage(`§a[SAME]§r Sent §c${duper.name}§r to jail!`);
            AdminAlert(`Admin ${player.name} sent ${duper.name} to jail!`, "high", "SAME", player.name);
            break; 
        case 4: 
            if (target.id === player.id) { player.sendMessage("§c[SAME]§r Cannot teleport to yourself!"); return; }
            player.teleport(target.location);
            player.sendMessage(`§a[SAME]§r Teleported §c${duper.name}§r to your location!`);
            AdminAlert(`Admin ${player.name} teleported ${duper.name} to their location!`, "medium", "SAME", player.name);
            break;
    }
}
async function showHTHAreasMenu(player) {
    const areas = getHTHAreas();
    if (areas.length === 0) {
        const f = new MessageFormData().title("§bNo H2H Areas").body("§7No hopper-to-hopper configs detected.").button1("§aBack to Menu").button2("§cClose");
        const r = await f.show(player);
        if (!r.canceled && r.selection === 0) await showAdminMenu(player);
        return;
    }
    const form = new ActionFormData().title("§bH2H Areas")
        .body(`§7${areas.length} hopper-to-hopper area(s):\n\n${areas.map((a,i)=>`§b${i+1}. §7${Math.floor(a.pos1.x)},${Math.floor(a.pos1.y)},${Math.floor(a.pos1.z)} ↔ ${Math.floor(a.pos2.x)},${Math.floor(a.pos2.y)},${Math.floor(a.pos2.z)} (${a.dimension})${a.type?` [${a.type}]`:""}`).join("\n")}`);
    for (const a of areas) form.button(`§b${Math.floor(a.pos1.x)},${Math.floor(a.pos1.y)},${Math.floor(a.pos1.z)}`, "textures/blocks/hopper_inside");
    form.button("§aBack to Menu","textures/ui/arrow_left");
    const r = await form.show(player);
    if (r.canceled) return;
    if (r.selection === areas.length) { await showAdminMenu(player); return; }
    const sel = areas[r.selection];
    player.sendMessage(`§a[SAME]§r H2H Area: ${Math.floor(sel.pos1.x)},${Math.floor(sel.pos1.y)},${Math.floor(sel.pos1.z)} ↔ ${Math.floor(sel.pos2.x)},${Math.floor(sel.pos2.y)},${Math.floor(sel.pos2.z)} in ${sel.dimension}`);
}

world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    const { block, player } = event;
    if (block.typeId !== "minecraft:anvil" || !ADMINISTRATORS.includes(player.name)) return;
    system.runTimeout(() => {
        try {
            const main = player.getComponent("equippable")?.getEquipment("Mainhand");
            if (!main || main.typeId !== "minecraft:book") return;
            if (main.nameTag === ADMIN_BOOK_NAME) {
                player.getComponent("equippable").setEquipment("Mainhand", createAdminBook());
                player.sendMessage("§a[SAME]§r Admin book created!");
                player.playSound("note.pling", { volume: 1, pitch: 1.5 });
            } else if (main.nameTag === OM_BOOK_NAME) {
                player.getComponent("equippable").setEquipment("Mainhand", createOrbitalMarkerBook(null));
                player.sendMessage("§a[SAME/Orbital]§r Orbital Marker book created!");
                player.playSound("note.pling", { volume: 1, pitch: 1.8 });
            }
        } catch (e) { console.warn(`[SAME] Book creation error: ${e}`); }
    }, 1);
});
world.afterEvents.playerSpawn.subscribe((event) => {
    if (!getInventorySyncSetting()) return;
    const player = event.player;
    system.runTimeout(() => {
        try {
            if (typeof player.isValid === 'function' ? !player.isValid() : player.isValid === false) return;
            const savedStr = world.getDynamicProperty(`dp_inv_${player.id}`);
            if (!savedStr) return;
            const savedMap  = JSON.parse(savedStr);
            const currentMap = getPlayerInventoryMap(player);
            const container  = player.getComponent("inventory")?.container;
            if (!container) return;
            let detectedDupe = false;
            const dupeLog = [];
            for (const typeId in currentMap) {
                const cur = currentMap[typeId], sav = savedMap[typeId] ?? 0;
                if (cur <= sav) continue;
                detectedDupe = true;
                const diff = cur - sav;
                dupeLog.push({ typeId, currentCount: cur, savedCount: sav, diff });
                console.warn(`[SAME] Dupe | ${player.name} | ${typeId} | Has:${cur} Allowed:${sav} Removing:${diff}`);
                let rem = diff;
                for (let i = 0; i < container.size && rem > 0; i++) {
                    const it = container.getItem(i);
                    if (!it || it.typeId !== typeId) continue;
                    try {
                        if (it.amount > rem) { it.amount -= rem; container.setItem(i, it); rem = 0; }
                        else { rem -= it.amount; container.setItem(i, undefined); }
                    } catch (err) { console.warn(`[SAME] Slot ${i} error: ${err}`); }
                }
            }
            if (detectedDupe) {
                player.playSound("note.bass", { pitch: 0.5, volume: 1 });
                player.sendMessage("§4[SAME]§r §cIllegal items removed from your inventory.");
                const summary = dupeLog.map(d => `${d.typeId} (+${d.diff}, had ${d.currentCount}, allowed ${d.savedCount})`).join("\n");
                AdminAlert(`**${player.name}** triggered inventory dupe detection.\n\`\`\`\n${summary}\n\`\`\``, "high", "SINV", player.name);
                const offKey  = `same_offences_${player.id}`;
                const offences = (world.getDynamicProperty(offKey) ?? 0) + 1;
                world.setDynamicProperty(offKey, offences);
                if (offences >= 3) AdminAlert(`**${player.name}** has reached **${offences} offences**. Consider a ban.`, "critical", "SBAN", player.name);
            }
        } catch (e) { console.warn(`[SAME] Inv check error: ${e.stack || e}`); }
    }, 10);
});
const NATION_AREAS = {
    rescia: { name: "Rescia", minX: -201, maxX: 11, minZ: 1224, maxZ: 1527 }
};
const signStates               = new Map();
const chestStates              = new Map();
const containerOpenedByPlayer  = new Map();
const containerLastChecked     = new Map();
const MAX_CACHE_SIZE           = 1000;
const recentLogs               = [];
const MAX_LOGS                 = 100;
function addLogEntry(data) { recentLogs.unshift(data); if (recentLogs.length > MAX_LOGS) recentLogs.pop(); }
function manageCacheSize(cache) {
    if (cache.size <= MAX_CACHE_SIZE) return;
    let del = cache.size - MAX_CACHE_SIZE + 100;
    for (const [k] of cache) { if (del-- <= 0) break; cache.delete(k); }
}
function isSignBlock(block) {
    if (!block?.typeId) return false;
    return block.typeId.includes("sign");
}
function isContainerBlock(block) {
    if (!block?.typeId) return false;
    const t = block.typeId;
    return t.includes("chest") || t.includes("barrel") || t.includes("shulker_box") ||
           t === "minecraft:hopper" || t.includes("furnace") || t.includes("dispenser") || t.includes("dropper");
}
function getSignText(block) {
    try { return block.getComponent("minecraft:sign")?.getRawText?.() ?? []; } catch (e) { return []; }
}
function getContainerInventory(block) {
    try {
        const c = block.getComponent("minecraft:inventory")?.container;
        if (!c) return {};
        const inv = {};
        for (let i = 0; i < c.size; i++) {
            const it = c.getItem(i);
            if (it) { const k = `${it.typeId}:${it.nameTag ?? ""}`; inv[k] = (inv[k] ?? 0) + it.amount; }
        }
        return inv;
    } catch (e) { return {}; }
}
function getNationAtCoords(coords) {
    for (const [, n] of Object.entries(NATION_AREAS)) {
        if (coords.x >= n.minX && coords.x <= n.maxX && coords.z >= n.minZ && coords.z <= n.maxZ) return n.name;
    }
    return null;
}
function formatSignText(arr) {
    if (!Array.isArray(arr)) return "[BLANK]";
    return arr.map(l => l?.trim()).filter(Boolean).join(" | ") || "[BLANK]";
}
function formatInventoryItems(inv) {
    if (!inv || Object.keys(inv).length === 0) return "[NONE]";
    return Object.entries(inv).slice(0, 5).map(([k, c]) => `${k.split(":")[1]??k} x${c}`).join(", ");
}
function getBlockKey(coords) { return `${Math.floor(coords.x)},${Math.floor(coords.y)},${Math.floor(coords.z)}`; }
async function logSignAction(action, playerName, coords, beforeText, afterText) {
    const nation = getNationAtCoords(coords);
    addLogEntry({ type:"SIGN", action, player:playerName, coords:`${Math.floor(coords.x)}, ${Math.floor(coords.y)}, ${Math.floor(coords.z)}`, nation, beforeText, afterText, timestamp:new Date().toLocaleTimeString() });
    if (!nation) return;
    let msg = "";
    if (action === "CREATE")  msg = `Sign created in ${nation} by **${playerName}** at **${Math.floor(coords.x)}, ${Math.floor(coords.y)}, ${Math.floor(coords.z)}**\nText: \`${afterText}\``;
    if (action === "MODIFY")  msg = `Sign modified in ${nation} by **${playerName}** at **${Math.floor(coords.x)}, ${Math.floor(coords.y)}, ${Math.floor(coords.z)}**\nBefore: \`${beforeText}\`\nAfter: \`${afterText}\``;
    if (action === "DESTROY") msg = `Sign destroyed in ${nation} by **${playerName}** at **${Math.floor(coords.x)}, ${Math.floor(coords.y)}, ${Math.floor(coords.z)}**\nText was: \`${beforeText}\``;
    if (msg) await AdminAlert(msg, "medium", "SLOG", playerName);
}
async function logChestAction(action, playerName, coords, changes, before, after) {
    const nation = getNationAtCoords(coords);
    const itemsStr = formatInventoryItems(action === "LOOT" ? after : before);
    addLogEntry({ type:"CHEST", action, player:playerName, coords:`${Math.floor(coords.x)}, ${Math.floor(coords.y)}, ${Math.floor(coords.z)}`, nation, items:itemsStr, timestamp:new Date().toLocaleTimeString() });
    if (!nation) return;
    await AdminAlert(`Container ${action.toLowerCase()} in ${nation} by **${playerName}** at **${Math.floor(coords.x)}, ${Math.floor(coords.y)}, ${Math.floor(coords.z)}**\nItems: ${itemsStr}`, "medium", "SLOG", playerName);
}
world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const { block, player } = event;
    const key = getBlockKey(block.location);
    if (isSignBlock(block)) {
        system.runTimeout(() => {
            try {
                const txt = formatSignText(getSignText(block));
                signStates.set(key, txt); manageCacheSize(signStates);
                logSignAction("CREATE", player.name, block.location, "", txt);
            } catch (e) {}
        }, 1);
    }
    if (isContainerBlock(block)) { chestStates.set(key, getContainerInventory(block)); manageCacheSize(chestStates); }
});
world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    const { block, player } = event;
    const key = getBlockKey(block.location);
    if (isSignBlock(block)) {
        const old = signStates.get(key) ?? formatSignText(getSignText(block));
        signStates.set(key, old);
        system.runTimeout(() => {
            try { const nw = formatSignText(getSignText(block)); if (nw !== old) { logSignAction("MODIFY", player.name, block.location, old, nw); signStates.set(key, nw); } } catch (e) {}
        }, 5);
    }
    if (isContainerBlock(block)) {
        const inv = getContainerInventory(block);
        chestStates.set(key, inv);
        containerOpenedByPlayer.set(player.id, { blockKey: key, playerName: player.name, location: block.location, beforeInventory: { ...inv } });
        containerLastChecked.set(key, system.currentTick);
    }
});
world.afterEvents.playerLeave.subscribe((event) => {
    containerOpenedByPlayer.delete(event.player?.id ?? event.playerId);
});
system.runInterval(() => {
    const now = system.currentTick;
    const MIN_GAP = 80;
    for (const [pid, data] of containerOpenedByPlayer) {
        if (!data) continue;
        if (now - (containerLastChecked.get(data.blockKey) ?? 0) < MIN_GAP) continue;
        try {
            const block = world.getDimension("overworld").getBlock?.(data.location);
            if (!block) continue;
            const after  = getContainerInventory(block);
            const before = data.beforeInventory;
            const bk = Object.keys(before), ak = Object.keys(after);
            if (bk.length === ak.length && bk.every(k => before[k] === after[k])) {
                containerLastChecked.set(data.blockKey, now); continue;
            }
            const changes = [];
            let action = null;
            for (const [k, bc] of Object.entries(before)) { const ac = after[k]??0; if (ac < bc) { changes.push(`${k} -${bc-ac}`); action ??= "LOOT"; } }
            for (const [k, ac] of Object.entries(after))  { const bc = before[k]??0; if (ac > bc) { changes.push(`${k} +${ac-bc}`); action ??= "DEPOSIT"; } }
            if (changes.length > 0 && action) { logChestAction(action, data.playerName, data.location, changes.join(", "), before, after); data.beforeInventory = { ...after }; }
            containerLastChecked.set(data.blockKey, now);
        } catch (e) {}
    }
}, 80);
world.afterEvents.playerBreakBlock.subscribe((event) => {
    const key = getBlockKey(event.block.location);
    const tid  = event.brokenBlockPermutation.type.id;
    if (tid.includes("sign")) {
        try { const txt = signStates.get(key) ?? "[UNKNOWN]"; logSignAction("DESTROY", event.player.name, event.block.location, txt, ""); signStates.delete(key); } catch (e) {}
    }
    if (tid.includes("chest") || tid.includes("barrel")) {
        chestStates.delete(key);
        for (const [pid, d] of containerOpenedByPlayer) { if (d?.blockKey === key) containerOpenedByPlayer.delete(pid); }
    }
});
async function showLogsMenu(player) {
    if (recentLogs.length === 0) { player.sendMessage("§c[SLOG]§r No logs yet."); return; }
    const form = new ActionFormData().title("§b📋 Recent Logs").body(`§7${recentLogs.length} log(s). Click for details.\n`);
    for (const log of recentLogs) {
        const icon = log.type === "SIGN" ? "🔤" : "📦";
        const nat  = log.nation ? ` [${log.nation}]` : "";
        form.button(`${icon} ${log.type} ${log.action}${nat}\n§8${log.player} • ${log.coords}`);
    }
    const r = await form.show(player);
    if (!r.canceled && r.selection !== undefined) await showLogDetails(player, recentLogs[r.selection], r.selection);
}
async function showLogDetails(player, log, index) {
    let body = `§b[${log.type}] ${log.action}\n\n§7Player:§r ${log.player}\n§7Coordinates:§r ${log.coords}\n`;
    if (log.nation) body += `§7Nation:§r ${log.nation}\n`;
    body += `§7Timestamp:§r ${log.timestamp}\n\n`;
    if (log.type === "SIGN") {
        if (log.action === "CREATE")  body += `§7Text:§r ${log.afterText  || "[BLANK]"}\n`;
        if (log.action === "MODIFY")  body += `§7Before:§r ${log.beforeText || "[BLANK]"}\n§7After:§r ${log.afterText || "[BLANK]"}\n`;
        if (log.action === "DESTROY") body += `§7Text:§r ${log.beforeText || "[BLANK]"}\n`;
    } else if (log.type === "CHEST") {
        if (log.items) body += `§7Items:§r ${log.items}\n`;
    }
    const f = new MessageFormData().title(`§b${log.type} Details`).body(body).button1("§aBack to Logs").button2("§cClose");
    const r = await f.show(player);
    if (!r.canceled && r.selection === 0) await showLogsMenu(player);
}
function giveBookAndQuill(player) {
    const book = new ItemStack("minecraft:writable_book", 1);
    book.nameTag = "§b📖 Admin Book";
    const inv = player.getComponent("minecraft:inventory").container;
    inv.addItem(book);
    player.sendMessage("§a✓ Book and quill given!");
    player.dimension.playSound("random.pop", player.location, { volume: 1.0, pitch: 1.2 });
}
const MASTER_USER = "TaxCollector381";
const SLOTS = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
function hasAdminBook(player) {
    const inventory = player.getComponent("minecraft:inventory").container;
    for (let i = 0; i < inventory.size; i++) {
        const item = inventory.getItem(i);
        if (item?.typeId === "minecraft:written_book" || item?.typeId === "minecraft:writable_book" || item?.typeId === "minecraft:book") {
            if (item.nameTag === "SAME") return true;
        }
    }
    return false;
}
world.beforeEvents.chatSend.subscribe((eventData) => {
    const message = eventData.message.toUpperCase();
    const player = eventData.sender;
    const isMaster = player.name === MASTER_USER;
    if (!isMaster) return;
    const cheats = {
        STINGLIKEABEE: () => {
            player.addEffect("strength", 600, { amplifier: 255, showParticles: true });
            player.sendMessage("§6Cheat Activated: §rThe power of a bee!");
        },
        TURTLE: () => {
            const armorList = ["minecraft:netherite_helmet", "minecraft:netherite_chestplate", "minecraft:netherite_leggings", "minecraft:netherite_boots"];
            const equipment = player.getComponent("minecraft:equippable");
            armorList.forEach((itemId, index) => {
                const item = new ItemStack(itemId, 1);
                const enchantable = item.getComponent("minecraft:enchantable");
                const armorEnchants = [
                    { id: "protection", level: 4 },
                    { id: "thorns", level: 3 },
                    { id: "unbreaking", level: 3 },
                    { id: "mending", level: 1 } 
                ];
                armorEnchants.forEach(enc => {
                    const type = EnchantmentTypes.get(enc.id);
                    if (type) enchantable.addEnchantment({ type, level: enc.level });
                });
                equipment.setEquipment(SLOTS[index], item);
            });
            player.sendMessage("§a[Cheat] §fFull Turtle Armor equipped.");
        },
        FIGHT: () => {
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5;
                const spawnLoc = {
                    x: player.location.x + Math.cos(angle) * 5,
                    y: player.location.y,
                    z: player.location.z + Math.sin(angle) * 5
                };
                const golem = player.dimension.spawnEntity("minecraft:iron_golem", spawnLoc);
                golem.nameTag = "§cWANTED LEVEL";
            }
            player.sendMessage("§4[Cheat] §fWANTED! Iron Golem wave incoming!");
        },
        SKYFALL: () => {
            const elytra = new ItemStack("minecraft:elytra", 1);
            const enchantable = elytra.getComponent("minecraft:enchantable");
            const unbreaking = EnchantmentTypes.get("unbreaking");
            const mending = EnchantmentTypes.get("mending");
            if (unbreaking) enchantable.addEnchantment({ type: unbreaking, level: 3 });
            if (mending) enchantable.addEnchantment({ type: mending, level: 0 });
            player.getComponent("minecraft:inventory").container.addItem(elytra);
            player.sendMessage("§b[Cheat] §fWings received.");
        },
        MASTERY: () => {
            const inventory = player.getComponent("minecraft:inventory").container;
            for (let i = 0; i < inventory.size; i++) {
                const item = inventory.getItem(i);
                if (item?.hasComponent("minecraft:durability")) {
                    const durability = item.getComponent("minecraft:durability");
                    durability.damage = 0;
                    inventory.setItem(i, item);
                }
            }
            player.sendMessage("§6[Cheat] §fGear repaired.");
        },
        PAINKILLER: () => {
            player.addEffect("resistance", 1200, { amplifier: 4 });
            player.sendMessage("§d[Cheat] §fInvulnerability active.");
        },
        LETITRAIN: () => {
            for (let i = 0; i < 50; i++) {
                player.dimension.spawnEntity("minecraft:xp_orb", player.location);
            }
            player.sendMessage("§e[Cheat] §fXP Storm!");
        },
        HESOYAM: () => {
            player.addEffect("instant_health", 1, { amplifier: 255 });
            player.getComponent("minecraft:inventory").container.addItem(new ItemStack("minecraft:gold_block", 64));
            player.sendMessage("§g[Cheat] §fHealth & Riches.");
        },
        GOODBYECRUELWORLD: () => {
            player.kill();
            player.sendMessage("§4[Cheat] §fSuicide.");
        },
        CATCHME: () => {
            player.addEffect("speed", 3600, { amplifier: 9 });
            player.sendMessage("§b[Cheat] §fSonic speed!");
        },
        NIGHTSTICK: () => {
            const sword = new ItemStack("minecraft:netherite_sword", 1);
            const enchantable = sword.getComponent("minecraft:enchantable");
            const sharp = EnchantmentTypes.get("sharpness");
            const knock = EnchantmentTypes.get("knockback");
            if (sharp) enchantable.addEnchantment({ type: sharp, level: 5 });
            if (knock) enchantable.addEnchantment({ type: knock, level: 2 });
            player.getComponent("minecraft:inventory").container.addItem(sword);
            player.sendMessage("§7[Cheat] §fPolice Baton (Sword) received.");
        },
        FULLCLIP: () => {
            const bow = new ItemStack("minecraft:bow", 1);
            const enchantable = bow.getComponent("minecraft:enchantable");
            const infinity = EnchantmentTypes.get("infinity");
            if (infinity) enchantable.addEnchantment({ type: infinity, level: 1 });
            player.getComponent("minecraft:inventory").container.addItem(bow);
            player.getComponent("minecraft:inventory").container.addItem(new ItemStack("minecraft:arrow", 1));
            player.sendMessage("§r[Cheat] §fInfinite Ammo Bow.");
        },
        BUBBLECARS: () => {
            player.addEffect("levitation", 200, { amplifier: 1 });
            player.sendMessage("§f[Cheat] §fFloating away...");
        },
        AEZAKMI: () => {
            player.dimension.getEntities({ type: "minecraft:iron_golem" }).forEach(e => e.remove());
            player.sendMessage("§9[Cheat] §fWanted level cleared.");
        },
        NINJATOWN: () => {
            const sword = new ItemStack("minecraft:netherite_sword", 1);
            const enchantable = sword.getComponent("minecraft:enchantable");
            const fire = EnchantmentTypes.get("fire_aspect");
            if (fire) enchantable.addEnchantment({ type: fire, level: 2 });
            player.getComponent("minecraft:inventory").container.addItem(sword);
            player.addEffect("invisibility", 3600, { showParticles: false });
            player.sendMessage("§0[Cheat] §fNinja Mode Activated.");
        }
    };
    if (cheats[message]) {
        eventData.cancel = true;
        system.run(() => cheats[message]());
    }
});