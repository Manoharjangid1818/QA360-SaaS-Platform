import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/sidebar";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import TestCasesPage from "@/pages/test-cases";
import BugsPage from "@/pages/bugs";
import AIGeneratorPage from "@/pages/ai-generator";
import SchedulesPage from "@/pages/schedules";
import CICDPage from "@/pages/ci-cd";
import ReportsPage from "@/pages/reports";
import PlaywrightPage from "@/pages/playwright-analyzer";
import CodegenPage from "@/pages/codegen";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard">
        {() => <DashboardLayout><DashboardPage /></DashboardLayout>}
      </Route>
      <Route path="/test-cases">
        {() => <DashboardLayout><TestCasesPage /></DashboardLayout>}
      </Route>
      <Route path="/bugs">
        {() => <DashboardLayout><BugsPage /></DashboardLayout>}
      </Route>
      <Route path="/ai-generator">
        {() => <DashboardLayout><AIGeneratorPage /></DashboardLayout>}
      </Route>
      <Route path="/schedules">
        {() => <DashboardLayout><SchedulesPage /></DashboardLayout>}
      </Route>
      <Route path="/ci-cd">
        {() => <DashboardLayout><CICDPage /></DashboardLayout>}
      </Route>
      <Route path="/reports">
        {() => <DashboardLayout><ReportsPage /></DashboardLayout>}
      </Route>
      <Route path="/playwright">
        {() => <DashboardLayout><PlaywrightPage /></DashboardLayout>}
      </Route>
      <Route path="/codegen">
        {() => <DashboardLayout><CodegenPage /></DashboardLayout>}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
