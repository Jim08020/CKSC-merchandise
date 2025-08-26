import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "./ToastContext";

export default function OrderPage() {
  const [user] = useAuthState(auth);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("取得訂單錯誤:", err);
        showToast("❌ 取得訂單失敗：" + err.message);
      }
    };

    fetchOrders();
  }, [user]);

  if (!user) return <p style={{ textAlign: "center", marginTop: "40px" }}>請先登入查看訂單</p>;

  return (
    <div style={{
      minHeight: "100vh",
      padding: "40px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <h1 style={{ marginBottom: "30px", color: "#333" }}>我的訂單</h1>

      {orders.length === 0 && <p style={{ color: "#555" }}>你還沒有任何訂單</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "800px" }}>
        {orders.map(order => (
          <div key={order.id} style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <p><strong>訂單ID：</strong> {order.id}</p>
            <p><strong>總金額：</strong> NT$ {order.total}</p>
            <p><strong>購買時間：</strong> {order.createdAt?.toDate().toLocaleString()}</p>

            <div style={{
              background: "#f9f9f9",
              borderRadius: "8px",
              padding: "10px",
            }}>
              <strong>購買商品：</strong>
              <ul style={{ marginTop: "6px" }}>
                {order.items.map(item => (
                  <li key={item.id}>
                    {item.name} x {item.quantity} (NT$ {item.price})
                  </li>
                ))}
              </ul>
            </div>

            <div style={{
              marginTop: "10px",
              display: "flex",
              justifyContent: "center",
            }}>
              <QRCodeCanvas value={JSON.stringify(order.items)} size={150} />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "30px",
          padding: "12px 28px",
          background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontWeight: "bold",
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(221,36,118,0.25)",
          transition: "all 0.2s"
        }}
      >
        回到首頁
      </button>
    </div>
  );
}
