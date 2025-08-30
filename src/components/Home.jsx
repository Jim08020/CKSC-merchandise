// Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const products = [
    { id: 1, no: 1, name: "棒球外套", price: 100 },
    { id: 2, no: 2, name: "棉踢", price: 200 },
    { id: 3, no: 3, name: "排汗衫", price: 300 },
    { id: 4, no: 4, name: "帽踢", price: 300 },
    { id: 5, no:5, name: "座墊", price: 100 },
    { id: 6, no:6, name: "證件套", price: 200 },
    { id: 7, no:7, name: "鑰匙圈", price: 300 },
  ];

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
              onClick={() => navigate(`/product/${product.no}`)}
          >
            查看
          </button>
          </div>
        </div>
      ))}
    </div>
  );
}
