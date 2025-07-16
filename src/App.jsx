import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PendingUsers from "./pages/admin/PendingUsers";
import AllUsers from "./pages/admin/AllUsers";
import ReportsLog from "./pages/admin/ReportsLog";
import SystemSettings from "./pages/admin/SystemSettings";

import ResponderDashboard from "./pages/responder/ResponderDashboard";
import ResidentDashboard from "./pages/resident/ResidentDashboard";
import EmergencyList from "./pages/responder/EmergencyList";
import MapView from "./pages/responder/MapView";
import Notifications from "./pages/responder/NotificationsPanel";

import ProtectedRoute from "./components/ProtectedRoute"; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* ✅ ADMIN ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<PendingUsers />} />
        <Route path="pending-users" element={<PendingUsers />} />
        <Route path="all-users" element={<AllUsers />} />
        <Route path="reports-log" element={<ReportsLog />} />
        <Route path="system-settings" element={<SystemSettings />} />
      </Route>

      {/* ✅ RESPONDER */}
      <Route
        path="/responder"
        element={
          <ProtectedRoute allowedRole="responder">
            <ResponderDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/responder/emergencies"
        element={
          <ProtectedRoute allowedRole="responder">
            <EmergencyList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/responder/map"
        element={
          <ProtectedRoute allowedRole="responder">
            <MapView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/responder/notifications"
        element={
          <ProtectedRoute allowedRole="responder">
            <Notifications />
          </ProtectedRoute>
        }
      />

      {/* ✅ RESIDENT */}
      <Route
        path="/resident"
        element={
          <ProtectedRoute allowedRole="resident">
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
