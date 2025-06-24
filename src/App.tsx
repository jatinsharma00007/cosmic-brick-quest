import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BrickMania from "./pages/BrickMania";
import Game from "./pages/Game";
import NotFound from "./pages/NotFound";
import ModeSelect from "./pages/ModeSelect";
import Challenge from "./pages/Challenge";
import ThrophyRoad from "./pages/ThrophyRoad";
import ChallengeEasy from "./pages/ChallengeEasy";
import ChallengeMedium from "./pages/ChallengeMedium";
import ChallengeHard from "./pages/ChallengeHard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/mode-select" element={<ModeSelect />} />
          <Route path="/brick-mania" element={<BrickMania />} />
          <Route path="/challenge" element={<Challenge />} />
          <Route path="/challenge-easy" element={<ChallengeEasy />} />
          <Route path="/challenge-medium" element={<ChallengeMedium />} />
          <Route path="/challenge-hard" element={<ChallengeHard />} />
          <Route path="/throphy-road" element={<ThrophyRoad />} />
          <Route path="/game" element={<Game />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
