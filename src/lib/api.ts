const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
};

export const apiBaseUrl = getBaseUrl();

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${apiBaseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = typeof (data as { error?: string })?.error === "string"
      ? (data as { error: string }).error
      : `API error: ${res.status}`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
