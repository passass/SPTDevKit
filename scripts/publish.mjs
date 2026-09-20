import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

function loadEnv(path = ".env") {
    if (!existsSync(path)) return;
    const content = readFileSync(path, "utf-8");
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = value;
    }
}

loadEnv();

const rl = createInterface({ input, output });

function run(cmd, env = {}) {
    console.log(`\n$ ${cmd}`);
    execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

function readVersion() {
    const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
    return pkg.version;
}

function writeVersion(newVersion) {
    const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
    pkg.version = newVersion;
    writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n", "utf-8");
}

async function main() {
    const token = process.env.GH_TOKEN;
    if (!token) {
        console.error("❌ Не задан GH_TOKEN.\n" +
            "   Создай файл .env в корне проекта со строкой:\n" +
            "   GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx\n" +
            "   (токен со scope 'repo' создаётся на https://github.com/settings/tokens)");
        process.exit(1);
    }

    const current = readVersion();
    const version = (await rl.question(`Текущая версия: ${current}. Новая версия (Enter — оставить): `)).trim() || current;
    const releaseName = (await rl.question(`Название релиза (Enter — "${version}"): `)).trim() || `${version}`;
    const releaseNotes = (await rl.question("Описание релиза: ")).trim();

    rl.close();

    if (version !== current) {
        writeVersion(version);
        run(`git add package.json`);
        run(`git commit -m "chore: release v${version}"`);
    }

    const tag = `${version}`;
    run(`git tag ${tag}`);
    run(`git push`);
    run(`git push origin ${tag}`);
    writeFileSync("RELEASE_NOTES.md", releaseNotes, "utf-8");
    run(`npx electron-builder --publish always`, {
        GH_TOKEN: token,
    });

    console.log(`\n✅ Релиз ${tag} ("${releaseName}") опубликован.`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
