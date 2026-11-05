import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { WalletContextProvider } from "./app/contexts/wallet-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
  queryCache: new QueryCache({}),
});

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  // <React.StrictMode>
  <QueryClientProvider client={queryClient}>
    <SkeletonTheme baseColor="#424e5a" highlightColor="#7b838c">
      <HelmetProvider>
        <BrowserRouter>
          <WalletContextProvider>
            <App />
          </WalletContextProvider>
        </BrowserRouter>
      </HelmetProvider>
    </SkeletonTheme>
  </QueryClientProvider>,
  // </React.StrictMode>
);
