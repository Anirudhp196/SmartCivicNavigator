import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import ProfileDashboardPage from './pages/ProfileDashboardPage';
import MapViewPage from './pages/MapViewPage'; // Import the new MapViewPage
import LayoutWithNavbar from './components/LayoutWithNavbar'; // Import the new LayoutWithNavbar


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route for the authentication page (no Navbar) */}
        <Route path="/" element={<AuthPage />} />

        {/* Routes that use the Navbar layout */}
        <Route element={<LayoutWithNavbar />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/map" element={<MapViewPage />} /> {/* New route for Map View */}
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/profile" element={<ProfileDashboardPage />} />
          {/* Add more routes here as needed that should have the Navbar */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
