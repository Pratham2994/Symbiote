import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function UserNavbar() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  return (
    <nav className="flex items-center justify-between p-4">
      <div>
        <Link to="/dashboard" className="mr-4">Home</Link>
      </div>
      <div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-neon hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
