import { promises as fs } from "fs";
import path from "path";

export type StoredUser = {
  id: string;
  email: string;
  affiliation: string;
  passwordHash: string;
  salt: string;
};

const dataDir = path.join(process.cwd(), "data");
const usersFile = path.join(dataDir, "users.json");

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(usersFile);
  } catch {
    await fs.writeFile(usersFile, JSON.stringify([]), "utf8");
  }
}

export async function readUsers(): Promise<StoredUser[]> {
  await ensureStore();
  const raw = await fs.readFile(usersFile, "utf8");
  try {
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

export async function writeUsers(users: StoredUser[]) {
  await ensureStore();
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), "utf8");
}
