import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AppShell } from './components/AppShell';
import { ProtectedRoute, AdminRoute } from './components/RouteWrappers';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import ControlPanel from './pages/ControlPanel';
import Applications from './pages/Applications';

import Landing from './pages/Landing';
import PrepHub from './pages/PrepHub';
import BlogPost from './pages/BlogPost';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

// Placeholders for routes not yet implemented
const Saved = () => <div className="p-4">Saved Resources (Coming soon)</div>;
const Settings = () => <div className="p-4">App Settings (Coming soon)</div>;

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/prep-hub" element={<PrepHub />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes inside AppShell */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/control-panel" element={<ControlPanel />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute><AppShell /></AdminRoute>}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
