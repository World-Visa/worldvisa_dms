import { getClerkToken } from "./getToken";

interface NextFetchOptions {
  next?: {
    revalidate?: number;
  };
}

export async function fetcher<T>(
  url: string,
  options: RequestInit & NextFetchOptions = {},
): Promise<T> {
  const token = await getClerkToken();

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    // Don't set Content-Type for FormData — browser sets it with the multipart boundary
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const { next, ...fetchOptions } = options;

  const finalOptions: RequestInit & NextFetchOptions = {
    ...fetchOptions,
    headers,
  };

  if (next && typeof window === "undefined") {
    (finalOptions as NextFetchOptions).next = next;
  }

  const response = await fetch(url, finalOptions);

  if (!response.ok) {
    let errorData: { message?: string; error?: string } = {};
    try {
      const text = await response.text();
      if (text.trim()) {
        errorData = JSON.parse(text);
      }
    } catch {
      errorData = {};
    }

    throw new Error(
      errorData.message ||
        errorData.error ||
        `HTTP error! status: ${response.status}`,
    );
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return {} as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.warn("Failed to parse JSON response:", { text, parseError });
    return {} as T;
  }
}

/** Fetch wrapper for public endpoints (no token required) */
export async function publicFetcher<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorData: { message?: string; error?: string } = {};
    try {
      const text = await response.text();
      if (text.trim()) {
        errorData = JSON.parse(text);
      }
    } catch {
      errorData = {};
    }
    throw new Error(
      errorData.message ||
        errorData.error ||
        `HTTP error! status: ${response.status}`,
    );
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return {} as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.warn("Failed to parse JSON response:", { text, parseError });
    return {} as T;
  }
}
