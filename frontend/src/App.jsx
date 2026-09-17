import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import LoadingScreen from './components/common/LoadingScreen';

// Layout Components
import Layout from './components/layout/Layout';
import RouteGuard from './components/layout/RouteGuard';
import ScrollToTop from './components/common/ScrollToTop';

// Error & Fallback Pages
import NotFound from './pages/NotFound';

// Auth Pages
import Login from './pages/auth/Login';
import PortalLogin from './pages/auth/PortalLogin';
import Register from './pages/auth/Register';
import ProviderApply from './pages/auth/ProviderApply';

// Explore Pages
import Home from './pages/explore/Home';
import Municipalities from './pages/explore/Municipalities';
import MunicipalityDetails from './pages/explore/MunicipalityDetails';
import InteractiveMap from './pages/explore/InteractiveMap';
import Events from './pages/explore/Events';
import TravelTips from './pages/explore/TravelTips';
import PhotoGallery from './pages/explore/PhotoGallery';
import ItineraryPlanner from './pages/explore/ItineraryPlanner';
import Announcements from './pages/explore/Announcements';

// Dashboard Pages
import ProvincialDashboard from './pages/dashboards/ProvincialDashboard';
import MunicipalDashboard from './pages/dashboards/MunicipalDashboard';
import OwnerDashboard from './pages/dashboards/OwnerDashboard';
import GuideDashboard from './pages/dashboards/GuideDashboard';
import TouristDashboard from './pages/dashboards/TouristDashboard';

function App() {
  const [showInitialLoader, setShowInitialLoader] = useState(true);

  return (
    <AuthProvider>
      <AlertProvider>
        <ToastProvider>
          <SocketProvider>
          {showInitialLoader && (
            <LoadingScreen onFinish={() => setShowInitialLoader(false)} minDuration={1400} />
          )}
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/portal/login" element={<PortalLogin />} />
                <Route path="/register" element={<Register />} />
                <Route path="/apply/provider" element={<ProviderApply />} />
                <Route path="/municipalities" element={<Municipalities />} />
                <Route path="/municipalities/:id" element={<MunicipalityDetails />} />
                <Route path="/map" element={<InteractiveMap />} />
                <Route path="/events" element={<Events />} />
                <Route path="/travel-tips" element={<TravelTips />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/municipalities/:id/gallery" element={<PhotoGallery />} />

                {/* Tourist Protected Routes */}
                <Route
                  path="/itinerary"
                  element={
                    <RouteGuard allowedRoles={['TOURIST']}>
                      <ItineraryPlanner />
                    </RouteGuard>
                  }
                />
                <Route
                  path="/tourist-dashboard"
                  element={
                    <RouteGuard allowedRoles={['TOURIST']}>
                      <TouristDashboard />
                    </RouteGuard>
                  }
                />

                {/* Provincial DOT Protected Dashboard */}
                <Route
                  path="/provincial-dashboard"
                  element={
                    <RouteGuard allowedRoles={['PROVINCIAL_DOT']}>
                      <ProvincialDashboard />
                    </RouteGuard>
                  }
                />

                {/* Municipal DOT Protected Dashboard */}
                <Route
                  path="/municipal-dashboard"
                  element={
                    <RouteGuard allowedRoles={['MUNICIPAL_DOT']}>
                      <MunicipalDashboard />
                    </RouteGuard>
                  }
                />

                {/* Homestay Owner Protected Dashboard */}
                <Route
                  path="/owner-dashboard"
                  element={
                    <RouteGuard allowedRoles={['HOMESTAY_OWNER']}>
                      <OwnerDashboard />
                    </RouteGuard>
                  }
                />

                {/* Tour Guide Protected Dashboard */}
                <Route
                  path="/guide-dashboard"
                  element={
                    <RouteGuard allowedRoles={['TOUR_GUIDE']}>
                      <GuideDashboard />
                    </RouteGuard>
                  }
                />

                {/* Dedicated File Error & Catch-all 404 Page (Replaces blank pages) */}
                <Route path="/file-error" element={<NotFound isFileError={true} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
          </SocketProvider>
        </ToastProvider>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;
