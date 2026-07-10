/** Validated environment variables for the frontend. */
export const env = {
  API_URL: (import.meta as any).env?.VITE_API_URL || "/api/v1",
} as const;