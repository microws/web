import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, createContext, useState } from "react";
type Config = {
  components: Map<string, { time: string; hash: string }>;
  [key: string]: any;
};
export const MicrowsContext = createContext<{
  componentVersions: Config["components"];
}>(null);
export function MicrowsAppWrapper({
  children,
  queryClient,
  config,
}: {
  children: any;
  config: Config;
  queryClient?: QueryClient;
}) {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1_000 * 60 * 3,
        },
      },
    });
  }
  const [modules, setModules] = useState(config.components);
  return (
    <QueryClientProvider client={queryClient}>
      <MicrowsContext.Provider
        value={{
          componentVersions: modules,
        }}
      >
        <Suspense>{children}</Suspense>
      </MicrowsContext.Provider>
    </QueryClientProvider>
  );
}
