import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, orderBy, doc, getDoc, deleteDoc , updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useToast } from "./ToastContext";

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [productCosts, setProductCosts] = useState({});
  const [comboCounts, setComboCounts] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchName = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setDisplayName(userDoc.data().name || user.displayName || user.email);
        } else {
          setDisplayName(user.displayName || user.email);
        }
      } catch {
        setDisplayName(user.displayName || user.email);
      }
    };
    fetchName();
  }, [user]);

  // 檢查管理員權限
  useEffect(() => {
    const checkAdminPermission = () => {
      if (!user) {
        showToast("❌ 請先登入");
        navigate("/login");
        return;
      }                   
      const adminEmails = [
        "ck11300333@gl.ck.tp.edu.tw", //80-1主席，網站管理員
        "chris20090731@gmail.com", //同上
        "ck11300329@gl.ck.tp.edu.tw", //80-1資訊長，網站管理員
        "ck11300569@gl.ck.tp.edu.tw", //80-1服務長
        "ck11300110@gl.ck.tp.edu.tw", //80-1副主席
        "ck11300044@gl.ck.tp.edu.tw", //80-1服務執行王猷巽
        "ck11300307@gl.ck.tp.edu.tw", //80-1服務執行洪鈵椉
        "ck11300554@gl.ck.tp.edu.tw", //80-1服務執行陳謙行
        "stud2@gl.ck.tp.edu.tw",//社團活動組楊蕙瑜組長
      ];
      
      if (adminEmails.includes(user.email)) {
        setIsAdmin(true);
      } else {
        showToast("❌ 您沒有權限查看此頁面");
        navigate("/");
        return;
      }
      setLoading(false);
    };
    checkAdminPermission();
  }, [user, navigate, showToast]);

  // 取得訂單並計算商品/套餐統計、折扣、總營收
  useEffect(() => {
    if (!isAdmin) return;
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const allOrdersRaw = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

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

        const counts = {};
        const costs = {};
        const combos = {};
        let revenue = 0;
        let discountTotal = 0;

        allOrders.forEach(order => {
          discountTotal += Number(order.totalDiscount || 0);

          order.items.forEach(item => {
            counts[item.name] = (counts[item.name] || 0) + item.quantity;
            const subtotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
            costs[item.name] = (costs[item.name] || 0) + subtotal;
            revenue += subtotal;
          });

          (order.appliedCombos || []).forEach(combo => {
            combos[combo.name] = (combos[combo.name] || 0) + combo.applicableCount;
          });
        });

        setProductCounts(counts);
        setProductCosts(costs);
        setComboCounts(combos);
        setTotalDiscount(discountTotal);
        setTotalRevenue(revenue - discountTotal);

      } catch (err) {
        console.error("取得訂單錯誤:", err);
      }
    };

    fetchOrders();
  }, [isAdmin]);

  // 更新交貨狀態
  const updateDeliveryStatus = async (orderId, delivered) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updateData = {
        delivered,
        deliveryUpdatedAt: serverTimestamp(),
        deliveryUpdatedBy: displayName,
        deliveryUpdatedByName: displayName || user.email || "管理員"
      };
      await updateDoc(orderRef, updateData);
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...updateData, deliveryUpdatedAt: new Date() } : order
      ));
      showToast(delivered ? "✅ 已標記為已交貨" : "📋 已標記為未交貨");
    } catch (err) {
      console.error("更新交貨狀態錯誤:", err);
      showToast("❌ 更新失敗：" + err.message);
    }
  };

  // 匯出 Excel
  const exportToExcel = () => {
    const summaryData = [];

    // 商品統計
    Object.entries(productCounts).forEach(([name, total]) => {
      summaryData.push({
        項目名稱: name,
        總數量: total,
        總金額: productCosts[name] || 0,
        類型: "商品"
      });
    });

    // 套餐統計
    Object.entries(comboCounts).forEach(([comboName, count]) => {
    // 找到所有這個套餐的資料
    const comboInstances = orders.flatMap(o => o.appliedCombos || [])
      .filter(c => c.name === comboName);

    // 折扣總額（資料庫已存好的）
    let comboDiscountTotal = comboInstances.reduce(
      (sum, combo) => sum + (combo.totalDiscount || 0),
      0
    );

    summaryData.push({
      項目名稱: comboName,
      總數量: count,
      總金額: -comboDiscountTotal,
      類型: "套餐"
    });
  });

    summaryData.push({});
    summaryData.push({ 項目名稱: "折扣總額", 總數量: "-", 總金額: totalDiscount });
    summaryData.push({ 項目名稱: "總營收", 總數量: "-", 總金額: totalRevenue });

    const productSheet = XLSX.utils.json_to_sheet(summaryData);

    // 訂單明細
    const orderRows = [];
    const merges = [];
    let currentRow = 1;
    orders.forEach(order => {
      const createdAt = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : "";
      const deliveryTime = order.deliveryUpdatedAt?.toDate ? order.deliveryUpdatedAt.toDate().toLocaleString() : "";
      const deliveryBy = order.deliveryUpdatedByName || "";
      const deliveryStatus = order.delivered ? "已交貨" : "未交貨";

      const orderItemCount = order.items.length;
      const startRow = currentRow;
      const endRow = currentRow + orderItemCount - 1;

      if (orderItemCount > 1) {
        const mergeColumns = Array.from({ length: 15 }, (_, i) => i);
        mergeColumns.forEach(colIndex => {
          merges.push({ s:{r:startRow,c:colIndex}, e:{r:endRow,c:colIndex} });
        });
      }

      order.items.forEach((item, itemIndex) => {
        orderRows.push({
          訂單ID: itemIndex === 0 ? order.id : "",
          建立時間: itemIndex === 0 ? createdAt : "",
          訂單原價: itemIndex === 0 ? order.originalTotal : "",
          組合包: itemIndex === 0 ? (order.appliedCombos?.map(c => `${c.name} x ${c.applicableCount}`).join(", ") || "") : "",
          折扣金額: itemIndex === 0 ? order.totalDiscount : "",
          訂單總金額: itemIndex === 0 ? order.finalTotal : "",
          交貨狀態: itemIndex === 0 ? deliveryStatus : "",
          交貨更新時間: itemIndex === 0 ? deliveryTime : "",
          更新者: itemIndex === 0 ? deliveryBy : "",
          客戶姓名: itemIndex === 0 ? order.customerName || "" : "",
          電話: itemIndex === 0 ? order.customerPhone || "" : "",
          Email: itemIndex === 0 ? order.customerEmail || "" : "",
          學校: itemIndex === 0 ? order.school || "" : "",
          班級座號: itemIndex === 0 ? order.classNumber || "" : "",
          商品名稱: item.name,
          數量: item.quantity,
          單價: item.price,
          小計: (Number(item.price)||0)*(Number(item.quantity)||0)
        });
        currentRow++;
      });
    });

    const ordersSheet = XLSX.utils.json_to_sheet(orderRows);
    if (merges.length > 0) ordersSheet['!merges'] = merges;

    ordersSheet['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 },
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 10 }
    ];
    productSheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 10 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, productSheet, "商品統計");
    XLSX.utils.book_append_sheet(workbook, ordersSheet, "訂單明細");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `訂單統計_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast("✅ Excel 已匯出");
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: "40px" }}><p>檢查權限中...</p></div>;
  if (!isAdmin) return null;

  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
        borderRadius: "12px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        marginBottom: 0,
      }}>
        <img 
          src={user.photoURL || "https://via.placeholder.com/48?text=👤"} 
          alt="User Avatar"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #ddd"
          }}
        />
        <div>
          <p style={{ margin: 0, fontWeight: "bold", fontSize: "1rem", color: "#333" }}>
            Admin-{displayName || "未命名用戶"}
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
            {user.email}
          </p>
        </div>
      </div>
      <h1 style={{ marginBottom: "30px", color: "#333" }}>後台管理 - 訂單統計</h1>
      <div style={{ width: "100%", maxWidth: "1000px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* 匯出與總覽卡片 */}
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.08)", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 style={{ margin: 0, color: "#333" }}>匯出與總覽</h2>
            <p style={{ margin: "6px 0 8px", color: "#666", fontSize: "0.95rem" }}>匯出商品統計與所有訂單明細</p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ background: "#f9fafb", border: "1px solid #eee", borderRadius: "10px", padding: "10px 14px" }}>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>訂單數</div>
                <div style={{ color: "#111", fontWeight: 700, fontSize: "1.1rem" }}>{orders.length}</div>
              </div>
              <div style={{ background: "#f0f9ff", border: "1px solid #e0f2fe", borderRadius: "10px", padding: "10px 14px" }}>
                <div style={{ color: "#0369a1", fontSize: "0.9rem" }}>總營收</div>
                <div style={{ color: "#0c4a6e", fontWeight: 700, fontSize: "1.1rem" }}>NT$ {totalRevenue}</div>
              </div>
              <div style={{ background: "#fff1f2", border: "1px solid #ffe4e6", borderRadius: "10px", padding: "10px 14px" }}>
                <div style={{ color: "#be123c", fontSize: "0.9rem" }}>折扣總額</div>
                <div style={{ color: "#9f1239", fontWeight: 700, fontSize: "1.1rem" }}>NT$ {totalDiscount}</div>
              </div>
              <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "10px 14px" }}>
                <div style={{ color: "#166534", fontSize: "0.9rem" }}>已交貨</div>
                <div style={{ color: "#14532d", fontWeight: 700, fontSize: "1.1rem" }}>{orders.filter(o => o.delivered).length}</div>
              </div>
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 14px" }}>
                <div style={{ color: "#92400e", fontSize: "0.9rem" }}>未交貨</div>
                <div style={{ color: "#78350f", fontWeight: 700, fontSize: "1.1rem" }}>{orders.filter(o => !o.delivered).length}</div>
              </div>
            </div>
          </div>
          <button
            onClick={exportToExcel}
            style={{ padding: "12px 24px", background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(221,36,118,0.25)" }}
          >
            匯出 Excel
          </button>
        </div>
        {/* 商品總數量 Card */}
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.08)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 style={{ margin: 0, color: "#333" }}>商品總數量</h2>
          {Object.keys(productCounts).length === 0 ? <p style={{ color: "#555" }}>尚無統計資料</p> : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {Object.entries(productCounts).map(([name, total]) => (
                <li key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: "10px", border: "1px solid #eee", boxShadow: "0 2px 6px rgba(0,0,0,0.04)", marginBottom: "10px", background: "#f9f9f9" }}>
                  <span style={{ color: "#333", fontWeight: 600 }}>{name}</span>
                  <span style={{ color: "#666" }}>總數量：{total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* 訂單列表區塊 */}
        <div>
          <h2 style={{ margin: "0 0 12px", color: "#333" }}>所有訂單</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            {orders.map(order => (
              <div key={order.id} style={{ background: "white", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.08)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* 交貨狀態顯示 */}
                <div style={{ background: order.delivered ? "#dcfce7" : "#fef3c7", border: `1px solid ${order.delivered ? "#16a34a" : "#f59e0b"}`, borderRadius: "8px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ fontWeight: "bold" }}>
                      交貨狀態：
                      <span style={{ color: order.delivered ? "#16a34a" : "#f59e0b", marginLeft: "8px" }}>
                        {order.delivered ? "✅ 已交貨" : "⏳ 未交貨"}
                      </span>
                    </div>
                    {order.deliveryUpdatedAt && <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "4px" }}>
                      最後更新：{order.deliveryUpdatedAt.toDate ? order.deliveryUpdatedAt.toDate().toLocaleString() : order.deliveryUpdatedAt.toLocaleString()} {order.deliveryUpdatedByName && `(${order.deliveryUpdatedByName})`}
                    </div>}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => updateDeliveryStatus(order.id, true)} disabled={order.delivered} style={{ padding: "6px 12px", borderRadius: "4px", border: "none", background: order.delivered ? "#94a3b8" : "#16a34a", color: "white", fontSize: "0.85rem", fontWeight: "bold", cursor: order.delivered ? "not-allowed" : "pointer" }}>標記已交貨</button>
                    <button onClick={() => updateDeliveryStatus(order.id, false)} disabled={!order.delivered} style={{ padding: "6px 12px", borderRadius: "4px", border: "none", background: !order.delivered ? "#94a3b8" : "#f59e0b", color: "white", fontSize: "0.85rem", fontWeight: "bold", cursor: !order.delivered ? "not-allowed" : "pointer" }}>標記未交貨</button>
                  </div>
                </div>
                <p><strong>訂單ID:</strong> {order.id}</p>
                <p><strong>折扣後金額:</strong> NT$ {order.finalTotal}</p>
                <p><strong>購買時間:</strong> {order.createdAt?.toDate().toLocaleString()}</p>
                {/* 客戶資料 */}
                {(order.customerName || order.customerPhone || order.customerEmail || order.school || order.classNumber) && (
                  <div style={{ background: "#f0f9ff", border: "1px solid #e0f2fe", borderRadius: "8px", padding: "10px" }}>
                    <strong>客戶資料：</strong>
                    <ul style={{ marginTop: "6px" }}>
                      {order.customerName && <li>姓名：{order.customerName}</li>}
                      {order.customerPhone && <li>電話：{order.customerPhone}</li>}
                      {order.customerEmail && <li>Email：{order.customerEmail}</li>}
                      {order.school && <li>學校：{order.school}</li>}
                      {order.classNumber && <li>班級座號：{order.classNumber}</li>}
                    </ul>
                  </div>
                )}
                {/* 商品列表 */}
                <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "10px" }}>
                  <strong>購買商品：</strong>
                  <ul style={{ marginTop: "6px" }}>
                    {order.items.map(item => (<li key={item.id}>{item.name} x {item.quantity} (NT$ {item.price})</li>))}
                  </ul>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    style={{
                      padding: "10px 16px",
                      background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    查看詳細
                  </button>
                  <button
                    onClick={async () => {
                      const ok = window.confirm(`確定要刪除此訂單嗎？\nID: ${order.id}`);
                      if (!ok) return;
                      try {
                        await deleteDoc(doc(db, "orders", order.id));
                        setOrders(prev => prev.filter(o => o.id !== order.id));
                        showToast("✅ 訂單已刪除");
                      } catch (e) {
                        console.error("刪除訂單失敗", e);
                        showToast("❌ 刪除失敗");
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
            {orders.length === 0 && <p style={{ color: "#555" }}>尚無訂單資料</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
