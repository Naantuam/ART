import { Routes, Route } from "react-router-dom";
import { StateProvider } from "./context/StateContext";
import LandingPage from "./pages/LandingPage";
import "./App.css";

function App() {
  return (
    <StateProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </StateProvider>
  );
}

export default App;
