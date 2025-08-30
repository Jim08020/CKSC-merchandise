import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../CartContext";
import { useToast } from "../ToastContext";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  
  // 座墊產品資料
  const product = {
    no: 5,
    id: 5,
    name: "座墊",
    price: 100,
    specifications: {
      size: "40 x 40 x 5 cm",
      material: "棉花"
    }
  };

  const handleAddToCart = () => {
    addToCart(product);
    showToast(`${product.name} 已加入購物車`);
  };

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
        <h1 style={{ marginBottom: "8px", color: "#333" }}>座墊</h1>

        {/* 價格區塊 */}
        <div
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#dd2476",
            marginBottom: "24px",
          }}
        >
          NT$ 100
        </div>

        {/* 商品圖片示意 */}
        <div
          style={{
            width: "100%",
            maxWidth: "300px",
            height: "300px",
            background: "#e0e0e0",
            borderRadius: "12px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            color: "#888",
          }}
        >
          商品圖片
        </div>

        {/* 規格表 */}
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            marginBottom: "24px",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <caption
            style={{
              captionSide: "top",
              marginBottom: "12px",
              fontWeight: "bold",
              fontSize: "1.1rem",
              color: "#444",
            }}
          >
            產品規格
          </caption>
          <tbody>
            <tr style={{ background: "#fafafa" }}>
              <td style={{ padding: "12px", fontWeight: "bold", textAlign: "center" }}>尺寸</td>
              <td style={{ padding: "12px", textAlign: "center" }}>40 x 40 x 5 cm</td>
            </tr>
            <tr>
              <td style={{ padding: "12px", fontWeight: "bold", textAlign: "center" }}>材質</td>
              <td style={{ padding: "12px", textAlign: "center" }}>棉花</td>
            </tr>
          </tbody>
        </table>

        {/* 按鈕群組 */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <button
            onClick={handleAddToCart}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(221,36,118,0.25)",
              transition: "all 0.2s",
              minWidth: "140px",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(221,36,118,0.35)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(221,36,118,0.25)";
            }}
          >
            加入購物車
          </button>
        </div>

        {/* 回首頁按鈕 */}
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 28px",
            background: "#f5f5f5",
            color: "#333",
            border: "1px solid #ddd",
            borderRadius: "10px",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#eeeeee";
            e.target.style.borderColor = "#bbb";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#f5f5f5";
            e.target.style.borderColor = "#ddd";
          }}
        >
          回到首頁
        </button>
      </div>
    </div>
  );
}