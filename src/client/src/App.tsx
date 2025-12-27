import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthService } from "@/services/auth.service";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import Logs from "@/pages/Logs";
import Licenses from "@/pages/Licenses";
import MainLayout from "@/layouts/MainLayout";
import type { JSX } from "react";
import { Toaster } from "@/components/ui/sonner"

function PrivateRoute({ children }: { children: JSX.Element }) {
  return AuthService.isAuthenticated() ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="logs" element={<Logs />} />
          <Route path="licenses" element={<Licenses />} />
            <Toaster richColors position="top-right" />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
