import UserNavbar from "../components/UserNavbar";
import { Outlet } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";

export default function UserLayout() {
  return (
    <ProtectedRoute role="user">
      <>
        <UserNavbar />
        <Outlet />
      </>
    </ProtectedRoute>
  );
}
