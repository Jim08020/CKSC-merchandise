import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(120deg, #e0eafc 0%, #cfdef3 100%)",
        padding: "20px",
      }}
    >
      <h1 style={{
        fontSize: "2rem",
        fontWeight: "bold",
        marginBottom: "12px",
        color: "#232526",
        textAlign: "center"
      }}>
        後台管理
      </h1>

      <p style={{
        fontSize: "1.1rem",
        color: "#555",
        textAlign: "center",
        marginBottom: "30px",
        maxWidth: "500px"
      }}>
        這裡會顯示商品庫存與已完成訂單
      </p>

      <button
        onClick={() => navigate("/")}
        style={{
          padding: "12px 28px",
          background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontWeight: "bold",
          fontSize: "1.05rem",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(221,36,118,0.25)",
          transition: "all 0.2s ease-in-out",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        回到首頁
      </button>
    </div>
  );
}
