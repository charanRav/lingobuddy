import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Story from "./pages/Story";
import Dashboard from "./pages/Dashboard";
import ChatBuddy from "./pages/ChatBuddy";
import TalkBuddy from "./pages/TalkBuddy";
import ListenBuddy from "./pages/ListenBuddy";
import ReadBuddy from "./pages/ReadBuddy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/story" element={<Story />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chatbuddy" element={<ChatBuddy />} />
          <Route path="/talkbuddy" element={<TalkBuddy />} />
          <Route path="/listenbuddy" element={<ListenBuddy />} />
          <Route path="/readbuddy" element={<ReadBuddy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
