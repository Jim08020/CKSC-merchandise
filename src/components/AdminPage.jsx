import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>後台管理</h1>
      <p>這裡會顯示商品庫存與已完成訂單</p>
      <button onClick={() => navigate("/")}>style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}回到首頁</button>
    </div>
  );
}
