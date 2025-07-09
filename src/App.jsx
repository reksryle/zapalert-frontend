import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import ResponderDashboard from "./pages/responder/ResponderDashboard";
import ResidentDashboard from "./pages/resident/ResidentDashboard";



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/responder" element={<ResponderDashboard />} />
        <Route path="/resident" element={<ResidentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
