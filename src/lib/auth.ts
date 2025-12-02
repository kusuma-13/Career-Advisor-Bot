import { auth as authConfig } from "./auth-config";
import { headers } from "next/headers";

export const auth = authConfig;

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

export { signIn, signOut } from "./auth-config";