import { createBrowserRouter } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";

import Home from "./pages/Home";import Dashboard from "./pages/Dashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: <UserLayout />,
    children: [{ index: true, element: <Dashboard /> }],
  },
]);

export default router;
