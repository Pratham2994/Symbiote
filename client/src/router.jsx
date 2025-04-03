import { createBrowserRouter } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Hackathons from "./pages/Hackathons";
import Hackathon from "./pages/Hackathon";
import Teams from "./pages/Teams";
import Friends from "./pages/Friends";
import Profile from "./pages/Profile";
import ErrorPage from "./pages/ErrorPage";
import Team from "./pages/Team";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: <UserLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "hackathons", element: <Hackathons /> },
      { path: "hackathons/:id", element: <Hackathon /> },
      { path: "teams", element: <Teams /> },
      { path: "teams/:teamId", element: <Team /> },
      { path: "friends", element: <Friends /> },
      { path: "profile", element: <Profile /> },
      { path: "profile/:userId", element: <Profile /> },
    ],
  },
  {
    path: "*",
    element: <ErrorPage />,
  },
]);

export default router;
