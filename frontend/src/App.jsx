import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import RouteGuard from './components/RouteGuard';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Municipalities from './pages/Municipalities';
import MunicipalityDetails from './pages/MunicipalityDetails';
import ItineraryPlanner from './pages/ItineraryPlanner';
import ProvincialDashboard from './pages/ProvincialDashboard';
import MunicipalDashboard from './pages/MunicipalDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import GuideDashboard from './pages/GuideDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/municipalities" element={<Municipalities />} />
            <Route path="/municipalities/:id" element={<MunicipalityDetails />} />

            {/* Tourist Protected Routes */}
            <Route
              path="/itinerary"
              element={
                <RouteGuard allowedRoles={['TOURIST']}>
                  <ItineraryPlanner />
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
    </AuthProvider>
  );
}

export default App;
