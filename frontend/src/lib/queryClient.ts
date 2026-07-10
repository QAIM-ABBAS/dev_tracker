import { QueryClient } from "@tanstack/react-query";

/** Global TanStack Query configuration. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});