import { WORKER_URL } from "./constants";

/** Server-side: Next.js API Route → Worker (no auth needed) */
export async function workerFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${WORKER_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
    },
  });
  return res;
}

/** Client-side: Browser → Next.js API (with Firebase ID Token) */
export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const { auth } = await import("./firebase");
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  return fetch(path, {
    ...init,
    headers: {
      ...init?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
