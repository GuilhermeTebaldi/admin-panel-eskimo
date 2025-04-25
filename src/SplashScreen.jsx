import React from "react";

export default function SplashScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(to bottom right, #e0f2f1, #f0fdf4)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      animation: "fadeIn 0.8s ease-in-out"
    }}>
      <h1 style={{ fontSize: "2.5rem", color: "#065f46", fontWeight: "bold" }}>
Volpesites
      </h1>
      <p style={{ fontSize: "1.2rem", color: "#065f46", marginTop: "1rem" }}>
        Carregando...
      </p>
    </div>
  );
}
