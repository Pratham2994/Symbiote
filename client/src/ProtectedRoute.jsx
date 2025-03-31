import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log("ProtectedRoute: Current user:", user, "loading:", loading);
  }, [user, loading]);

  // While session check is in progress, show a loading indicator.
  if (loading) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }
  if (!user) {
    console.log("ProtectedRoute: No user found, redirecting to home.");
    return <Navigate to="/" />;
  }
  
  if (role && user.role !== role) {
    console.log("ProtectedRoute: User role mismatch. Expected:", role, "Got:", user.role);
    return <Navigate to="/" />;
  }

  return children;
}
