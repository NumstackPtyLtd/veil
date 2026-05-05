import { hash, verify } from "@node-rs/argon2";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import type { Db } from "../db/index.js";
import { schema } from "../db/index.js";

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface AuthResult {
  token: string;
  user: { id: string; email: string; name: string };
}

export class AuthService {
  private secret: Uint8Array;

  constructor(
    private db: Db,
    jwtSecret: string,
  ) {
    this.secret = new TextEncoder().encode(jwtSecret);
  }

  async signup(
    email: string,
    name: string,
    password: string,
  ): Promise<AuthResult> {
    const passwordHash = await hash(password);
    const [user] = await this.db
      .insert(schema.users)
      .values({ email, name, passwordHash })
      .returning();

    const token = await this.createToken(user.id, user.email);
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user) throw new Error("Invalid credentials");

    const valid = await verify(user.passwordHash, password);
    if (!valid) throw new Error("Invalid credentials");

    const token = await this.createToken(user.id, user.email);
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async verifyToken(token: string): Promise<AuthPayload> {
    const { payload } = await jwtVerify(token, this.secret);
    return { userId: payload.sub as string, email: payload.email as string };
  }

  private async createToken(userId: string, email: string): Promise<string> {
    return new SignJWT({ email })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(this.secret);
  }
}
