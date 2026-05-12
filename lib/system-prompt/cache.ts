import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SYSTEM_PROMPT_PATH = path.join(DATA_DIR, "system-prompt.txt");

let cachedSystemPrompt = "";
let cacheLoaded = false;

async function loadSystemPrompt(): Promise<void> {
  if (cacheLoaded) return;

  try {
    cachedSystemPrompt = (await fs.readFile(SYSTEM_PROMPT_PATH, "utf8")).trim();
  } catch (err) {
    const code = err instanceof Error && "code" in err ? (err as NodeJS.ErrnoException).code : undefined;
    if (code !== "ENOENT") throw err;
    cachedSystemPrompt = "";
  }
  cacheLoaded = true;
}

export async function getSystemPrompt(): Promise<string> {
  await loadSystemPrompt();
  return cachedSystemPrompt;
}

export async function setSystemPrompt(value: string): Promise<string> {
  cachedSystemPrompt = value.trim();
  cacheLoaded = true;

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SYSTEM_PROMPT_PATH, cachedSystemPrompt, "utf8");

  return cachedSystemPrompt;
}
