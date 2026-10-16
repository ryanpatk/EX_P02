import { createBrowserRouter, Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage.tsx";
import SignInPage from "../pages/auth/SignInPage.tsx";
import SignUpPage from "../pages/auth/SignUpPage.tsx";
import ProtectedPage from "../pages/ProtectedPage.tsx";
import StreamPage from "../pages/StreamPage.tsx";
import ProjectPage from "../pages/ProjectPage.tsx";
import StyleguidePage from "../pages/StyleguidePage.tsx";
import MocksPage from "../pages/MocksPage.tsx";
import NotFoundPage from "../pages/404Page.tsx";
import AuthProtectedRoute from "./AuthProtectedRoute.tsx";
import LegacyModuleRedirect from "./LegacyModuleRedirect.tsx";
import MemexShell from "../components/MemexShell.tsx";
import Providers from "../Providers.tsx";
import { HOME_PATH } from "../constants/modules.ts";

const router = createBrowserRouter([
  // I recommend you reflect the routes here in the pages folder
  {
    path: "/",
    element: <Providers />,
    children: [
      // Public routes
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/auth/sign-in",
        element: <SignInPage />,
      },
      {
        path: "/auth/sign-up",
        element: <SignUpPage />,
      },
      // Auth Protected routes
      {
        path: "/",
        element: <AuthProtectedRoute />,
        children: [
          // memex shell: sidebar (Home + spaces) around the mixed stream
          {
            element: <MemexShell />,
            children: [
              {
                path: HOME_PATH,
                element: <StreamPage />,
              },
              {
                path: "/spaces/:spaceId",
                element: <StreamPage />,
              },
            ],
          },
          // Former per-primitive module routes → Home with a type filter
          {
            path: "/links",
            element: <LegacyModuleRedirect type="link" />,
          },
          {
            path: "/notes",
            element: <LegacyModuleRedirect type="note" />,
          },
          {
            path: "/tasks",
            element: <LegacyModuleRedirect type="task" />,
          },
          {
            path: "/spaces",
            element: <LegacyModuleRedirect />,
          },
          // Design-system reference page — deliberately outside the shell
          // and not linked from in-app navigation
          {
            path: "/styleguide",
            element: <StyleguidePage />,
          },
          // Design mocks for choosing directions — unlinked, like /styleguide
          {
            path: "/mocks",
            element: <MocksPage />,
          },
          // Legacy dashboard URL (OAuth redirects still target it)
          {
            path: "/dashboard",
            element: <Navigate to={HOME_PATH} replace />,
          },
          {
            path: "/project/:projectId",
            element: <ProjectPage />,
          },
          {
            path: "/protected",
            element: <ProtectedPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
