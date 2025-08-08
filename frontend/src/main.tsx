import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";
import Navbar from "../components/navbar";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navbar />,
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
