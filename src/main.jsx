import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@/theme/index.css";
import App from "@/App.jsx";
import { LoadingProvider } from "@/provider/loadingProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "mapbox-gl/dist/mapbox-gl.css";
import "mapbox-gl-compare/dist/mapbox-gl-compare.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "react-toastify/dist/ReactToastify.css";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <LoadingProvider>
        <TooltipProvider delayDuration={100}>
          <App />
        </TooltipProvider>
      </LoadingProvider>
    </BrowserRouter>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
);
