import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import LandingPage from '@/pages/LandingPage';
import HowItWorksPage from '@/pages/HowItWorksPage';
import ReachOutPage from '@/pages/ReachOutPage';
import { StartPage } from '@/pages/StartPage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import AuthPage from '@/pages/AuthPage';
import AuthResetPage from '@/pages/AuthResetPage';
import NotFoundPage from '@/pages/NotFoundPage';
import WelcomePage from '@/pages/WelcomePage';
import ProjectsListPage from '@/features/project/pages/ProjectsListPage';
import InviteAcceptancePage from '@/features/project/pages/InviteAcceptancePage';
import { RequireAuth } from '@/features/project/components/RequireAuth';
import { ProjectLayout } from '@/features/project/components/ProjectLayout';
import {
  ProjectIndexRedirect,
  SimpleBreakEvenRoute,
  DetailedBreakEvenRoute,
  FitoutFinancingRoute,
  HoursOfOperationRoute,
  SalesBreakupRoute,
  ViabilityMenuBuilderRoute,
  LabourCostingRoute,
  LocationSuitabilityRoute,
  SalesPredictionsRoute,
  BusinessPlanningRoute,
  AIBusinessPlanRoute,
  BusinessPlanBuilderRoute,
} from '@/features/project/routes';

type LandingNavPage = 'home' | 'how-it-works' | 'websites' | 'reach-out';

function useLandingNav() {
  const navigate = useNavigate();
  const onLaunch = () => navigate('/start');
  const onViability = () => navigate('/start');
  const onNavigate = (page: LandingNavPage) => {
    switch (page) {
      case 'home':
        navigate('/');
        break;
      case 'how-it-works':
        navigate('/how-it-works');
        break;
      case 'reach-out':
        navigate('/reach-out');
        break;
      case 'websites':
        // Websites lives in mojo_business; viability has no /websites route.
        navigate('/');
        break;
    }
  };
  return { onLaunch, onViability, onNavigate };
}

function HowItWorksPageRoute() {
  const props = useLandingNav();
  return <HowItWorksPage {...props} />;
}

function ReachOutPageRoute() {
  const props = useLandingNav();
  return <ReachOutPage {...props} />;
}

function StartPageRoute() {
  const navigate = useNavigate();
  return (
    <StartPage
      onCreateAccount={() => navigate('/auth')}
      onSignIn={() => navigate('/auth')}
      onBack={() => navigate('/')}
    />
  );
}

export default function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <ToastProvider>
          <TooltipProvider>
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/how-it-works" element={<HowItWorksPageRoute />} />
                <Route path="/reach-out" element={<ReachOutPageRoute />} />
                <Route path="/start" element={<StartPageRoute />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/reset" element={<AuthResetPage />} />

                {/* Onboarding + invite acceptance (no auth-gate; auth checks happen inside) */}
                <Route
                  path="/welcome"
                  element={
                    <RequireAuth>
                      <WelcomePage />
                    </RequireAuth>
                  }
                />
                <Route path="/project/accept-invite" element={<InviteAcceptancePage />} />

                {/* Auth-gated: project list */}
                <Route
                  path="/projects"
                  element={
                    <RequireAuth>
                      <ProjectsListPage />
                    </RequireAuth>
                  }
                />

                {/* Auth-gated: project editor with 12 sub-routes */}
                <Route
                  path="/project/:id"
                  element={
                    <RequireAuth>
                      <ProjectLayout />
                    </RequireAuth>
                  }
                >
                  <Route index element={<ProjectIndexRedirect />} />
                  <Route path="break-even" element={<SimpleBreakEvenRoute />} />
                  <Route path="break-even/detailed" element={<DetailedBreakEvenRoute />} />
                  <Route path="financing" element={<FitoutFinancingRoute />} />
                  <Route path="hours" element={<HoursOfOperationRoute />} />
                  <Route path="sales" element={<SalesBreakupRoute />} />
                  <Route path="menu-builder" element={<ViabilityMenuBuilderRoute />} />
                  <Route path="labour" element={<LabourCostingRoute />} />
                  <Route path="location" element={<LocationSuitabilityRoute />} />
                  <Route path="predictions" element={<SalesPredictionsRoute />} />
                  <Route path="plan" element={<BusinessPlanningRoute />} />
                  <Route path="ai-plan" element={<AIBusinessPlanRoute />} />
                  <Route path="plan-builder" element={<BusinessPlanBuilderRoute />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
