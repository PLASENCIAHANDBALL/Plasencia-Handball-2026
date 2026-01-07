import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Partidos from "./pages/Partidos";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/partidos" element={<Partidos />} />
      </Routes>
    </BrowserRouter>
  );
}
