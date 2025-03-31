import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import router from "./router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { HackathonProvider } from "./context/HackathonContext";
import { toastStyles } from "./utils/animations";

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
