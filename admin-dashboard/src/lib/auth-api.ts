export interface AuthApiResponse {
  success?: boolean;
  message?: string;
  data?: {
    resetToken?: string;
    [key: string]: unknown;
  };
  resetToken?: string;
  [key: string]: unknown;
}

export async function authRequest(
  path: string,
  body: Record<string, unknown>,
): Promise<AuthApiResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const response = await fetch(`${normalizedBaseUrl}${normalizedPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as AuthApiResponse;
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
}

export function mutationErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
