export interface OAuthStateData {
  provider: string;
  teamId: string;
  userId: string;
  profileId: string;
  expiresAt: Date;
}

const oauthStates = new Map<string, OAuthStateData>();

setInterval(() => {
  const now = new Date();
  for (const [state, data] of oauthStates.entries()) {
    if (data.expiresAt < now) {
      oauthStates.delete(state);
    }
  }
}, 60000);

export function createOAuthState(
  state: string,
  data: Omit<OAuthStateData, "expiresAt"> & { ttlMs?: number }
): void {
  const { ttlMs = 10 * 60 * 1000, ...rest } = data;
  oauthStates.set(state, { ...rest, expiresAt: new Date(Date.now() + ttlMs) });
}

export function consumeOAuthState(state: string): OAuthStateData | undefined {
  const data = oauthStates.get(state);
  if (data) {
    oauthStates.delete(state);
  }
  return data;
}
