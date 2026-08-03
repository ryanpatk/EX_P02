import { createBrowserRouter, Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage.tsx";
import SignInPage from "../pages/auth/SignInPage.tsx";
import SignUpPage from "../pages/auth/SignUpPage.tsx";
import ProtectedPage from "../pages/ProtectedPage.tsx";
import DashboardPage from "../pages/DashboardPage.tsx";
import NotesPage from "../pages/modules/NotesPage.tsx";
import TasksPage from "../pages/modules/TasksPage.tsx";
import SpacesPage from "../pages/modules/SpacesPage.tsx";
import ProjectPage from "../pages/ProjectPage.tsx";
import StyleguidePage from "../pages/StyleguidePage.tsx";
import NotFoundPage from "../pages/404Page.tsx";
import AuthProtectedRoute from "./AuthProtectedRoute.tsx";
import MemexShell from "../components/MemexShell.tsx";
import Providers from "../Providers.tsx";

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
          // memex module shell: sidebar + module layouts
          {
            element: <MemexShell />,
            children: [
              {
                path: "/links",
                element: <DashboardPage />,
              },
              {
                path: "/notes",
                element: <NotesPage />,
              },
              {
                path: "/tasks",
                element: <TasksPage />,
              },
              {
                path: "/spaces",
                element: <SpacesPage />,
              },
            ],
          },
          // Design-system reference page — deliberately outside the module
          // shell and not linked from in-app navigation
          {
            path: "/styleguide",
            element: <StyleguidePage />,
          },
          // Legacy dashboard URL (OAuth redirects still target it)
          {
            path: "/dashboard",
            element: <Navigate to="/links" replace />,
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
