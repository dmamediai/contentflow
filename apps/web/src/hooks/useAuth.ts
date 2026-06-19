"use client";

import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user ? {
    id: (session.user as any).id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  } : null;

  const accessToken = (session as any)?.accessToken;
  const teamId = (session as any)?.teamId;

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const signOut = async () => {
    await nextAuthSignOut({ redirect: true, callbackUrl: "/" });
  };

  return {
    user,
    accessToken,
    teamId,
    isLoading,
    isAuthenticated,
    signOut,
  };
}
