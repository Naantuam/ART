import { Routes, Route } from "react-router-dom";
import { StateProvider } from "./context/StateContext";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/AdminDashboard";
import ArtistProfile from "./pages/ArtistProfile";
import "./App.css";

function App() {
  return (
    <StateProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/manage-art-2026" element={<AdminDashboard />} />
        <Route path="/artist/:day" element={<ArtistProfile />} />
      </Routes>
    </StateProvider>
  );
}

export default App;
