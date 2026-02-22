import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "pm_session";

function getJwtSecret() {
  const value = process.env.JWT_SECRET;

  if (!value) {
    throw new Error("Missing JWT_SECRET environment variable.");
  }

  return new TextEncoder().encode(value);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string, email: string) {
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());

  return {
    userId: String(payload.sub),
    email: String(payload.email),
  };
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}
