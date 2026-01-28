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
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import MobileBottomNav from "./components/MobileBottomNav";
import AnalysisPlaceholder from "./pages/AnalysisPlaceholder";
import StocksAAnalysis from "./pages/StocksAAnalysis";
import StocksHKAnalysis from "./pages/StocksHKAnalysis";
import StocksUSAnalysis from "./pages/StocksUSAnalysis";
import ForexAnalysis from "./pages/ForexAnalysis";
import CommoditiesGoldAnalysis from "./pages/CommoditiesGoldAnalysis";
import CommoditiesOilAnalysis from "./pages/CommoditiesOilAnalysis";
import CommoditiesAgAnalysis from "./pages/CommoditiesAgAnalysis";
import DerivativesFuturesAnalysis from "./pages/DerivativesFuturesAnalysis";
import DerivativesOptionsAnalysis from "./pages/DerivativesOptionsAnalysis";
import FixedIncomeBondsAnalysis from "./pages/FixedIncomeBondsAnalysis";
import FixedIncomePublicAnalysis from "./pages/FixedIncomePublicAnalysis";
import StockClientView from "./pages/StockClientView";
import QuantitativeTrading from "./pages/QuantitativeTrading";
import CryptoHistory from "./pages/CryptoHistory";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/baccarat" component={BaccaratAnalysis} />
        <Route path="/football" component={FootballAnalysis} />
        <Route path="/crypto" component={CryptoAnalysis} />
        <Route path="/quantitative-trading" component={QuantitativeTrading} />
        <Route path="/crypto-history" component={CryptoHistory} />
        <Route path="/crypto-analysis" component={CryptoAnalysis} />
        <Route path="/weekly-win" component={WeeklyWinAnalysis} />
        <Route path="/lottery" component={Lottery} />
        {/* 股票分析 */}
        <Route path="/stocks-a" component={StocksAAnalysis} />
        <Route path="/stocks-hk" component={StocksHKAnalysis} />
        <Route path="/stocks-us" component={StocksUSAnalysis} />
        {/* 客户端股票数据查看 */}
        <Route path="/stock-client-view" component={StockClientView} />
        {/* 外汇分析 */}
        <Route path="/forex" component={ForexAnalysis} />
        {/* \u5546\u54c1\u80fd\u6e90\u5206\u6790 */}
        <Route path="/commodities-gold" component={CommoditiesGoldAnalysis} />
        <Route path="/commodities-oil" component={CommoditiesOilAnalysis} />
        <Route path="/commodities-ag" component={CommoditiesAgAnalysis} />
        {/* \u8863\u751f\u54c1\u7c7b */}
        <Route path="/derivatives-futures" component={DerivativesFuturesAnalysis} />
        <Route path="/derivatives-options" component={DerivativesOptionsAnalysis} />
        {/* \u56fa\u5b9a\u6536\u76ca\u7c7b */}
        <Route path="/fixed-income-bonds" component={FixedIncomeBondsAnalysis} />
        <Route path="/fixed-income-public" component={FixedIncomePublicAnalysis} />
        <Route path="/fixed-income-private" component={() => <AnalysisPlaceholder title="\u79c1\u52df\u57fa\u91d1\u5206\u6790" description="\u79c1\u52df\u57fa\u91d1\u4e13\u4e1a\u5206\u6790\uff0c\u4e3a\u9ad8\u7aef\u6295\u8d44\u8005\u63d0\u4f9b\u5efa\u8bae" icon="\ud83d\udcb0" /> } />
        <Route path="/deposit" component={Deposit} />
        <Route path="/withdraw" component={Withdraw} />
        <Route path="/wallet-addresses" component={WalletAddresses} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/user-center" component={UserCenter} />
        <Route path="/shop" component={Shop} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/404" component={NotFound} />
        {/* Final fallback route */}
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
