import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../CartContext";
import { useToast } from "../ToastContext";

export default function Product7() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  
  const products = [
    { id: "7_1", no: 7, name: "鑰匙圈", price: 50, orPrice: 50 },
    { id: "7_2", no: 7, name: "CKHS鑰匙圈", price: 50, orPrice: 50 },
  ];

  const handleAddToCart = (product) => {
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
        <h1 style={{ marginBottom: "8px", color: "#333" }}>鑰匙圈</h1>

        {/* 價格區塊 */}
        <div
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#dd2476",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          NT$ 50
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            marginBottom: "24px",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}>
          <thead>
            <tr style={{ background: "linear-gradient(90deg, #ff512f, #dd2476)", color: "white" }}>
              <th style={{ padding: "12px", textAlign: "center" }}>樣式</th>
              <th style={{ padding: "12px", textAlign: "center" }}>購買</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td style={{
                  padding: "12px",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  color: "#555",
                }}>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "200px",
                      height: "200px",
                      marginBottom: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "12px",
                      overflow: "hidden",
                      margin: "0 auto",
                    }}
                  >
                    <img
                      src={`/images/product-${product.id}.png`}
                      alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ marginTop: "8px" }}>{product.name}</div>
                </td>

                <td
                  style={{
                    padding: "12px",
                    textAlign: "center",
                  }}>
                  <button
                    onClick={() => handleAddToCart(product)}
                    style={{  
                      padding: "8px 16px",
                      background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(221,36,118,0.25)",
                      transition: "all 0.2s",
                      minWidth: "80px",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 4px 12px rgba(221,36,118,0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 2px 8px rgba(221,36,118,0.25)";
                    }}
                  >
                    加入購物車
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 回首頁按鈕 */}
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 28px",
            background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "0.9rem",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(221,36,118,0.25)",
            transition: "all 0.2s",
            minWidth: "80px",
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