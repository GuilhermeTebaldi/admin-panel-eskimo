import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const [tokenExists, setTokenExists] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      setTokenExists(!!token);
    }, 300); // verifica a cada 300ms se o token existe

    return () => clearInterval(interval);
  }, []);

  if (!tokenExists) {
    return <Navigate to="/" />;
  }

  return children;
}
