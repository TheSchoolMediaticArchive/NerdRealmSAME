#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import zlib from "zlib";

function uint16LE(n) {
    const b = Buffer.alloc(2);
    b.writeUInt16LE(n);
    return b;
}

function uint32LE(n) {
    const b = Buffer.alloc(4);
    b.writeUInt32LE(n);
    return b;
}

function crc32(buf) {
    let crc = 0xFFFFFFFF;

    for (const byte of buf) {
        crc ^= byte;

        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
        }
    }

    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function buildZip(entries) {
    const localHeaders = [];
    const centralDirs = [];

    let offset = 0;

    for (const entry of entries) {
        const nameBytes = Buffer.from(entry.name, "utf8");

        const compressed = zlib.deflateRawSync(entry.data, {
            level: 6
        });

        const crc = crc32(entry.data);

        const uncompSize = entry.data.length;
        const compSize = compressed.length;

        const local = Buffer.concat([
            Buffer.from([0x50, 0x4B, 0x03, 0x04]),
            uint16LE(20),
            uint16LE(0),
            uint16LE(8),
            uint16LE(0),
            uint16LE(0),
            uint32LE(crc),
            uint32LE(compSize),
            uint32LE(uncompSize),
            uint16LE(nameBytes.length),
            uint16LE(0),
            nameBytes,
            compressed
        ]);

        localHeaders.push(local);

        const central = Buffer.concat([
            Buffer.from([0x50, 0x4B, 0x01, 0x02]),
            uint16LE(20),
            uint16LE(20),
            uint16LE(0),
            uint16LE(8),
            uint16LE(0),
            uint16LE(0),
            uint32LE(crc),
            uint32LE(compSize),
            uint32LE(uncompSize),
            uint16LE(nameBytes.length),
            uint16LE(0),
            uint16LE(0),
            uint16LE(0),
            uint16LE(0),
            uint32LE(0),
            uint32LE(offset),
            nameBytes
        ]);

        centralDirs.push(central);

        offset += local.length;
    }

    const centralStart = offset;
    const centralBuf = Buffer.concat(centralDirs);
    const centralSize = centralBuf.length;

    const eocd = Buffer.concat([
        Buffer.from([0x50, 0x4B, 0x05, 0x06]),
        uint16LE(0),
        uint16LE(0),
        uint16LE(entries.length),
        uint16LE(entries.length),
        uint32LE(centralSize),
        uint32LE(centralStart),
        uint16LE(0)
    ]);

    return Buffer.concat([
        ...localHeaders,
        centralBuf,
        eocd
    ]);
}

function bumpVersion(version) {
    let [major, minor, patch] = version;

    patch++;

    if (patch >= 100) {
        patch = 0;
        minor++;
    }

    if (minor >= 100) {
        minor = 0;
        major++;
    }

    return [major, minor, patch];
}

function collectDir(dir, baseInZip) {
    const entries = [];

    for (const item of fs.readdirSync(dir, {
        withFileTypes: true
    })) {
        const fullPath = path.join(dir, item.name);
        const zipPath = `${baseInZip}/${item.name}`;

        if (item.isDirectory()) {
            entries.push(...collectDir(fullPath, zipPath));
        } else {
            entries.push({
                name: zipPath,
                data: fs.readFileSync(fullPath)
            });
        }
    }

    return entries;
}

const args = process.argv.slice(2);

const noUuid = args.includes("--no-uuid");

const outIdx = args.indexOf("--out");
const dirIdx = args.indexOf("--dir");

const packRoot = dirIdx !== -1
    ? path.resolve(args[dirIdx + 1])
    : process.cwd();

let outName = outIdx !== -1
    ? args[outIdx + 1]
    : null;

const manifestPath = path.join(packRoot, "manifest.json");
const iconPath = path.join(packRoot, "pack_icon.png");
const scriptsDir = path.join(packRoot, "scripts");

console.log("\nSAME .mcpack Compiler");
console.log(`    Pack root : ${packRoot}\n`);

if (!fs.existsSync(manifestPath)) {
    console.error("❌ manifest.json not found");
    process.exit(1);
}

if (!fs.existsSync(scriptsDir)) {
    console.error("❌ scripts/ directory not found");
    process.exit(1);
}

let manifest;

try {
    manifest = JSON.parse(
        fs.readFileSync(manifestPath, "utf8")
    );
} catch (e) {
    console.error("❌ Failed to parse manifest.json");
    process.exit(1);
}

const oldVersion = manifest?.header?.version ?? [1, 0, 0];

const newVersion = bumpVersion(oldVersion);

manifest.header.version = newVersion;

if (Array.isArray(manifest.modules)) {
    for (const mod of manifest.modules) {
        if (Array.isArray(mod.version)) {
            mod.version = newVersion;
        }
    }
}

console.log(`Version bumped`);
console.log(`    Old: ${oldVersion.join(".")}`);
console.log(`    New: ${newVersion.join(".")}\n`);

if (!noUuid) {
    const oldHeaderUuid = manifest?.header?.uuid ?? "(none)";

    manifest.header.uuid = randomUUID();

    console.log("🔑 Header UUID");
    console.log(`    Old: ${oldHeaderUuid}`);
    console.log(`    New: ${manifest.header.uuid}`);

    if (Array.isArray(manifest.modules)) {
        manifest.modules.forEach((mod, i) => {
            const old = mod.uuid ?? "(none)";

            mod.uuid = randomUUID();

            console.log(`Module[${i}] UUID`);

            console.log(`    Old: ${old}`);
            console.log(`    New: ${mod.uuid}`);
        });
    }

    console.log("");
}

fs.writeFileSync(
    manifestPath,
    JSON.stringify(manifest, null, 4),
    "utf8"
);

console.log("✅ manifest.json updated\n");

const zipEntries = [];

zipEntries.push({
    name: "manifest.json",
    data: fs.readFileSync(manifestPath)
});

console.log("  + manifest.json");

if (fs.existsSync(iconPath)) {
    zipEntries.push({
        name: "pack_icon.png",
        data: fs.readFileSync(iconPath)
    });

    console.log("  + pack_icon.png");
}

const scriptFiles = collectDir(scriptsDir, "scripts");

for (const f of scriptFiles) {
    zipEntries.push(f);

    console.log(`  + ${f.name}`);
}

console.log(`\n  Total files: ${zipEntries.length}`);

const versionStr = newVersion.join(".");

if (!outName) {
    const packName = (
        manifest?.header?.name ?? "pack"
    ).replace(/\s+/g, "_");

    outName = `${packName}-${versionStr}.mcpack`;
}

if (!outName.endsWith(".mcpack")) {
    outName += ".mcpack";
}

const outPath = path.join(packRoot, outName);

console.log("\n🗜️ Building archive...");

const zipBuf = buildZip(zipEntries);

fs.writeFileSync(outPath, zipBuf);

const sizeKB = (zipBuf.length / 1024).toFixed(1);

console.log("\n✅ Done!");
console.log(`    Output : ${outPath}`);
console.log(`    Size   : ${sizeKB} KB`);
console.log(`    Files  : ${zipEntries.length}\n`);
