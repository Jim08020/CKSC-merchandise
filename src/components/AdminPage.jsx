import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, orderBy, doc, getDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useToast } from "./ToastContext";

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [paidOrders, setPaidOrders] = useState([]);
  
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState("");

  // 學校列表
  const schools = [
    "建國中學",
    "北一女中",
    "中山女高",
    "景美女中",
    "成功高中",
    "師大附中",
    "建中家長會",
    "其他學校或社會人士"
  ];

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
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("檢查管理員權限失敗:", error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // 計算統計數據
  const calculateStatistics = (ordersList) => {
    const counts = {};
    const costs = {};
    const combos = {};
    let revenue = 0;
    let discountTotal = 0;

    ordersList.forEach(order => {
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

    return {
      productCounts: counts,
      productCosts: costs,
      comboCounts: combos,
      totalDiscount: discountTotal,
      totalRevenue: revenue - discountTotal
    };
  };

  // 計算交貨統計
  const calculateDeliveryStats = (ordersList) => {
    const stats = {};
    const deliveredList = ordersList.filter(order => order.delivered);
    
    deliveredList.forEach(order => {
      if (order.deliveryUpdatedByName) {
        const updater = order.deliveryUpdatedByName;
        if (!stats[updater]) {
          stats[updater] = { count: 0, totalAmount: 0 };
        }
        stats[updater].count += 1;
        stats[updater].totalAmount += Number(order.finalTotal || 0);
      }
    });

    return stats;
  };

  // 根據選擇的學校篩選訂單
  const filterOrdersBySchool = (ordersList) => {
    if (selectedSchool === "all") {
      return ordersList;
    }
    return ordersList.filter(order => order.school === selectedSchool);
  };

  // 取得訂單
  useEffect(() => {
    if (!isAdmin || checkingAdmin) return;
    
    const fetchOrders = async () => {
      try {
        setLoading(true);
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
        
        const delivered = allOrders.filter(order => order.delivered);
        setDeliveredOrders(delivered);

        const paid = allOrders.filter(order => order.paid);
        setPaidOrders(paid);

      } catch (err) {
        console.error("取得訂單錯誤:", err);
        showToast("獲取訂單失敗");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAdmin, checkingAdmin]);

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
      
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, ...updateData, deliveryUpdatedAt: new Date() } : order
      );
      
      setOrders(updatedOrders);
      
      const delivered_updated = updatedOrders.filter(order => order.delivered);
      setDeliveredOrders(delivered_updated);
      
      showToast(delivered ? "✅ 已標記為已交貨" : "📋 已標記為未交貨");
      
    } catch (err) {
      console.error("更新交貨狀態錯誤:", err);
      showToast("❌ 更新失敗：" + err.message);
    }
  };

  // 修正：更新付款狀態
  const updatePaymentStatus = async (orderId, paid) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const updateData = {
        paid,
        paymentUpdatedAt: serverTimestamp(),
        paymentUpdatedBy: displayName,
        paymentUpdatedByName: displayName || user.email || "管理員"
      };
      await updateDoc(orderRef, updateData);
      
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, ...updateData, paymentUpdatedAt: new Date() } : order
      );
      
      setOrders(updatedOrders);
      
      const paid_updated = updatedOrders.filter(order => order.paid);
      setPaidOrders(paid_updated);
      
      showToast(paid ? "✅ 已標記為已付款" : "📋 已標記為未付款");
      
    } catch (err) {
      console.error("更新付款狀態錯誤:", err);
      showToast("❌ 更新失敗：" + err.message);
    }
  };

  // 匯出 Excel
  const exportToExcel = (onlyDelivered = false) => {
    const baseOrders = onlyDelivered ? deliveredOrders : orders;
    const exportOrders = filterOrdersBySchool(baseOrders);
    const exportStats = calculateStatistics(exportOrders);
    
    const summaryData = [];

    // 商品統計
    Object.entries(exportStats.productCounts).forEach(([name, total]) => {
      summaryData.push({
        項目名稱: name,
        總數量: total,
        總金額: exportStats.productCosts[name] || 0,
        類型: "商品"
      });
    });

    // 套餐統計
    Object.entries(exportStats.comboCounts).forEach(([comboName, count]) => {
      const comboInstances = exportOrders.flatMap(o => o.appliedCombos || [])
        .filter(c => c.name === comboName);

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
    summaryData.push({ 項目名稱: "折扣總額", 總數量: "-", 總金額: exportStats.totalDiscount });
    summaryData.push({ 項目名稱: "總營收", 總數量: "-", 總金額: exportStats.totalRevenue });

    // 如果是已交貨統計,加入交貨人員統計
    if (onlyDelivered) {
      const filteredDeliveryStats = calculateDeliveryStats(exportOrders);
      if (Object.keys(filteredDeliveryStats).length > 0) {
        summaryData.push({});
        summaryData.push({ 項目名稱: "=== 交貨人員統計 ===", 總數量: "", 總金額: "" });
        Object.entries(filteredDeliveryStats).forEach(([updater, stats]) => {
          summaryData.push({
            項目名稱: `${updater} (交貨員)`,
            總數量: `${stats.count} 筆訂單`,
            總金額: `NT$ ${stats.totalAmount}`,
            類型: "交貨統計"
          });
        });
      }
    }

    const productSheet = XLSX.utils.json_to_sheet(summaryData);

    // 訂單明細
    const orderRows = [];
    const merges = [];
    let currentRow = 1;
    exportOrders.forEach(order => {
      const createdAt = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : "";
      const deliveryTime = order.deliveryUpdatedAt?.toDate ? order.deliveryUpdatedAt.toDate().toLocaleString() : "";
      const deliveryBy = order.deliveryUpdatedByName || "";
      const deliveryStatus = order.delivered ? "已交貨" : "未交貨";
      const paymentTime = order.paymentUpdatedAt?.toDate ? order.paymentUpdatedAt.toDate().toLocaleString() : "";
      const paymentBy = order.paymentUpdatedByName || "";
      const paymentStatus = order.paid ? "已付款" : "未付款";
      const orderItemCount = order.items.length;
      const startRow = currentRow;
      const endRow = currentRow + orderItemCount - 1;

      if (orderItemCount > 1) {
        const mergeColumns = Array.from({ length: 18 }, (_, i) => i);
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
          交貨更新者: itemIndex === 0 ? deliveryBy : "",
          付款狀態: itemIndex === 0 ? paymentStatus : "",
          付款更新時間: itemIndex === 0 ? paymentTime : "",
          付款更新者: itemIndex === 0 ? paymentBy : "",
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
      { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 12 },
      { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
      { wch: 8 }, { wch: 8 }, { wch: 10 }
    ];
    productSheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 10 }];

    const workbook = XLSX.utils.book_new();
    const schoolPrefix = selectedSchool !== "all" ? `${selectedSchool}_` : "";
    const sheetPrefix = onlyDelivered ? "已交貨" : "全部";
    XLSX.utils.book_append_sheet(workbook, productSheet, `${sheetPrefix}商品統計`);
    XLSX.utils.book_append_sheet(workbook, ordersSheet, `${sheetPrefix}訂單明細`);

    const filename = `${schoolPrefix}${onlyDelivered ? '已交貨' : ''}訂單統計_${new Date().toISOString().slice(0,10)}.xlsx`;
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), filename);
    showToast(`✅ ${selectedSchool !== "all" ? selectedSchool + ' ' : ''}${onlyDelivered ? '已交貨' : '全部'} Excel 已匯出`);
  };

  // 檢查中
  if (checkingAdmin) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔐</div>
          <p style={{ color: "#666" }}>驗證權限中...</p>
        </div>
      </div>
    );
  }

  // 權限不足
  if (!isAdmin) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "20px"
      }}>
        <h2 style={{ color: "#d32f2f", marginBottom: "16px" }}>⚠️ 權限不足</h2>
        <p style={{ color: "#666", marginBottom: "24px" }}>您沒有權限訪問此頁面</p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 28px",
            background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          回到首頁
        </button>
      </div>
    );
  }

  // 載入中
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⏳</div>
          <p style={{ color: "#666" }}>載入中...</p>
        </div>
      </div>
    );
  }

  // 根據選擇的學校和分頁篩選訂單
  const baseOrders = activeTab === "delivered" ? deliveredOrders : orders;
  const currentOrders = filterOrdersBySchool(baseOrders);
  const currentStats = calculateStatistics(currentOrders);

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
      
      <h1 style={{ marginBottom: "20px", color: "#333" }}>後台管理 - 訂單統計</h1>

      {/* 學校篩選器 */}
      <div style={{
        marginBottom: "16px",
        width: "100%",
        maxWidth: "1000px"
      }}>
        <label style={{ 
          display: "block", 
          marginBottom: "8px", 
          fontWeight: "600", 
          color: "#333",
          fontSize: "0.95rem"
        }}>
          篩選學校：
        </label>
        <select
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            fontSize: "1rem",
            cursor: "pointer",
            background: "white",
            outline: "none"
          }}
        >
          <option value="all">全部</option>
          {schools.map(school => (
            <option key={school} value={school}>{school}</option>
          ))}
        </select>
      </div>

      {/* 分頁切換 */}
      <div style={{ 
        display: "flex", 
        gap: "4px", 
        marginBottom: "20px", 
        background: "#f1f5f9", 
        padding: "4px", 
        borderRadius: "12px",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)"
      }}>
        <button
          onClick={() => setActiveTab("all")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "all" ? "white" : "transparent",
            color: activeTab === "all" ? "#1f2937" : "#64748b",
            fontWeight: activeTab === "all" ? "600" : "400",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: activeTab === "all" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
          }}
        >
          全部訂單 ({currentOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("delivered")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: activeTab === "delivered" ? "white" : "transparent",
            color: activeTab === "delivered" ? "#1f2937" : "#64748b",
            fontWeight: activeTab === "delivered" ? "600" : "400",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: activeTab === "delivered" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
          }}
        >
          已交貨 ({currentOrders.filter(o => o.delivered).length})
        </button>
      </div>

      <div style={{ width: "100%", maxWidth: "1000px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* 匯出與總覽卡片 */}
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.08)", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ flex: "1", minWidth: "280px" }}>
            <h2 style={{ margin: 0, color: "#333" }}>
              {selectedSchool !== "all" && `${selectedSchool} - `}
              {activeTab === "delivered" ? "已交貨統計與匯出" : "匯出與總覽"}
            </h2>
            <p style={{ margin: "6px 0 12px", color: "#666", fontSize: "0.95rem" }}>
              {activeTab === "delivered" ? "已完成交貨的訂單統計" : "匯出商品統計與所有訂單明細"}
            </p>
            
            {/* 第一行統計 */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
              <div style={{ background: "#f9fafb", border: "1px solid #eee", borderRadius: "10px", padding: "10px 14px", minWidth: "120px" }}>
                <div style={{ color: "#666", fontSize: "0.85rem" }}>
                  {activeTab === "delivered" ? "已交貨數" : "訂單總數"}
                </div>
                <div style={{ color: "#111", fontWeight: 700, fontSize: "1.2rem" }}>{currentOrders.length}</div>
              </div>
              <div style={{ background: "#f0f9ff", border: "1px solid #e0f2fe", borderRadius: "10px", padding: "10px 14px", minWidth: "140px" }}>
                <div style={{ color: "#0369a1", fontSize: "0.85rem" }}>總營收</div>
                <div style={{ color: "#0c4a6e", fontWeight: 700, fontSize: "1.2rem" }}>NT$ {currentStats.totalRevenue.toLocaleString()}</div>
              </div>
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 14px", minWidth: "140px" }}>
                <div style={{ color: "#92400e", fontSize: "0.85rem" }}>訂單原價</div>
                <div style={{ color: "#78350f", fontWeight: 700, fontSize: "1.2rem" }}>
                  NT$ {currentOrders.reduce((sum, o) => sum + (Number(o.originalTotal) || 0), 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: "#fff1f2", border: "1px solid #ffe4e6", borderRadius: "10px", padding: "10px 14px", minWidth: "140px" }}>
                <div style={{ color: "#be123c", fontSize: "0.85rem" }}>折扣總額</div>
                <div style={{ color: "#9f1239", fontWeight: 700, fontSize: "1.2rem" }}>NT$ {currentStats.totalDiscount.toLocaleString()}</div>
              </div>
            </div>
            
            {/* 第二行統計 */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
              {activeTab === "all" && (
                <>
                  <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "10px 14px", minWidth: "110px" }}>
                    <div style={{ color: "#166534", fontSize: "0.85rem" }}>已交貨</div>
                    <div style={{ color: "#14532d", fontWeight: 700, fontSize: "1.2rem" }}>
                      {currentOrders.filter(o => o.delivered).length}
                    </div>
                  </div>
                  <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 14px", minWidth: "110px" }}>
                    <div style={{ color: "#92400e", fontSize: "0.85rem" }}>未交貨</div>
                    <div style={{ color: "#78350f", fontWeight: 700, fontSize: "1.2rem" }}>
                      {currentOrders.filter(o => !o.delivered).length}
                    </div>
                  </div>
                  <div style={{ background: "#d1fae5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "10px 14px", minWidth: "110px" }}>
                    <div style={{ color: "#065f46", fontSize: "0.85rem" }}>已付款</div>
                    <div style={{ color: "#064e3b", fontWeight: 700, fontSize: "1.2rem" }}>
                      {currentOrders.filter(o => o.paid).length}
                    </div>
                  </div>
                  <div style={{ background: "#fed7aa", border: "1px solid #fdba74", borderRadius: "10px", padding: "10px 14px", minWidth: "110px" }}>
                    <div style={{ color: "#9a3412", fontSize: "0.85rem" }}>未付款</div>
                    <div style={{ color: "#7c2d12", fontWeight: 700, fontSize: "1.2rem" }}>
                      {currentOrders.filter(o => !o.paid).length}
                    </div>
                  </div>
                </>
              )}
              <div style={{ background: "#e0e7ff", border: "1px solid #c7d2fe", borderRadius: "10px", padding: "10px 14px", minWidth: "140px" }}>
                <div style={{ color: "#4338ca", fontSize: "0.85rem" }}>商品總件數</div>
                <div style={{ color: "#3730a3", fontWeight: 700, fontSize: "1.2rem" }}>
                  {currentOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)}
                </div>
              </div>
              <div style={{ background: "#fce7f3", border: "1px solid #fbcfe8", borderRadius: "10px", padding: "10px 14px", minWidth: "140px" }}>
                <div style={{ color: "#9f1239", fontSize: "0.85rem" }}>平均訂單金額</div>
                <div style={{ color: "#881337", fontWeight: 700, fontSize: "1.2rem" }}>
                  NT$ {currentOrders.length > 0 ? Math.round(currentStats.totalRevenue / currentOrders.length).toLocaleString() : 0}
                </div>
              </div>
            </div>
            
            {/* 折扣率 */}
            {currentOrders.length > 0 && (
              <div style={{ 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
                borderRadius: "10px", 
                padding: "12px 16px",
                color: "white",
                display: "inline-block"
              }}>
                <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>平均折扣率</div>
                <div style={{ fontWeight: 700, fontSize: "1.3rem" }}>
                  {(() => {
                    const totalOriginal = currentOrders.reduce((sum, o) => sum + (Number(o.originalTotal) || 0), 0);
                    const discountRate = totalOriginal > 0 ? ((currentStats.totalDiscount / totalOriginal) * 100).toFixed(1) : 0;
                    return `${discountRate}%`;
                  })()}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => exportToExcel(activeTab === "delivered")}
            style={{ 
              padding: "14px 28px", 
              background: "linear-gradient(90deg, #ff512f 0%, #dd2476 100%)", 
              color: "white", 
              border: "none", 
              borderRadius: "10px", 
              fontWeight: "bold", 
              fontSize: "1rem", 
              cursor: "pointer", 
              boxShadow: "0 4px 12px rgba(221,36,118,0.25)",
              alignSelf: "flex-start",
              whiteSpace: "nowrap"
            }}
          >
            📊 匯出 Excel
          </button>
        </div>

        {/* 已交貨統計專屬：交貨人員統計 */}
        {activeTab === "delivered" && (() => {
          const filteredDeliveryStats = calculateDeliveryStats(currentOrders);
          return Object.keys(filteredDeliveryStats).length > 0 && (
            <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.08)", padding: "20px" }}>
              <h2 style={{ margin: "0 0 16px", color: "#333" }}>交貨人員統計</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                {Object.entries(filteredDeliveryStats).map(([updater, stats]) => (
                  <div key={updater} style={{ 
                    padding: "16px", 
                    background: "#f8fafc", 
                    border: "1px solid #e2e8f0", 
                    borderRadius: "8px",
                    textAlign: "center"
                  }}>
                    <div style={{ fontWeight: "bold", color: "#1f2937", marginBottom: "4px" }}>{updater}</div>
                    <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
                      {stats.count} 筆訂單
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: "600", color: "#059669", marginTop: "4px" }}>
                      NT$ {stats.totalAmount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 商品總數量 Card */}
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.08)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 style={{ margin: 0, color: "#333" }}>
            {activeTab === "delivered" ? "已交貨商品統計" : "商品總數量"}
          </h2>
          {Object.keys(currentStats.productCounts).length === 0 ? <p style={{ color: "#555" }}>尚無統計資料</p> : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {Object.entries(currentStats.productCounts).map(([name, total]) => (
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
          <h2 style={{ margin: "0 0 12px", color: "#333" }}>
            {activeTab === "delivered" ? "已交貨訂單" : "所有訂單"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            {currentOrders.map(order => (
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
                  {activeTab === "all" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => updateDeliveryStatus(order.id, true)} disabled={order.delivered} style={{ padding: "6px 12px", borderRadius: "4px", border: "none", background: order.delivered ? "#94a3b8" : "#16a34a", color: "white", fontSize: "0.85rem", fontWeight: "bold", cursor: order.delivered ? "not-allowed" : "pointer" }}>標記已交貨</button>
                      <button onClick={() => updateDeliveryStatus(order.id, false)} disabled={!order.delivered} style={{ padding: "6px 12px", borderRadius: "4px", border: "none", background: !order.delivered ? "#94a3b8" : "#f59e0b", color: "white", fontSize: "0.85rem", fontWeight: "bold", cursor: !order.delivered ? "not-allowed" : "pointer" }}>標記未交貨</button>
                    </div>
                  )}
                </div>
                
                {/* 付款狀態顯示 */}
                <div style={{ background: order.paid ? "#dcfce7" : "#fef3c7", border: `1px solid ${order.paid ? "#16a34a" : "#f59e0b"}`, borderRadius: "8px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ fontWeight: "bold" }}>
                      付款狀態：
                      <span style={{ color: order.paid ? "#16a34a" : "#f59e0b", marginLeft: "8px" }}>
                        {order.paid ? "✅ 已付款" : "⏳ 未付款"}
                      </span>
                    </div>
                    {order.paymentUpdatedAt && <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "4px" }}>
                      最後更新：{order.paymentUpdatedAt.toDate ? order.paymentUpdatedAt.toDate().toLocaleString() : order.paymentUpdatedAt.toLocaleString()} {order.paymentUpdatedByName && `(${order.paymentUpdatedByName})`}
                    </div>}
                  </div>
                  {activeTab === "all" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => updatePaymentStatus(order.id, true)} disabled={order.paid} style={{ padding: "6px 12px", borderRadius: "4px", border: "none", background: order.paid ? "#94a3b8" : "#16a34a", color: "white", fontSize: "0.85rem", fontWeight: "bold", cursor: order.paid ? "not-allowed" : "pointer" }}>標記已付款</button>
                      <button onClick={() => updatePaymentStatus(order.id, false)} disabled={!order.paid} style={{ padding: "6px 12px", borderRadius: "4px", border: "none", background: !order.paid ? "#94a3b8" : "#f59e0b", color: "white", fontSize: "0.85rem", fontWeight: "bold", cursor: !order.paid ? "not-allowed" : "pointer" }}>標記未付款</button>
                    </div>
                  )}
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
                        setDeliveredOrders(prev => prev.filter(o => o.id !== order.id));
                        setPaidOrders(prev => prev.filter(o => o.id !== order.id));
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
            {currentOrders.length === 0 && <p style={{ color: "#555" }}>尚無訂單資料</p>}
          </div>
        </div>
      </div>
    </div>
  );
}