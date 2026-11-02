import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import ProtectedRoute from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Destinos from "./pages/Destinos";
import Desejos from "./pages/Desejos";
import NaoEncontrada from "./pages/NaoEncontrada";

export default function App() {
  return (
    <div className="app">
      <Header titulo="FlyNow" subtitulo="Minha Lista de Viagem" />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route index element={<Destinos />} />
          <Route path="desejos" element={<Desejos />} />
        </Route>
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </div>
  );
}
