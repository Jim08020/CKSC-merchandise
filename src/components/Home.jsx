// Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";
import { useToast } from "./ToastContext";

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const products = [
    { id: 1, name: "棒球外套", price: 100 },
    { id: 2, name: "棉踢", price: 200 },
    { id: 3, name: "排汗衫", price: 300 },
    { id: 4, name: "座墊", price: 100 },
    { id: 5, name: "證件套", price: 200 },
    { id: 6, name: "鑰匙圈", price: 300 },
    { id: 7, name: "帽踢", price: 300 },
  ];

  const handleAddToCart = (product) => {
    addToCart(product);
    showToast(`${product.name} 已加入購物車`);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
      {products.map((product) => (
        <div
          key={product.id}
          style={{
            width: "220px",
            padding: "16px",
            borderRadius: "12px",
            background: "white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transition: "transform 0.2s, box-shadow 0.2s",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          }}
        >
          <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "8px" }}>
            {product.name}
          </div>
          <div style={{ color: "#555", marginBottom: "12px" }}>${product.price}</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: "#4CAF50",
                color: "white",
                cursor: "pointer",
              }}
              onClick={() => handleAddToCart(product)}
            >
              加入購物車
            </button>
            <button
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                background: "white",
                cursor: "pointer",
              }}
              onClick={() => navigate(`/product/${product.id}`)}
            >
              查看
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
