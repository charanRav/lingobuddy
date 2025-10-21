import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Story from "./pages/Story";
import Dashboard from "./pages/Dashboard";
import ChatBuddy from "./pages/ChatBuddy";
import TalkBuddy from "./pages/TalkBuddy";
import ListenBuddy from "./pages/ListenBuddy";
import ReadBuddy from "./pages/ReadBuddy";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import HealthCheck from "./pages/HealthCheck";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/story" element={<ProtectedRoute><Story /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/chatbuddy" element={<ProtectedRoute><ChatBuddy /></ProtectedRoute>} />
            <Route path="/talkbuddy" element={<ProtectedRoute><TalkBuddy /></ProtectedRoute>} />
            <Route path="/listenbuddy" element={<ProtectedRoute><ListenBuddy /></ProtectedRoute>} />
            <Route path="/readbuddy" element={<ProtectedRoute><ReadBuddy /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/health" element={<ProtectedRoute><HealthCheck /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
