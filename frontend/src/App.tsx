import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import type { Role } from "./lib/api";
import Layout from "./components/Layout";
import Login from "./pages/Login";

import Dashboard from "./pages/admin/Dashboard";
import Transfer from "./pages/admin/Transfer";
import Campaign from "./pages/admin/Campaign";
import Users from "./pages/admin/Users";
import Hospitals from "./pages/admin/Hospitals";

import RegisterPouch from "./pages/medical/RegisterPouch";
import Stock from "./pages/medical/Stock";
import Validity from "./pages/medical/Validity";
import Request from "./pages/medical/Request";

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
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { role, isAuthenticated } = useAuth();

  return (
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
      <Route path="/medical" element={<Protected roles={["PERSONNEL_MEDICAL"]}><RegisterPouch /></Protected>} />
      <Route path="/medical/stock" element={<Protected roles={["PERSONNEL_MEDICAL"]}><Stock /></Protected>} />
      <Route path="/medical/validity" element={<Protected roles={["PERSONNEL_MEDICAL"]}><Validity /></Protected>} />
      <Route path="/medical/request" element={<Protected roles={["PERSONNEL_MEDICAL"]}><Request /></Protected>} />

      {/* Donneur */}
      <Route path="/donor" element={<Protected roles={["DONNEUR"]}><Profile /></Protected>} />
      <Route path="/donor/points" element={<Protected roles={["DONNEUR"]}><CollectionPoints /></Protected>} />
      <Route path="/donor/appointments" element={<Protected roles={["DONNEUR"]}><Appointments /></Protected>} />
      <Route path="/donor/alerts" element={<Protected roles={["DONNEUR"]}><Alerts /></Protected>} />
      <Route path="/donor/history" element={<Protected roles={["DONNEUR"]}><History /></Protected>} />

      <Route path="*" element={<Navigate to={isAuthenticated && role ? HOME[role] : "/login"} replace />} />
    </Routes>
  );
}
