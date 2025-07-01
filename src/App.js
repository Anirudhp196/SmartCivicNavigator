import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import ProfileDashboardPage from './pages/ProfileDashboardPage';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
        <Route path="/profile" element={<ProfileDashboardPage />} />
        {/* Add more routes here as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
