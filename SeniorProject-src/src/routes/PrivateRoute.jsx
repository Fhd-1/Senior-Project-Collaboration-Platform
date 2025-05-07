import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/" replace />;

  return children;
}
