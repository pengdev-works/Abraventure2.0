import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import LoadingScreen from './components/common/LoadingScreen';

// Layout Components
import Layout from './components/layout/Layout';
import RouteGuard from './components/layout/RouteGuard';

// Auth Pages
import Login from './pages/auth/Login';
import PortalLogin from './pages/auth/PortalLogin';
import Register from './pages/auth/Register';

// Explore Pages
import Home from './pages/explore/Home';
import Municipalities from './pages/explore/Municipalities';
import MunicipalityDetails from './pages/explore/MunicipalityDetails';
import InteractiveMap from './pages/explore/InteractiveMap';
import Events from './pages/explore/Events';
import TravelTips from './pages/explore/TravelTips';
import PhotoGallery from './pages/explore/PhotoGallery';
import ItineraryPlanner from './pages/explore/ItineraryPlanner';

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
        {showInitialLoader && (
          <LoadingScreen onFinish={() => setShowInitialLoader(false)} minDuration={1400} />
        )}
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/portal/login" element={<PortalLogin />} />
              <Route path="/register" element={<Register />} />
              <Route path="/municipalities" element={<Municipalities />} />
              <Route path="/municipalities/:id" element={<MunicipalityDetails />} />
              <Route path="/map" element={<InteractiveMap />} />
              <Route path="/events" element={<Events />} />
              <Route path="/travel-tips" element={<TravelTips />} />
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
            </Routes>
          </Layout>
        </BrowserRouter>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;
