import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import BaccaratAnalysis from "./pages/BaccaratAnalysis";
import RouletteAnalysis from "./pages/RouletteAnalysis";
import FootballAnalysis from "./pages/FootballAnalysis";
import PokerAnalysis from "./pages/PokerAnalysis";
import Lottery from "./pages/Lottery";
import WalletAddresses from "./pages/WalletAddresses";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import UserCenter from "./pages/UserCenter";
import Shop from "./pages/Shop";
import AdminDashboard from "./pages/AdminDashboard";
import Register from "./pages/Register";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
       <Route path="/baccarat" component={BaccaratAnalysis} />
      <Route path="/roulette" component={RouletteAnalysis} />
      <Route path="/football" component={FootballAnalysis} />
      <Route path="/poker" component={PokerAnalysis} />
        <Route path="/lottery" component={Lottery} />
        <Route path="/deposit" component={Deposit} />
        <Route path="/withdraw" component={Withdraw} />
        <Route path="/wallet-addresses" component={WalletAddresses} />
      <Route path="/register" component={Register} />
      <Route path="/user-center" component={UserCenter} />
      <Route path="/shop" component={Shop} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path={"/404"} component={NotFound} />      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
