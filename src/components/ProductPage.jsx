import React from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <h1>商品 {id}</h1>
      <p>這裡會顯示商品詳細資訊</p>

        <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        回到首頁
      </button>
    </div>
  );
}
