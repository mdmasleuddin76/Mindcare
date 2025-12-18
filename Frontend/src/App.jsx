// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";
import Auth from "./pages/Auth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminPanel from "./pages/AdminPanel"; // Import AdminPanel
import AdminUserChatView from "./pages/AdminUserChatView"; // Import AdminUserChatView

function App() {
  return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/Auth" element={<><Navbar/><Auth/><Footer/></>}/>
        <Route path="/chat" element={<><Navbar/><ChatPage /></>} />
        <Route path="/admin" element={<><Navbar/><AdminPanel /></>} /> 
        <Route path="/admin/user/:userId" element={<><Navbar/><AdminUserChatView/></>} />
      </Routes>
  );
}

export default App;
