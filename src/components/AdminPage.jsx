import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, doc, getDoc, deleteDoc } from "firebase/firestore";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [productCosts, setProductCosts] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // 以時間新到舊排列
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const allOrdersRaw = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // 補齊客戶資料（若訂單缺少）
        const allOrders = await Promise.all(allOrdersRaw.map(async (o) => {
          const needEnrich = !o.customerName || !o.customerPhone || !o.customerEmail;
          if (!needEnrich || !o.userId) return o;
          try {
            const userRef = doc(db, "users", o.userId);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return o;
            const u = userSnap.data();
            return {
              ...o,
              customerName: o.customerName || u.name || "",
              customerPhone: o.customerPhone || u.phone || "",
              customerEmail: o.customerEmail || u.email || "",
              school: o.school || u.school || "",
              classNumber: o.classNumber || u.classNumber || "",
            };
          } catch {
            return o;
          }
        }));
        setOrders(allOrders);

        // 計算每個商品總數量與總營收
        const counts = {};
        const costs = {};
        let revenue = 0;
        allOrders.forEach(order => {
          order.items.forEach(item => {
            counts[item.name] = (counts[item.name] || 0) + item.quantity;
            const subtotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
            revenue += subtotal;
            costs[item.name] = (costs[item.name] || 0) + subtotal;
          });
        });
        setProductCounts(counts);
        setTotalRevenue(revenue);
        setProductCosts(costs);
      } catch (err) {
        console.error("取得訂單錯誤:", err);
      }
    };

    fetchOrders();
  }, []);

  // 匯出 Excel：包含商品統計與所有訂單明細
  const exportToExcel = () => {
    // 商品統計表
    const productSummaryData = Object.entries(productCounts).map(([name, total]) => ({
      商品名稱: name,
      總數量: total,
      總金額: productCosts[name] || 0
    }));
    productSummaryData.push({});
    productSummaryData.push({ 商品名稱: "總營收", 總數量: "-", 總金額: totalRevenue });
    const productSheet = XLSX.utils.json_to_sheet(productSummaryData);

    // 訂單明細表：一列一個商品項目，含訂單資訊
    const orderRows = orders.flatMap(order => {
      const createdAt = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : "";
      const customerName = order.customerName || order.customer?.name || "";
      const customerPhone = order.customerPhone || order.customer?.phone || "";
      const customerEmail = order.customerEmail || order.customer?.email || "";
      const customerSchool = order.school || order.customer?.school || "";
      const customerClassNum = order.classNumber || order.customer?.classNumber || "";
      return order.items.map(item => ({
        訂單ID: order.id,
        建立時間: createdAt,
        訂單總金額: order.total,
        客戶姓名: customerName,
        電話: customerPhone,
        Email: customerEmail,
        學校: customerSchool,
        班級座號: customerClassNum,
        商品名稱: item.name,
        數量: item.quantity,
        單價: item.price,
        小計: (Number(item.price) || 0) * (Number(item.quantity) || 0)
      }));
    });
    const ordersSheet = XLSX.utils.json_to_sheet(orderRows);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, productSheet, "商品統計");
    XLSX.utils.book_append_sheet(workbook, ordersSheet, "訂單明細");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `訂單統計_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      padding: "40px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <h1 style={{ marginBottom: "30px", color: "#333" }}>後台管理 - 訂單統計</h1>

      <div style={{ width: "100%", maxWidth: "1000px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Export & Summary */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ margin: 0, color: "#333" }}>匯出與總覽</h2>
            <p style={{ margin: "6px 0 8px", color: "#666", fontSize: "0.95rem" }}>匯出商品統計與所有訂單明細</p>
            <div style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap"
            }}>
              <div style={{
                background: "#f9fafb",
                border: "1px solid #eee",
                borderRadius: "10px",
                padding: "10px 14px"
              }}>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>訂單數</div>
                <div style={{ color: "#111", fontWeight: 700, fontSize: "1.1rem" }}>{orders.length}</div>
              </div>
              <div style={{
                background: "#f0f9ff",
                border: "1px solid #e0f2fe",
                borderRadius: "10px",
                padding: "10px 14px"
              }}>
                <div style={{ color: "#0369a1", fontSize: "0.9rem" }}>總營收</div>
                <div style={{ color: "#0c4a6e", fontWeight: 700, fontSize: "1.1rem" }}>NT$ {totalRevenue}</div>
              </div>
            </div>
          </div>
          <button
            onClick={exportToExcel}
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
              transition: "all 0.2s"
            }}
          >
            匯出 Excel
          </button>
        </div>

        {/* Product Counts Card */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <h2 style={{ margin: 0, color: "#333" }}>商品總數量</h2>
          {Object.keys(productCounts).length === 0 ? (
            <p style={{ color: "#555" }}>尚無統計資料</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {Object.entries(productCounts).map(([name, total]) => (
                <li key={name} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #eee",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  marginBottom: "10px",
                  background: "#f9f9f9"
                }}>
                  <span style={{ color: "#333", fontWeight: 600 }}>{name}</span>
                  <span style={{ color: "#666" }}>總數量：{total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Orders List */}
        <div>
          <h2 style={{ margin: "0 0 12px", color: "#333" }}>所有訂單</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
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
                <p><strong>訂單ID:</strong> {order.id}</p>
                <p><strong>總金額:</strong> NT$ {order.total}</p>
                <p><strong>購買時間:</strong> {order.createdAt?.toDate().toLocaleString()}</p>
                {(order.customerName || order.customer?.name || order.customerPhone || order.customer?.phone || order.customerEmail || order.customer?.email || order.school || order.customer?.school || order.classNumber || order.customer?.classNumber) && (
                  <div style={{
                    background: "#f0f9ff",
                    border: "1px solid #e0f2fe",
                    borderRadius: "8px",
                    padding: "10px"
                  }}>
                    <strong>客戶資料：</strong>
                    <ul style={{ marginTop: "6px" }}>
                      {(order.customerName || order.customer?.name) && (
                        <li>姓名：{order.customerName || order.customer?.name}</li>
                      )}
                      {(order.customerPhone || order.customer?.phone) && (
                        <li>電話：{order.customerPhone || order.customer?.phone}</li>
                      )}
                      {(order.customerEmail || order.customer?.email) && (
                        <li>Email：{order.customerEmail || order.customer?.email}</li>
                      )}
                      {(order.school || order.customer?.school) && (
                        <li>學校：{order.school || order.customer?.school}</li>
                      )}
                      {(order.classNumber || order.customer?.classNumber) && (
                        <li>班級座號：{order.classNumber || order.customer?.classNumber}</li>
                      )}
                    </ul>
                  </div>
                )}

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
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    onClick={async () => {
                      const ok = window.confirm(`確定要刪除此訂單嗎？\nID: ${order.id}`);
                      if (!ok) return;
                      try {
                        await deleteDoc(doc(db, "orders", order.id));
                        setOrders(prev => prev.filter(o => o.id !== order.id));
                      } catch (e) {
                        console.error("刪除訂單失敗", e);
                      }
                    }}
                    style={{
                      padding: "10px 16px",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    刪除訂單
                  </button>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p style={{ color: "#555" }}>尚無訂單資料</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
