import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { HomePage } from "./pages/HomePage";
import { ChatPage } from "./pages/ChatPage";
import { HistoryPage } from "./pages/HistoryPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminPage } from "./pages/AdminPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { OAuthCallbackPage } from "./components/auth/OAuthCallbackPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "chat", element: <ChatPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "favorites", element: <FavoritesPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "admin", element: <AdminPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "callback/:provider", element: <OAuthCallbackPage /> },
      { path: "auth/callback/:provider", element: <OAuthCallbackPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
