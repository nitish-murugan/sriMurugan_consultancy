import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import { Home } from './pages/home';
import { Login, Register, ForgotPassword, ResetPassword } from './pages/auth';
import { BookingWizard } from './pages/booking';
import { Dashboard } from './pages/dashboard';
import {
  AdminLayout,
  AdminDashboard,
  AdminBookings,
  AdminBuses,
  AdminCompanies,
  AdminCompanySuggestions,
  AdminSpots,
  AdminCities,
  AdminDrivers,
} from './pages/admin';

function App() {
  return (
    <Router>
      <AuthProvider>
        <BookingProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#1a202c',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                borderRadius: '8px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#28a745', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#dc3545', secondary: '#fff' },
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<><Navbar /><Home /></>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Booking Route - Can be accessed by guests too */}
            <Route
              path="/booking"
              element={
                <>
                  <Navbar />
                  <BookingWizard />
                </>
              }
            />

            {/* Protected User Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="buses" element={<AdminBuses />} />
              <Route path="companies" element={<AdminCompanies />} />
              <Route path="company-suggestions" element={<AdminCompanySuggestions />} />
              <Route path="spots" element={<AdminSpots />} />
              <Route path="cities" element={<AdminCities />} />
              <Route path="drivers" element={<AdminDrivers />} />
            </Route>
          </Routes>
        </BookingProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
