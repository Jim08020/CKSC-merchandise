import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "./ToastContext";

export default function OrderdetailPage() {
  const { id } = useParams(); // 從 /order/:id 拿到訂單ID
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "orders", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setOrder({ id: snapshot.id, ...snapshot.data() });
        } else {
          showToast("❌ 找不到這筆訂單");
          navigate("/orders"); // 找不到回列表
        }
      } catch (err) {
        console.error("取得訂單錯誤:", err);
        showToast("❌ 取得訂單失敗：" + err.message);
      }
    };
    fetchOrder();
  }, [id]);

  if (!order) return <p style={{ textAlign: "center", marginTop: "40px" }}>載入中...</p>;

  return (
    <div style={{
      minHeight: "100vh",
      padding: "40px 20px",
      display: "flex",
      justifyContent: "center"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "800px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        <h1 style={{ textAlign: "center", marginBottom: "8px", color: "#333" }}>訂單明細</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ background: "#f9fafb", borderRadius: "10px", padding: "12px" }}>
            <div style={{ color: "#666", fontSize: "0.9rem" }}>訂單ID</div>
            <div style={{ fontWeight: 700 }}>{order.id}</div>
          </div>
          <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "10px", padding: "12px" }}>
            <div style={{ color: "#166534", fontSize: "0.9rem" }}>總金額</div>
            <div style={{ fontWeight: 700, color: "#065f46" }}>NT$ {order.total}</div>
          </div>
          <div style={{ background: "#f9fafb", borderRadius: "10px", padding: "12px" }}>
            <div style={{ color: "#666", fontSize: "0.9rem" }}>購買時間</div>
            <div style={{ fontWeight: 600 }}>{order.createdAt?.toDate().toLocaleString()}</div>
          </div>
          {(order.customerName || order.customerPhone || order.customerEmail || order.school || order.classNumber) && (
            <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: "10px", padding: "12px" }}>
              <div style={{ color: "#1d4ed8", fontSize: "0.9rem", marginBottom: 4 }}>客戶資料</div>
              {order.customerName && <div>姓名：{order.customerName}</div>}
              {order.customerPhone && <div>電話：{order.customerPhone}</div>}
              {order.customerEmail && <div>Email：{order.customerEmail}</div>}
              {order.school && <div>學校：{order.school}</div>}
              {order.classNumber && <div>班級座號：{order.classNumber}</div>}
            </div>
          )}
        </div>

        <div style={{
          background: "#f9f9f9",
          borderRadius: "10px",
          padding: "16px"
        }}>
          <strong>商品清單：</strong>
          <ul style={{ marginTop: "8px" }}>
            {order.items.map(item => (
              <li key={item.id}>
                {item.name} x {item.quantity}（NT$ {item.price}）
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={() => navigate("/orders")}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "white",
              cursor: "pointer"
            }}
          >
            回到訂單列表
          </button>
        </div>
      </div>
    </div>
  );
}
