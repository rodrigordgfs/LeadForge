import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import type { ClerkUserData } from "./user-sync";

export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function isAuthenticated(): Promise<boolean> {
  const { isAuthenticated } = await auth();
  return isAuthenticated;
}

export async function requireAuthUser(): Promise<User> {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

export function toClerkUserData(user: User): ClerkUserData {
  const primaryEmail = user.emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId,
  )?.emailAddress;

  if (!primaryEmail) {
    throw new Error("Usuário autenticado sem e-mail principal.");
  }

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username ||
    primaryEmail;

  return {
    id: user.id,
    name,
    email: primaryEmail,
    avatar: user.imageUrl,
  };
}
