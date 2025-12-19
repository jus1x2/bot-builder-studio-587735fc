import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TelegramProvider } from "@/contexts/TelegramContext";
import { useProjectSync } from "@/hooks/useProjectSync";
import Index from "./pages/Index";
import Builder from "./pages/Builder";
import Projects from "./pages/Projects";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Inner component that uses the sync hook
function AppContent() {
  // Initialize project sync with Telegram profile
  useProjectSync();

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/builder/:projectId" element={<Builder />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TelegramProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </TelegramProvider>
  </QueryClientProvider>
);

export default App;