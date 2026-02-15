import { tokenStorage } from "./auth";

// Extend RequestInit to include Next.js specific options
// Note: cacheLife and cacheTag are now handled via "use cache" directive and cacheTag() function
// revalidate is still supported for backward compatibility
interface NextFetchOptions {
  next?: {
    revalidate?: number;
  };
}

// Generic fetch wrapper with automatic token attachment
export async function fetcher<T>(
  url: string,
  options: RequestInit & NextFetchOptions = {},
): Promise<T> {
  const token = tokenStorage.get();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;

    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user_data");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.role) {
            headers["X-User-Role"] = user.role;
          }
        } catch (error) {
          console.warn("Failed to parse user data from localStorage:", error);
        }
      }
    }
  }

  // Extract next config if provided (for server-side caching)
  const { next, ...fetchOptions } = options;

  // Merge headers and other options
  const finalOptions: RequestInit & NextFetchOptions = {
    ...fetchOptions,
    headers,
  };

  // Only add next config in server-side context (not in browser)
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

    // Handle authentication errors - only redirect if it's a clear auth failure
    if (response.status === 401 || response.status === 403) {
      if (token) {
        const isClientEndpoint = url.includes("/clients/");
        const isChecklistEndpoint = url.includes(
          "/visa_applications/checklist/",
        );
        const isMessagesEndpoint =
          url.includes("/requested_reviews/") && url.includes("/messages");

        if (
          isClientEndpoint ||
          isChecklistEndpoint ||
          url.includes("/comment") ||
          isMessagesEndpoint
        ) {
          // Let hook handle the error for client/checklist/comments/messages endpoints
        } else {
          // For other endpoints, redirect if authentication fails
          tokenStorage.remove();
          if (typeof window !== "undefined") {
            const userData = localStorage.getItem("user_data");
            let redirectPath = "/portal";

            if (userData) {
              try {
                const user = JSON.parse(userData);
                if (user.role === "client") {
                  redirectPath = "/client-login";
                } else if (
                  user.role === "admin" ||
                  user.role === "team_leader" ||
                  user.role === "master_admin"
                ) {
                  redirectPath = "/admin-login";
                }
              } catch (error) {
                console.warn("Failed to parse user data for redirect:", error);
              }
            }

            localStorage.removeItem("user_data");
            window.location.href = redirectPath;
          }
        }
      }
    }

    throw new Error(
      errorData.message ||
        errorData.error ||
        `HTTP error! status: ${response.status}`,
    );
  }

  // Handle empty responses (common for DELETE requests)
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

// Fetch wrapper for public endpoints (no token required)
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
      // If JSON parsing fails, use empty object
      errorData = {};
    }
    throw new Error(
      errorData.message ||
        errorData.error ||
        `HTTP error! status: ${response.status}`,
    );
  }

  // Handle empty responses (common for DELETE requests)
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
