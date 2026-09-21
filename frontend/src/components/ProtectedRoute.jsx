
import { Navigate } from "react-router-dom";
import { getToken } from "../utils/storage";

function ProtectedRoute({ children, role }) {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const storedUser = localStorage.getItem("payflow_user");

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem("payflow_user");
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check it
  if (role && user.role !== role) {
    if (user.role === "merchant") {
      return <Navigate to="/merchant-dashboard" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;

