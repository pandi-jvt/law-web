import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from 'components/ProtectedRoute';
import { Cases } from 'pages/Cases';
import { CaseDetail } from 'pages/CaseDetail';
import { Client } from 'pages/Client';
import { UserProfile } from 'pages/UserProfile';
import { AccountSettings } from 'pages/AccountSettings';
import { TaskPage } from 'pages/TaskPage';

// render - Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - color
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes: RouteObject = {
  path: '/',
  element: (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'typography',
      element: <Typography />
    },
    {
      path: 'color',
      element: <Color />
    },
    {
      path: 'shadow',
      element: <Shadow />
    },
    {
      path: 'sample-page',
      element: <SamplePage />
    },
    {
      path: 'cases',
      element: <Cases />
    },
    {
      path: 'cases/:caseId',
      element: <CaseDetail />
    },
    {
      path: 'client',
      element: <Client />
    },
    {
      path: 'task',
      element: <TaskPage />
    },
    {
      path: 'profile',
      element: <UserProfile />
    },
    {
      path: 'account-settings',
      element: <AccountSettings />
    }
  ]
};

export default MainRoutes;
