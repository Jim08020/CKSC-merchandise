// Home.jsx
import { or } from "firebase/firestore";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [selectedItems] = useState(new Set());

  const products = [
    { id: 1, textid: "1", no: 1, name: "棒球外套", price: 700, orPrice: 900},
    { id: 2, textid: "2", no: 2, name: "棉短踢", price: 300, orPrice: 500 },
    { id: 3, textid: "3", no: 3, name: "真皮證件套", price: 200, orPrice: 400 },
    { id: 4, textid: "4", no: 4, name: "帽踢", price: 650, orPrice: 850 },
    { id: 5, textid: "5", no: 5, name: "毛巾", price: 200, orPrice: 400 },
    { id: 6, textid: "6", no: 6, name: "包包", price: 750, orPrice: 950 },
    { id: 7_1, textid: "7_1", no: 7, name: "鑰匙圈", category: "A", price: 50, orPrice: 70 },
    { id: 7_2, textid: "7_2", no: 7, name: "鑰匙圈", category: "B", price: 50, orPrice: 70 },
    { id: 8, textid: "8", no: 8, name: "徽章", price: 50, orPrice: 70 },
  ];

  // 套餐組合設定
  const comboDeals = [
    {
      id: "combo1", //短踢+毛巾
      name: "組合包A",
      items: [2, 5],
      originalPrice: 750,
      comboPrice: 400,
      discount: 350,
    },
    {
      id: "combo2", //棒球外套+帽踢
      name: "組合包B",
      items: [1, 4], 
      originalPrice: 1600,
      comboPrice: 1250,
      discount: 350,
    },
    {
      id: "combo3", //棒球外套+帽踢+短踢
      name: "組合包C",
      items: [1, 2 ,4], 
      originalPrice: 1900,
      comboPrice: 1500,
      discount: 400,
    },
    {
      id: "combo4",
      name: "全套組合包",
      items: [1, 2, 3, 4, 5, 6, 7, 8], //All
      originalPrice: 3000,
      comboPrice: 2500,
      discount: 500,
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      {/* 套餐說明 */}
      <div style={{ 
        marginBottom: "30px",
        padding: "25px",
        background: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        color: "black",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
      }}>
        <h2 style={{ margin: "0 0 15px 0", textAlign: "center" }}>🎁 組合包優惠</h2>
        <p style={{ textAlign: "center", marginBottom: "20px", color: "#0000009f" }}>
          各品項加入購物車後將會自動計算最佳組合並折扣
        </p>
        <p style={{ 
          textAlign: "center", 
          marginBottom: "20px", 
          background: "#ffe7e7ff",
          border: "1px solid #ff0000ff",
          display: "flex", 
          flexWrap: "wrap", 
          gap: "15px", 
          justifyContent: "center",
          color: "#a10d0dff",
          padding: "15px",
          borderRadius: "10px",
          backdropFilter: "blur(10px)",
          minWidth: "200px"}}>
          滿$1500即贈送徽章或鑰匙圈 1 個<br />
          限時早鳥預購優惠，售完為止
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", justifyContent: "center" }}>
          {comboDeals.map(combo => (
            <div key={combo.id} style={{
              background: "rgba(255, 255, 255, 0.73)",
              padding: "15px",
              borderRadius: "10px",
              backdropFilter: "blur(10px)",
              minWidth: "200px"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "5px" }}>{combo.name}</div>
              <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                包含： {combo.items.map(no => products.find(p => p.no === no)?.name).join(" + ")}
              </div>
              <div style={{ marginTop: "8px" }}>
                <span style={{ textDecoration: "line-through", opacity: 0.7 }}>${combo.originalPrice}</span>
                <span style={{ marginLeft: "10px", fontWeight: "bold", fontSize: "1.1rem" }}>${combo.comboPrice}</span>
                <span style={{ marginLeft: "10px", color: "#ffeb3b" }}>省${combo.discount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 商品列表 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" , paddingBottom: "40px"}}>
        {products.map((product) => {
          const isSelected = selectedItems.has(product.no);
          return (
            <div
              key={product.id}
              style={{
                width: "220px",
                padding: "16px",
                borderRadius: "12px",
                background: isSelected ? "linear-gradient(135deg, #4CAF50, #45a049)" : "white",
                color: isSelected ? "white" : "black",
                boxShadow: isSelected 
                  ? "0 8px 20px rgba(76,175,80,0.3)" 
                  : "0 4px 12px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "all 0.3s",
                cursor: "pointer",
                }}
            > 
              <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "8px" }}>
                {product.name}{product.category ? `${product.category}` : ""}
              </div>
              <div style={{ color: isSelected ? "#e8f5e8" : "#555", marginBottom: "12px" }}>
                <div style={{textDecoration: "line-through", opacity: 0.7}}>
                  ${product.orPrice}
                </div>
                ${product.price}
              </div>
              <div style={{
                width: "100%",
                Width: "200px",
                height: "200px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
                overflow: "hidden",
              }}
              >
                <img
                  src={`/images/product-${product.textid}.png`}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  style={{
                    padding: "8px 16px",
                    background: isSelected 
                      ? "rgba(255,255,255,0.2)" 
                      : "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
                    color: "white",
                    border: isSelected ? "2px solid white" : "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    minWidth: "70px",
                  }}
                  onClick={() => navigate(`/product/${product.no}`)}
                >
                  查看
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}