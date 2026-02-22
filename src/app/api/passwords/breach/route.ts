import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getAuthUserFromRequest, unauthorizedResponse } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) return unauthorizedResponse();

    const body = (await request.json()) as { password?: string };
    const password = body.password ?? "";

    if (!password) {
      return NextResponse.json({ message: "Password is required" }, { status: 400 });
    }

    const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ message: "Breach service unavailable" }, { status: 503 });
    }

    const data = await response.text();
    const lines = data.split("\n");
    const found = lines.find((line) => line.toUpperCase().startsWith(suffix));

    const count = found ? Number(found.split(":")[1]?.trim() ?? "0") : 0;

    return NextResponse.json({ breached: count > 0, count });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to check breach", error: (error as Error).message },
      { status: 500 },
    );
  }
}

