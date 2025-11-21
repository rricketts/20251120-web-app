import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { Outlet, Navigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { ProtectedRoute } from 'src/routes/components';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

export const DashboardPage = lazy(() => import('src/pages/dashboard'));
export const KeywordsPage = lazy(() => import('src/pages/keywords'));
export const BacklinksPage = lazy(() => import('src/pages/backlinks'));
export const CompetitorsPage = lazy(() => import('src/pages/competitors'));
export const UserPage = lazy(() => import('src/pages/user'));
export const LoginPage = lazy(() => import('src/pages/login'));
export const ProjectsPage = lazy(() => import('src/pages/projects'));
export const IntegrationsPage = lazy(() => import('src/pages/integrations'));
export const GoogleSearchConsolePage = lazy(() => import('src/pages/integrations-google-search-console'));
export const ProfilePage = lazy(() => import('src/pages/profile'));
export const LogoutPage = lazy(() => import('src/pages/logout'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export const routesSection: RouteObject[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'keywords', element: <KeywordsPage /> },
      { path: 'backlinks', element: <BacklinksPage /> },
      { path: 'competitors', element: <CompetitorsPage /> },
      { path: 'user', element: <UserPage /> },
      { path: 'user/projects', element: <ProjectsPage /> },
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'integrations/google-search-console', element: <GoogleSearchConsolePage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    path: 'login',
    element: (
      <AuthLayout>
        <Suspense fallback={renderFallback()}>
          <LoginPage />
        </Suspense>
      </AuthLayout>
    ),
  },
  {
    path: 'logout',
    element: (
      <Suspense fallback={renderFallback()}>
        <LogoutPage />
      </Suspense>
    ),
  },
  { path: '404', element: <Suspense fallback={renderFallback()}><Page404 /></Suspense> },
  { path: '*', element: <Navigate to="/404" replace /> },
];
