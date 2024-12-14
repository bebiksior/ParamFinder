import { SDK } from "caido:plugin";
import { readFile, rm, writeFile } from "fs/promises";
import path from "path";

/*
  Read a wordlist from a file and return a cleaned up array of strings
*/
export async function readWordlist(path: string) {
  const data = await readFile(path, { encoding: "utf-8" });
  return cleanupWordlist(data.split("\n"));
}

/*
  Deduplicate and remove empty lines from a wordlist
*/
function cleanupWordlist(wordlist: string[]) {
  const seen = new Set<string>();
  return wordlist.reduce((acc: string[], word) => {
    const trimmed = word.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      acc.push(trimmed);
    }
    return acc;
  }, []);
}

/* random string generator */
export function randomString(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/* ID generator */
export function generateID() {
  return Date.now().toString(36) + randomString(5);
}

/* Will write a file and return the path */
export async function writeToFile(sdk: SDK, data: string, filename: string) {
  if (!data || !filename) {
    throw new Error("Data and filename are required");
  }

  const sanitizedFilename = path.basename(filename);

  const dir = sdk.meta.path();
  if (!dir) {
    throw new Error("Could not get plugin directory");
  }

  let filePath = path.join(dir, sanitizedFilename);
  let index = 1;
  const maxAttempts = 100;

  while (index < maxAttempts) {
    try {
      await readFile(filePath);
      const ext = path.extname(sanitizedFilename);
      const base = path.basename(sanitizedFilename, ext);
      filePath = path.join(dir, `${base}-${index}${ext}`);
      index++;
    } catch (err) {
      break;
    }
  }

  if (index >= maxAttempts) {
    throw new Error("Could not find available filename after maximum attempts");
  }

  try {
    await writeFile(filePath, data);
    return filePath;
  } catch (err) {
    throw new Error(`Failed to write file: ${err}`);
  }
}

/* delete a file */
export async function deleteFile(sdk: SDK, path: string) {
  await rm(path);
}
