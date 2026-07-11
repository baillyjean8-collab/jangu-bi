import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Pages
import HomePage from './pages/home';
import CreatePostPage from './pages/create-post';
import CreateStoryPage from './pages/create-story';
import AnnouncementsPage from './pages/announcements';
import { ParishesPage } from './pages/parishes';
import ParishDetail from './pages/parishes/ParishDetail';
import CatechesePage from './pages/catechese';
import DemandesPage from './pages/demandes';
import LiveListPage from './pages/live';
import LiveScreen from './pages/live/LiveScreen';
import { LoginPage, RegisterPage, VerifyOtpPage } from './pages/auth';
import DonatePage from './pages/donate';
import ProfilePage from './pages/profile';
import BiblePage from './pages/bible';
import SplashPage from './pages/splash';
import NotificationsPage from './pages/notifications';
import SettingsPage from './pages/settings';
import MesDemandesPage from './pages/mes-demandes';
// Context
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLoginPage    from './pages/parish-admin/login';
import AdminDashboard    from './pages/parish-admin/dashboard';
import AdminPublications from './pages/parish-admin/publications';
import AdminDemandes     from './pages/parish-admin/demandes';
import AdminDons         from './pages/parish-admin/dons';
import AdminFideles      from './pages/parish-admin/fideles';
import AdminModeration   from './pages/parish-admin/moderation';
import AdminBranches     from './pages/parish-admin/branches';
import AdminLive         from './pages/parish-admin/live';
import AdminParoisse     from './pages/parish-admin/paroisse';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Pages publiques */}
            <Route path="/splash"       element={<SplashPage />} />
            <Route path="/login"        element={<LoginPage />} />
            <Route path="/register"     element={<RegisterPage />} />
            <Route path="/verify-otp"   element={<VerifyOtpPage />} />

            {/* Pages protégées */}
            <Route path="/"             element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/home"         element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/accueil"      element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/create"       element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
            <Route path="/create"       element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
            <Route path="/create-story" element={<ProtectedRoute><CreateStoryPage /></ProtectedRoute>} />
            <Route path="/parishes"     element={<ProtectedRoute><ParishesPage /></ProtectedRoute>} />
            <Route path="/parishes/:id" element={<ProtectedRoute><ParishDetail /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
            <Route path="/annonces"     element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
            <Route path="/live"         element={<ProtectedRoute><LiveListPage /></ProtectedRoute>} />
            <Route path="/live/:id"     element={<ProtectedRoute><LiveScreen /></ProtectedRoute>} />
            <Route path="/catechese"    element={<ProtectedRoute><CatechesePage /></ProtectedRoute>} />
            <Route path="/demandes"     element={<ProtectedRoute><DemandesPage /></ProtectedRoute>} />
            <Route path="/donate"       element={<ProtectedRoute><DonatePage /></ProtectedRoute>} />
            <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/bible"        element={<ProtectedRoute><BiblePage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/mes-demandes" element={<ProtectedRoute><MesDemandesPage /></ProtectedRoute>} />
          
            {/* ── Panel Admin Paroisse ── */}
            <Route path="/parish-admin/login"        element={<AdminLoginPage />} />
            <Route path="/parish-admin/dashboard"    element={<AdminDashboard />} />
            <Route path="/parish-admin/publications" element={<AdminPublications />} />
            <Route path="/parish-admin/demandes"     element={<AdminDemandes />} />
            <Route path="/parish-admin/dons"         element={<AdminDons />} />
            <Route path="/parish-admin/fideles"      element={<AdminFideles />} />
            <Route path="/parish-admin/moderation"   element={<AdminModeration />} />
            <Route path="/parish-admin/branches"     element={<AdminBranches />} />
            <Route path="/parish-admin/live"         element={<AdminLive />} />
            <Route path="/parish-admin/paroisse"     element={<AdminParoisse />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
