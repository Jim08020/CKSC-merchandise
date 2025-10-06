import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../CartContext";
import { useToast } from "../ToastContext";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  
  const products = [
    { id: 4_1, no: 4, name: "帽踢S", price: 650, orPrice: 850 },
    { id: 4_2, no: 4, name: "帽踢M", price: 650, orPrice: 850 },
    { id: 4_3, no: 4, name: "帽踢L", price: 650, orPrice: 850 },
    { id: 4_4, no: 4, name: "帽踢XL", price: 650, orPrice: 850 },
    { id: 4_5, no: 4, name: "帽踢2L", price: 650, orPrice: 850 },
  ];

  // 尺碼資料，包含對應的產品 ID
  const sizeData = [
    { size: "S", length: 64, sleeve: 51, chest: 114, shoulder: 50, productId: 4_1 },
    { size: "M", length: 66, sleeve: 53, chest: 118, shoulder: 52, productId: 4_2 },
    { size: "L", length: 68, sleeve: 55, chest: 122, shoulder: 54, productId: 4_3 },
    { size: "XL", length: 70, sleeve: 57, chest: 126, shoulder: 56, productId: 4_4 },
    { size: "2L", length: 72, sleeve: 59, chest: 130, shoulder: 58, productId: 4_5 },
  ];

  const handleAddToCart = (product) => {
    addToCart(product);
    showToast(`${product.name} 已加入購物車`);
  };

  // 根據產品 ID 找到對應的產品
  const findProductBySize = (productId) => {
    return products.find(product => product.id === productId);
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
          maxWidth: "700px", // 稍微增加寬度以容納按鈕
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          padding: "30px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1 style={{ marginBottom: "16px", color: "#333" }}>帽踢</h1>

        <div
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#dd2476",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          <div style={{textDecoration: "line-through", opacity: 0.7}}>
            NT$ 850 
          </div>
          早鳥優惠價：
          NT$ 650
        </div>

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
            overflow: "hidden",
          }}
        >
          <img
            src={`/images/product-${id}.png`}
            alt={`商品 ${id}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
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
          }}
        >
          <caption
            style={{
              captionSide: "top",
              marginBottom: "16px",
              fontWeight: "bold",
              fontSize: "1.1rem",
              color: "#444",
            }}
          >
            尺碼表 (cm)
          </caption>
          <thead>
            <tr style={{ background: "linear-gradient(90deg, #ff512f, #dd2476)", color: "white" }}>
              <th style={{ padding: "12px", textAlign: "center" }}>尺寸</th>
              <th style={{ padding: "12px", textAlign: "center" }}>衣長</th>
              <th style={{ padding: "12px", textAlign: "center" }}>袖長</th>
              <th style={{ padding: "12px", textAlign: "center" }}>胸圍</th>
              <th style={{ padding: "12px", textAlign: "center" }}>肩寬</th>
              <th style={{ padding: "12px", textAlign: "center" }}>購買</th>
            </tr>
          </thead>
          <tbody>
            {sizeData.map((item, idx) => {
              const product = findProductBySize(item.productId);
              return (
                <tr
                  key={item.size}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#fafafa" : "white",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ffe6f0";
                    e.currentTarget.style.boxShadow = "inset 4px 0 0 #dd2476";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = idx % 2 === 0 ? "#fafafa" : "white";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: idx === sizeData.length - 1 ? "none" : "1px solid #eee",
                      fontWeight: "bold",
                      color: "#333",
                    }}
                  >
                    {item.size}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: idx === sizeData.length - 1 ? "none" : "1px solid #eee",
                      color: "#555",
                    }}
                  >
                    {item.length}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: idx === sizeData.length - 1 ? "none" : "1px solid #eee",
                      color: "#555",
                    }}
                  >
                    {item.sleeve}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: idx === sizeData.length - 1 ? "none" : "1px solid #eee",
                      color: "#555",
                    }}
                  >
                    {item.chest}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: idx === sizeData.length - 1 ? "none" : "1px solid #eee",
                      color: "#555",
                    }}
                  >
                    {item.shoulder}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderBottom: idx === sizeData.length - 1 ? "none" : "1px solid #eee",
                    }}
                  >
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
              );
            })}
          </tbody>
        </table>
        
        <br />
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