import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";
import Navbar from "./components/navbar";
import ProposalList from "./components/proposal-list";
import CreateProposal from "./components/create-proposal";
import ProposalDetails from "./components/proposal";
import Profile from "./components/profile";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navbar />,
    children: [
      { path: "/", element: <ProposalList /> },
      { path: "/create-proposal", element: <CreateProposal /> },
      { path: "/proposal/:id", element: <ProposalDetails /> },
      { path: "/profile", element: <Profile /> },
    ],
  },
]);


createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <RouterProvider router={router} />
    <Toaster
      position="bottom-center"
      toastOptions={{
        success: {
          style: {
            background: theme.palette.success.main,
          },
        },
        error: {
          style: {
            background: theme.palette.error.main,
            color: "#F5F5F5",
          },
        },
      }}
    />
  </ThemeProvider>
);
