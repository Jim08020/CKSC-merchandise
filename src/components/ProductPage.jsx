import React from "react";
import { useParams, useNavigate } from "react-router-dom";

// 個別商品頁面，可以放在 ./products 資料夾
import Product1 from "./products/Product1";
import Product2 from "./products/Product2";
import Product3 from "./products/Product3";

// id → 對應的商品 component
const productMap = {
  1: Product1,
  2: Product2,
  3: Product3,
};

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const SpecificProduct = productMap[id]; // 根據 id 找對應的頁面

  if (!SpecificProduct) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        color: "#555"
      }}>
        <h2>❌ 找不到商品</h2>
        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: "20px",
            padding: "12px 28px",
            background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          回首頁
        </button>
      </div>
    );
  }

  return <SpecificProduct />; // 渲染對應的商品詳細頁
}
