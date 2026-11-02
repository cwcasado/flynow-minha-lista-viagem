import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="section" style={{ textAlign: "center", padding: "2rem" }}>
        <p>Verificando sessão...</p>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
