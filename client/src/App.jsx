import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import router from "./router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { HackathonProvider } from "./context/HackathonContext";
const toastStyles = `
  .Toastify__toast-icon svg {
    fill: #8B5CF6 !important;
  }
  .Toastify__toast--success .Toastify__toast-icon svg {
    fill: #8B5CF6 !important;
  }
  .Toastify__toast--error .Toastify__toast-icon svg {
    fill: #8B5CF6 !important;
  }
  .Toastify__progress-bar {
    background: #8B5CF6 !important;
  }
  .Toastify__progress-bar--success {
    background: #8B5CF6 !important;
  }
  .Toastify__progress-bar--error {
    background: #8B5CF6 !important;
  }
  .Toastify__toast {
    background: #0B0B0B !important;
    border: 1px solid rgba(139, 92, 246, 0.2) !important;
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.1) !important;
    color: #E5E7EB !important;
  }
  .Toastify__close-button {
    color: #8B5CF6 !important;
    opacity: 0.7;
  }
  .Toastify__close-button:hover {
    opacity: 1;
  }
`;

function App() {
  return (
    <AuthProvider>
      <HackathonProvider>
        <style>{toastStyles}</style>
        <RouterProvider router={router} />
        <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      </HackathonProvider>
    </AuthProvider>
  );
}

export default App;
