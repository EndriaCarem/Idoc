import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Templates from "./pages/Templates";
import Historico from "./pages/Historico";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  const isTemplatesPage = location.pathname === '/templates';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {!isTemplatesPage && (
            <header className="border-b bg-background sticky top-0 z-50">
              <div className="px-6 py-4">
                <Header />
              </div>
            </header>
          )}
          <main className="flex-1 bg-gradient-to-br from-background via-background to-accent/5">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
