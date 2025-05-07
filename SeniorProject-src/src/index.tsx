import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/authContext.js";
const rootElement = document.getElementById("root")!;
const root = ReactDOM.createRoot(rootElement);
import "./styles/global.css";

root.render(
  <AuthProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </AuthProvider>
);
