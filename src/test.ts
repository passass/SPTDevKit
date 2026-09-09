import { getValuesByPath, getValueByPath, setValueByPath } from "./utils/utils";

import fs from 'fs/promises';

console.log("load file");
const content = await fs.readFile(
    "E:\\EscapeFromTarkov\\SPT\\SPT_Data\\database\\locations\\lighthouse\\looseLoot.json",
    "utf-8"
);
