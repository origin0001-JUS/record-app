import { WORKER_URL } from "./constants";

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
