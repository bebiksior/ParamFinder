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
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
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

/* uint8array to string */
export function uint8ArrayToString(uint8Array: Uint8Array) {
  const chunks: string[] = [];
  const chunkSize = 65535;

  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
  }

  return chunks.join("");
}

/*
  Get the similarity between two strings
*/
export function getStringSimilarity(stringA: string, stringB: string): number {
  const n = stringA.length;
  const m = stringB.length;

  if (n === 0) return m === 0 ? 1 : 0;
  if (m === 0) return n === 0 ? 1 : 0;

  // Initialize the cost matrix with default values
  const cost: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0)
  );

  // Fill the first row and column with incremental values
  for (let i = 0; i <= n; i++) cost[i][0] = i;
  for (let j = 0; j <= m; j++) cost[0][j] = j;

  // Compute the edit distance
  for (let i = 1; i <= n; i++) {
    const charA = stringA.charAt(i - 1);
    for (let j = 1; j <= m; j++) {
      const charB = stringB.charAt(j - 1);
      if (charA === charB) {
        cost[i][j] = cost[i - 1][j - 1];
      } else {
        cost[i][j] =
          1 +
          Math.min(
            cost[i - 1]?.[j - 1] ?? Infinity, // Substitution
            cost[i]?.[j - 1] ?? Infinity, // Insertion
            cost[i - 1]?.[j] ?? Infinity // Deletion
          );
      }
    }
  }

  // Normalize to a similarity score between 0 and 1
  const maxLen = Math.max(n, m);
  const editDistance = cost[n][m] ?? Infinity;
  return 1 - editDistance / maxLen;
}
