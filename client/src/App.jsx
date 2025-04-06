import { BrowserRouter as Router } from "react-router-dom";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { HackathonProvider } from "./context/HackathonContext";
import { TeamProvider } from "./context/TeamContext";
import { GroupChatProvider } from "./context/GroupChatContext";
import { toastStyles } from "./utils/animations";
import { scrollbarStyles } from "./utils/scrollbarStyles";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <HackathonProvider>
          <TeamProvider>
            <GroupChatProvider>
              <style>{toastStyles}</style>
              <style>{scrollbarStyles}</style>
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
                className="mt-7"
                toastClassName="!mt-7"
              />
            </GroupChatProvider>
          </TeamProvider>
        </HackathonProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
