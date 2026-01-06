import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import BaccaratAnalysis from "./pages/BaccaratAnalysis";
import CryptoAnalysis from "./pages/CryptoAnalysis";
import WeeklyWinAnalysis from "./pages/WeeklyWinAnalysis";
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
import ForgotPassword from "./pages/ForgotPassword";
import MobileBottomNav from "./components/MobileBottomNav";
import AnalysisPlaceholder from "./pages/AnalysisPlaceholder";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/baccarat" component={BaccaratAnalysis} />
        <Route path="/football" component={FootballAnalysis} />
        <Route path="/crypto" component={CryptoAnalysis} />
        <Route path="/weekly-win" component={WeeklyWinAnalysis} />
        <Route path="/lottery" component={Lottery} />
        {/* \u80a1\u7968\u5206\u6790 */}
        <Route path="/stocks-a" component={() => <AnalysisPlaceholder title="A\u80a1\u5206\u6790" description="\u6d41\u52a8\u6027\u6700\u5f3a\u7684\u4e2d\u56fd\u80a1\u7968\u5e02\u573a\uff0c\u63d0\u4f9b\u5b9e\u65f6\u6570\u636e\u5206\u6790\u548c\u6295\u8d44\u5efa\u8bae" icon="\ud83d\udcca" /> } />
        <Route path="/stocks-hk" component={() => <AnalysisPlaceholder title="\u6e2f\u80a1\u5206\u6790" description="\u9999\u6e2f\u80a1\u7968\u5e02\u573a\u6df1\u5ea6\u5206\u6790\uff0c\u8d2b\u5bcc\u80a1\u7968\u6295\u8d44\u6a5f\u4f1a" icon="\ud83d\udcca" /> } />
        <Route path="/stocks-us" component={() => <AnalysisPlaceholder title="\u7f8e\u80a1\u5206\u6790" description="\u7f8e\u56fd\u80a1\u7968\u5e02\u573a\u5168\u7403\u6295\u8d44\u6a5f\u4f1a\uff0c\u63d0\u4f9b\u4e30\u5bcc\u7684\u6295\u8d44\u9009\u62e9" icon="\ud83d\udcca" /> } />
        {/* \u5916\u6c47\u5206\u6790 */}
        <Route path="/forex" component={() => <AnalysisPlaceholder title="\u5916\u6c47\u4ea4\u6613\u5206\u6790" description="\u5168\u7403\u4e3b\u8981\u8d27\u5e01\u5bf9\u6bd4\uff0c\u63d0\u4f9b\u5b9e\u65f6\u6c47\u7387\u6570\u636e\u548c\u4ea4\u6613\u4fe1\u53f7" icon="\ud83d\udcb1" /> } />
        {/* \u5546\u54c1\u80fd\u6e90\u5206\u6790 */}
        <Route path="/commodities-gold" component={() => <AnalysisPlaceholder title="\u9ec3\u91d1\u767d\u9280\u5206\u6790" description="\u8d35\u91d1\u5c5e\u4f9b\u7ed9\u5206\u6790\uff0c\u63d0\u4f9b\u4fdd\u503c\u6295\u8d44\u5efa\u8bae" icon="\ud83e\udd8c" /> } />
        <Route path="/commodities-oil" component={() => <AnalysisPlaceholder title="\u539f\u6cb9\u5206\u6790" description="\u80fd\u6e90\u5e02\u573a\u4f9b\u9700\u5206\u6790\uff0c\u628a\u63e1\u80fd\u6e90\u6295\u8d44\u673a\u9047" icon="\u26fd" /> } />
        <Route path="/commodities-ag" component={() => <AnalysisPlaceholder title="\u8fb2\u7522\u54c1\u5206\u6790" description="\u519c\u4e1a\u5546\u54c1\u4f9b\u7ed9\u5206\u6790\uff0c\u628a\u63e1\u5b63\u8282\u6027\u6295\u8d44\u673a\u9047" icon="\ud83c\udf3e" /> } />
        {/* \u8863\u751f\u54c1\u7c7b */}
        <Route path="/derivatives-futures" component={() => <AnalysisPlaceholder title="\u671f\u8ca8\u5206\u6790" description="\u671f\u8ca8\u5e02\u573a\u4e13\u4e1a\u5206\u6790\uff0c\u4e3a\u60a8\u63d0\u4f9b\u6295\u8d44\u7b56\u7565" icon="\ud83d\udcca" /> } />
        <Route path="/derivatives-options" component={() => <AnalysisPlaceholder title="\u671f\u6b0a\u5206\u6790" description="\u671f\u6b0a\u5e02\u573a\u6df1\u5ea6\u5206\u6790\uff0c\u628a\u63e1\u4e0b\u884c\u6295\u8d44\u673a\u9047" icon="\ud83d\udcca" /> } />
        {/* \u56fa\u5b9a\u6536\u76ca\u7c7b */}
        <Route path="/fixed-income-bonds" component={() => <AnalysisPlaceholder title="\u50b5\u5238\u5206\u6790" description="\u56fa\u5b9a\u6536\u76ca\u4ea7\u54c1\u5206\u6790\uff0c\u63d0\u4f9b\u7a33\u5065\u6536\u76ca\u65b9\u6848" icon="\ud83d\udcb0" /> } />
        <Route path="/fixed-income-public" component={() => <AnalysisPlaceholder title="\u516c\u52df\u57fa\u91d1\u5206\u6790" description="\u516c\u52df\u57fa\u91d1\u6295\u8d44\u5206\u6790\uff0c\u628a\u63e1\u57fa\u91d1\u9009\u62e9\u673a\u9047" icon="\ud83d\udcb0" /> } />
        <Route path="/fixed-income-private" component={() => <AnalysisPlaceholder title="\u79c1\u52df\u57fa\u91d1\u5206\u6790" description="\u79c1\u52df\u57fa\u91d1\u4e13\u4e1a\u5206\u6790\uff0c\u4e3a\u9ad8\u7aef\u6295\u8d44\u8005\u63d0\u4f9b\u5efa\u8bae" icon="\ud83d\udcb0" /> } />
          <Route path="/deposit" component={Deposit} />
          <Route path="/withdraw" component={Withdraw} />
          <Route path="/wallet-addresses" component={WalletAddresses} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/user-center" component={UserCenter} />
        <Route path="/shop" component={Shop} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/404" component={NotFound} />      {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
      <MobileBottomNav />
    </>
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
