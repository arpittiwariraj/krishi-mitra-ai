import { Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DiseaseDetection from "./pages/DiseaseDetection";
import WeatherAdvisory from "./pages/WeatherAdvisory";
import MarketAnalysis from "./pages/MarketAnalysis";
import GovernmentSchemes from "./pages/GovernmentSchemes";
import GovernmentSchemeDetails from "./pages/GovernmentSchemeDetails";
import FarmerProfile from "./pages/FarmerProfile";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/disease" element={<DiseaseDetection />} />
        <Route path="/weather" element={<WeatherAdvisory />} />
        <Route path="/market" element={<MarketAnalysis />} />
        <Route path="/schemes" element={<GovernmentSchemes />} />
        <Route path="/schemes/:schemeId" element={<GovernmentSchemeDetails />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <FarmerProfile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
