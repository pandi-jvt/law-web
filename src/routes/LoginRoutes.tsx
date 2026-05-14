import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

// project imports
import Loadable from 'components/Loadable';

// jwt auth
const LoginPage = Loadable(lazy(() => import('pages/auth/Login')));
const RegisterPage = Loadable(lazy(() => import('pages/auth/Register')));
const ForgotPasswordPage = Loadable(lazy(() => import('pages/auth/ForgotPassword')));

// ==============================|| AUTH ROUTING ||============================== //

const LoginRoutes: RouteObject = {
  path: '/',
  children: [
    {
      path: '/',
      children: [
        {
          path: '/login',
          element: <LoginPage />
        },
        {
          path: '/register',
          element: <RegisterPage />
        },
        {
          path: '/forgot-password',
          element: <ForgotPasswordPage />
        }
      ]
    }
  ]
};

export default LoginRoutes;
