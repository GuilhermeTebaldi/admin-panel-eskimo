import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function parseJwtEnabled(t) {
  try {
    const part = (t.split(".")[1] || "");
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(json);
    const enabledClaim = String(
      payload.isEnabled || payload.IsEnabled || "true"
    ).toLowerCase();
    return enabledClaim !== "false";
  } catch {
    return true;
  }
}

export default function PrivateRoute({ children }) {
  const [tokenExists, setTokenExists] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      setTokenExists(!!token);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const enabled = tokenExists
    ? parseJwtEnabled(localStorage.getItem("token") || "")
    : false;

  if (!tokenExists || !enabled) {
    return <Navigate to="/" replace />;
  }

  return children;
}
