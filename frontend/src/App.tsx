import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import type { Role } from "./lib/api";
import Layout from "./components/Layout";
import DonorLayout from "./components/DonorLayout";
import { Spinner } from "./components/ui";
import Login from "./pages/Login";

// Dashboard isolé (recharts lourd) → chargé à la demande.
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
import Transfer from "./pages/admin/Transfer";
import Campaign from "./pages/admin/Campaign";
import Users from "./pages/admin/Users";
import Hospitals from "./pages/admin/Hospitals";

import MedicalDashboard from "./pages/medical/MedicalDashboard";
import RegisterPouch from "./pages/medical/RegisterPouch";
import Stock from "./pages/medical/Stock";
import Validity from "./pages/medical/Validity";
import Request from "./pages/medical/Request";

import Home from "./pages/donor/Home";
import Profile from "./pages/donor/Profile";
import CollectionPoints from "./pages/donor/CollectionPoints";
import Appointments from "./pages/donor/Appointments";
import Alerts from "./pages/donor/Alerts";
import History from "./pages/donor/History";

const HOME: Record<Role, string> = {
  ADMIN_CNTS: "/admin",
  PERSONNEL_MEDICAL: "/medical",
  DONNEUR: "/donor",
};

function Protected({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { role, isAuthenticated } = useAuth();
  if (!isAuthenticated || !role) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to={HOME[role]} replace />;
  const Shell = role === "DONNEUR" ? DonorLayout : Layout;
  return (
    <Shell>
      <Suspense fallback={<div className="flex justify-center py-20 text-slate-400"><Spinner size={28} /></div>}>
        {children}
      </Suspense>
    </Shell>
  );
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute cache par défaut
      retry: 1,
    },
  },
});

export default function App() {
  const { role, isAuthenticated } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated && role ? <Navigate to={HOME[role]} replace /> : <Login />}
        />

        {/* Admin CNTS */}
        <Route path="/admin" element={<Protected roles={["ADMIN_CNTS"]}><Dashboard /></Protected>} />
        <Route path="/admin/transfer" element={<Protected roles={["ADMIN_CNTS"]}><Transfer /></Protected>} />
        <Route path="/admin/campaign" element={<Protected roles={["ADMIN_CNTS"]}><Campaign /></Protected>} />
        <Route path="/admin/users" element={<Protected roles={["ADMIN_CNTS"]}><Users /></Protected>} />
        <Route path="/admin/hospitals" element={<Protected roles={["ADMIN_CNTS"]}><Hospitals /></Protected>} />

        {/* Personnel Médical */}
        <Route path="/medical" element={<Protected roles={["PERSONNEL_MEDICAL"]}><MedicalDashboard /></Protected>} />
        <Route path="/medical/register" element={<Protected roles={["PERSONNEL_MEDICAL"]}><RegisterPouch /></Protected>} />
        <Route path="/medical/stock" element={<Protected roles={["PERSONNEL_MEDICAL"]}><Stock /></Protected>} />
        <Route path="/medical/validity" element={<Protected roles={["PERSONNEL_MEDICAL"]}><Validity /></Protected>} />
        <Route path="/medical/request" element={<Protected roles={["PERSONNEL_MEDICAL"]}><Request /></Protected>} />

        {/* Donneur */}
        <Route path="/donor" element={<Protected roles={["DONNEUR"]}><Home /></Protected>} />
        <Route path="/donor/profile" element={<Protected roles={["DONNEUR"]}><Profile /></Protected>} />
        <Route path="/donor/points" element={<Protected roles={["DONNEUR"]}><CollectionPoints /></Protected>} />
        <Route path="/donor/appointments" element={<Protected roles={["DONNEUR"]}><Appointments /></Protected>} />
        <Route path="/donor/alerts" element={<Protected roles={["DONNEUR"]}><Alerts /></Protected>} />
        <Route path="/donor/history" element={<Protected roles={["DONNEUR"]}><History /></Protected>} />

        <Route path="*" element={<Navigate to={isAuthenticated && role ? HOME[role] : "/login"} replace />} />
      </Routes>
    </QueryClientProvider>
  );
}

