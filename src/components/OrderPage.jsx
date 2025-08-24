import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "./ToastContext"; // 引入 Toast

export default function OrderPage() {
  const [user] = useAuthState(auth);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const { showToast } = useToast(); // 使用 Toast

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

  if (!user) return <p>請先登入查看訂單</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>我的訂單</h1>
      {orders.length === 0 && <p>你還沒有任何訂單</p>}

      {orders.map(order => (
        <div
          key={order.id}
          style={{
            border: "1px solid black",
            marginBottom: "10px",
            padding: "10px",
          }}
        >
          <p>訂單ID: {order.id}</p>
          <p>總金額: ${order.total}</p>
          <p>購買時間: {order.createdAt?.toDate().toLocaleString()}</p>
          <ul>
            {order.items.map(item => (
              <li key={item.id}>
                {item.name} x {item.quantity} (${item.price})
              </li>
            ))}
          </ul>
          {/* 顯示 QRCode */}
          <div style={{ marginTop: "10px" }}>
            <QRCodeCanvas value={JSON.stringify(order.items)} />
          </div>
        </div>
      ))}

      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        回到首頁
      </button>
    </div>
  );
}
