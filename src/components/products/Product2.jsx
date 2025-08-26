import React from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          padding: "30px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1 style={{ marginBottom: "16px", color: "#333" }}>商品 {id}</h1>
        <p
          style={{
            textAlign: "center",
            color: "#555",
            marginBottom: "24px",
          }}
        >
          這裡會顯示商品詳細資訊，包括圖片、描述、價格等等。
        </p>

        {/* 商品圖片示意 */}
        <div
          style={{
            width: "100%",
            maxWidth: "300px",
            height: "300px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            overflow: "hidden", // 確保圖片不會超出邊框
          }}
        >
          <img
            src={`/images/product-${id}.png`} // 這裡放圖片路徑，可以依 id 來決定
            alt={`商品 ${id}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>


        {/* 回首頁按鈕 */}
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 28px",
            background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(221,36,118,0.25)",
            transition: "all 0.2s",
          }}
        >
          回到首頁
        </button>
      </div>
    </div>
  );
}
