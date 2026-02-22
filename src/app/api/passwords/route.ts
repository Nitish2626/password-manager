import { NextRequest, NextResponse } from "next/server";

import { getAuthUserFromRequest, unauthorizedResponse } from "@/lib/auth-server";
import { writeAuditLog } from "@/lib/audit";
import { decryptValue, encryptValue } from "@/lib/crypto";
import { connectToDatabase } from "@/lib/db/mongoose";
import { passwordEntrySchema } from "@/lib/validators/password-entry";
import { PasswordEntry } from "@/models/password-entry";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const docs = await PasswordEntry.find({ userId: authUser.userId })
      .sort({ updatedAt: -1 })
      .lean();

    const entries = docs.map((entry) => ({
      id: String(entry._id),
      username: entry.username,
      folder: entry.folder ?? "General",
      tags: entry.tags ?? [],
      lastRotatedAt: entry.lastRotatedAt,
      password:
        entry.encryptedPassword?.iv && entry.encryptedPassword?.authTag && entry.encryptedPassword?.cipherText
          ? decryptValue(entry.encryptedPassword)
          : "",
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load entries", error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const parsed = passwordEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const encryptedPassword = encryptValue(parsed.data.password);

    const doc = await PasswordEntry.create({
      userId: authUser.userId,
      username: parsed.data.username,
      folder: parsed.data.folder,
      tags: parsed.data.tags,
      lastRotatedAt: new Date(),
      encryptedPassword,
    });

    await writeAuditLog(request, {
      userId: authUser.userId,
      action: "credential.create",
      detail: `Created credential for ${doc.username}`,
    });

    return NextResponse.json(
      {
        entry: {
          id: String(doc._id),
          username: doc.username,
          folder: doc.folder,
          tags: doc.tags,
          lastRotatedAt: doc.lastRotatedAt,
          password: parsed.data.password,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create entry", error: (error as Error).message },
      { status: 500 },
    );
  }
}

