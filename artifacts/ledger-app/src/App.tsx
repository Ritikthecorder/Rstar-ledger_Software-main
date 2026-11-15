import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import EntryPage from "@/pages/EntryPage";
import CustomersPage from "@/pages/CustomersPage";
import CustomerDetailPage from "@/pages/CustomerDetailPage";
import TransactionsPage from "@/pages/TransactionsPage";
import LedgerPage from "@/pages/LedgerPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import RemindersPage from "@/pages/RemindersPage";
import InvitePage from "@/pages/InvitePage";
import BackupPage from "@/pages/BackupPage";
import AboutPage from "@/pages/AboutPage";
import AdminPage from "@/pages/AdminPage";
import PortalPage from "@/pages/PortalPage";
import NotFound from "@/pages/not-found";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { Skeleton } from "@/components/ui/skeleton";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  useOrganization();
  useRealtimeSync();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/entry" component={EntryPage} />
      <Route path="/customers" component={CustomersPage} />
      <Route path="/customers/:id" component={CustomerDetailPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/ledger" component={LedgerPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/reminders" component={RemindersPage} />
      <Route path="/backup" component={BackupPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/portal/:token" component={PortalPage} />
            <Route path="/invite/:token" component={InvitePage} />
            <Route>
              <AuthGate>
                <Router />
              </AuthGate>
            </Route>
          </Switch>
        </WouterRouter>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
