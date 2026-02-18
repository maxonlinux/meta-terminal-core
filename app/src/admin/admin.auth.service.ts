import fs from "node:fs/promises";
import path from "node:path";

const PASSWORD_FILE = path.resolve(process.cwd(), "data", "password.hash");
const PASSWORD_DIR = path.dirname(PASSWORD_FILE);

export async function isPasswordSet(): Promise<boolean> {
  try {
    await fs.access(PASSWORD_FILE);
    return true;
  } catch {
    return false;
  }
}

export async function setPassword(raw: string) {
  const hash = await Bun.password.hash(raw);
  await fs.mkdir(PASSWORD_DIR, { recursive: true });
  await fs.writeFile(PASSWORD_FILE, hash, { mode: 0o600 });
}

export async function verifyPassword(raw: string): Promise<boolean> {
  const hash = await fs.readFile(PASSWORD_FILE, "utf-8");
  return Bun.password.verify(raw, hash);
}
