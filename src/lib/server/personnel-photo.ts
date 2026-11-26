import "server-only";

import { unlink } from "node:fs/promises";
import path from "node:path";

import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { tblAccount } from "@/db/schema";

// Only photo files created by our upload route may be deleted.
// Never accept an arbitrary disk path or an external URL.
const PHOTO_URL =
  /^\/(?:person-yth\/)?uploads\/personnel\/([a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}\.(?:jpg|png|webp))$/i;

export function isManagedPersonnelPhoto(url: string): boolean {
  return PHOTO_URL.test(url);
}

export async function deleteUnusedPersonnelPhoto(
  url: string | null | undefined,
  excludedPersonId: number,
): Promise<void> {
  if (!url) return;
  const match = PHOTO_URL.exec(url);
  if (!match) return; // legacy/external photo: do not touch

  // Protect a photo that is still referenced by another personnel record.
  const [otherUser] = await db
    .select({ ac_id: tblAccount.ac_id })
    .from(tblAccount)
    .where(
      and(
        eq(tblAccount.img_profile, url),
        ne(tblAccount.ac_id, excludedPersonId),
      ),
    )
    .limit(1);
  if (otherUser) return;

  const filename = match[1];
  const folder = path.resolve(process.cwd(), "public", "uploads", "personnel");
  const target = path.resolve(folder, filename);
  if (path.dirname(target) !== folder) return;

  try {
    await unlink(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
