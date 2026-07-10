import { SignJWT, jwtVerify } from "jose";

export type SessionRole = "CUSTOMER" | "ADMIN";

export type AppSession = {
  userId: string;
  email: string;
  role: SessionRole;
  name: string;
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 24) {
    throw new Error("SESSION_SECRET must be set to at least 24 characters.");
  }
  return new TextEncoder().encode(value);
}

export async function signSessionToken(session: AppSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<AppSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      (payload.role !== "CUSTOMER" && payload.role !== "ADMIN")
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      name: payload.name
    };
  } catch {
    return null;
  }
}
