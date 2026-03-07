const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== "undefined") return ""; // same origin when API is proxied/rewritten
  return "http://localhost:3001";
};

export const apiBaseUrl = getBaseUrl();

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("pasc-auth-token");
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("pasc-admin-token");
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${apiBaseUrl}${path}`;
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...options,
    headers,
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

export async function apiAdminFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${apiBaseUrl}${path}`;
  const token = getAdminToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof (data as { error?: string })?.error === "string"
        ? (data as { error: string }).error
        : `API error: ${res.status}`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
