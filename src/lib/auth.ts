import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function createAdminUser(email: string, password: string, name: string) {
  const hashedPassword = await hashPassword(password);
  return db.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: "ADMIN",
    },
  });
}

export async function createRegularUser(email: string, password: string, name: string, username?: string) {
  const hashedPassword = await hashPassword(password);
  return db.user.create({
    data: {
      email,
      name,
      username,
      password: hashedPassword,
      role: "USER",
    },
  });
}
