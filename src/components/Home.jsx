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
    { id: 1, name: "商品 A", price: 100 },
    { id: 2, name: "商品 B", price: 200 },
    { id: 3, name: "商品 C", price: 300 },
  ];

  const handleAddToCart = (product) => {
    addToCart(product);
    showToast(`${product.name} 已加入購物車`);
  };

  return (
    <div>
      <h1>CKSC Shop</h1>
      {products.map((product) => (
        <div key={product.id} style={{ marginBottom: "10px" }}>
          <span>{product.name} - ${product.price}</span>
          <button
            style={{ marginLeft: "10px" }}
            onClick={() => navigate(`/product/${product.id}`)}
          >
            查看商品
          </button>
          <button
            style={{ marginLeft: "10px" }}
            onClick={() => handleAddToCart(product)}
          >
            加入購物車
          </button>
        </div>
      ))}

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => navigate("/auth")}>登入 / 註冊</button>
        <button onClick={() => navigate("/cart")} style={{ marginLeft: "10px" }}>
          購物車
        </button>
        <button onClick={() => navigate("/admin")} style={{ marginLeft: "10px" }}>
          後台管理
        </button>
        <button onClick={() => navigate("/orders")} style={{ marginLeft: "10px" }}>
          我的訂單
        </button>
      </div>
    </div>
  );
}
