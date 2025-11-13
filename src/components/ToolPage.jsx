import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

export default function OrderDataFixer() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fixedCount, setFixedCount] = useState(0);
  const [errors, setErrors] = useState([]);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const loadOrders = async () => {
    if (!db) {
      addLog('❌ Firebase 尚未初始化', 'error');
      return;
    }

    try {
      setIsLoading(true);
      addLog('📥 開始載入訂單...');

      const ordersRef = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);

      const ordersData = [];
      ordersSnapshot.forEach(doc => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          ...data,
          hasClassNumber: !!(data.classandnumber || data.classNumber),
          classandnumber: data.classandnumber || data.classNumber || '',
        });
      });

      setOrders(ordersData);

      // 同時載入所有用戶資料以便後續比對
      addLog('📥 載入用戶資料...');
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const usersData = [];
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          email: data.email,
          classandnumber: data.classandnumber || data.classNumber || '',
          name: data.name || '',
          school: data.school || '',
          phone: data.phone || ''
        });
      });
      
      setUsers(usersData);

      const missingCount = ordersData.filter(order => !order.hasClassNumber).length;
      addLog(`✅ 載入完成！共 ${ordersData.length} 筆訂單，${usersData.length} 筆用戶，${missingCount} 筆訂單缺少班級座號`, 'success');
    } catch (error) {
      addLog(`❌ 載入資料失敗: ${error.message}`, 'error');
      setErrors(prev => [...prev, error.message]);
    } finally {
      setIsLoading(false);
    }
  };

  const findUserByEmail = (email) => {
    if (!email) return null;
    return users.find(user => user.email && user.email.toLowerCase() === email.toLowerCase());
  };

  const fixOrders = async () => {
    if (!db) {
      addLog('❌ Firebase 尚未初始化', 'error');
      return;
    }

    try {
      setIsLoading(true);
      setFixedCount(0);
      addLog('🔧 開始修復訂單...');

      let fixed = 0;
      let skipped = 0;
      let failed = 0;
      let emailMatched = 0;

      for (const order of orders) {
        if (order.hasClassNumber) {
          skipped++;
          continue;
        }

        try {
          let userData = null;
          let matchMethod = '';

          // 方法 1: 先嘗試用 userId 直接查找
          if (order.userId) {
            const userRef = doc(db, 'users', order.userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              userData = userDoc.data();
              matchMethod = 'userId';
            }
          }

          // 方法 2: 如果找不到，用 email 比對
          if (!userData && order.customerEmail) {
            const matchedUser = findUserByEmail(order.customerEmail);
            if (matchedUser) {
              userData = matchedUser;
              matchMethod = 'email';
              emailMatched++;
            }
          }

          // 如果找到用戶資料，開始更新
          if (userData) {
            const classandnumber = userData.classandnumber || userData.classNumber || '';
            const customerName = userData.name || order.customerName || '';
            const school = userData.school || order.school || '';
            const customerPhone = userData.phone || order.customerPhone || '';

            if (classandnumber || customerName || school || customerPhone) {
              const orderRef = doc(db, 'orders', order.id);
              const updateData = {
                updatedAt: new Date(),
                dataFixed: true,
                matchMethod // 記錄是用哪種方式找到的
              };

              // 只更新有值的欄位
              if (classandnumber) updateData.classandnumber = classandnumber;
              if (customerName && !order.customerName) updateData.customerName = customerName;
              if (school && !order.school) updateData.school = school;
              if (customerPhone && !order.customerPhone) updateData.customerPhone = customerPhone;

              await updateDoc(orderRef, updateData);

              fixed++;
              const updatedFields = [];
              if (classandnumber) updatedFields.push(`班級座號: ${classandnumber}`);
              if (customerName && !order.customerName) updatedFields.push(`姓名: ${customerName}`);
              if (school && !order.school) updatedFields.push(`學校: ${school}`);
              if (customerPhone && !order.customerPhone) updatedFields.push(`電話: ${customerPhone}`);

              addLog(
                `✅ 訂單 ${order.id.substring(0, 8)}... 已更新 (${matchMethod === 'email' ? '📧 Email比對' : '🆔 userId比對'}): ${updatedFields.join(', ')}`,
                'success'
              );
            } else {
              skipped++;
              addLog(`⚠️ 訂單 ${order.id.substring(0, 8)}... 用戶沒有可用的資料`, 'warning');
            }
          } else {
            failed++;
            addLog(
              `❌ 訂單 ${order.id.substring(0, 8)}... 找不到用戶資料 (Email: ${order.customerEmail || '無'})`,
              'error'
            );
          }
        } catch (error) {
          failed++;
          addLog(`❌ 訂單 ${order.id.substring(0, 8)}... 更新失敗: ${error.message}`, 'error');
          setErrors(prev => [...prev, `訂單 ${order.id}: ${error.message}`]);
        }

        // 每處理 5 筆稍微延遲，避免過載
        if ((fixed + skipped + failed) % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setFixedCount(fixed);
      addLog(`\n🎉 修復完成！`, 'success');
      addLog(`✅ 成功修復: ${fixed} 筆 (其中 ${emailMatched} 筆透過 Email 比對)`, 'success');
      addLog(`⚠️ 跳過: ${skipped} 筆`, 'warning');
      addLog(`❌ 失敗: ${failed} 筆`, 'error');

      // 重新載入訂單以顯示最新狀態
      await loadOrders();
    } catch (error) {
      addLog(`❌ 修復過程發生錯誤: ${error.message}`, 'error');
      setErrors(prev => [...prev, error.message]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setErrors([]);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '16px', fontSize: '2rem' }}>
          🔧 訂單資料修復工具
        </h1>
        <p style={{ textAlign: 'center', color: '#6c757d', marginBottom: '32px' }}>
          支援 userId 直接比對和 Email 比對雙重機制
        </p>

        <div style={{ marginBottom: '32px', padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #dee2e6' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: '#495057' }}>
            步驟 1: 載入訂單與用戶資料
          </h2>
          <button
            onClick={loadOrders}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              marginRight: '12px'
            }}
          >
            {isLoading ? '載入中...' : '載入所有資料'}
          </button>
          {orders.length > 0 && (
            <span style={{ color: '#6c757d', fontSize: '0.95rem' }}>
              已載入 {orders.length} 筆訂單、{users.length} 筆用戶資料
            </span>
          )}
        </div>

        {orders.length > 0 && (
          <div style={{ marginBottom: '32px', padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #dee2e6' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: '#495057' }}>
              訂單狀態
            </h2>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#e9ecef' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>訂單 ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>客戶姓名</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>學校</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>班級座號</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr key={order.id} style={{ background: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', fontSize: '0.85rem' }}>
                        {order.id.substring(0, 12)}...
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                        {order.customerName || '未提供'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', fontSize: '0.85rem' }}>
                        {order.customerEmail || '未提供'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                        {order.school || '未提供'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                        {order.classandnumber || <span style={{ color: '#dc3545' }}>缺少</span>}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                        {order.hasClassNumber ? (
                          <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓</span>
                        ) : (
                          <span style={{ color: '#dc3545', fontWeight: 'bold' }}>✗</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {orders.length > 0 && (
          <div style={{ marginBottom: '32px', padding: '20px', background: '#fff3cd', borderRadius: '12px', border: '2px solid #ffc107' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: '#856404' }}>
              步驟 2: 執行修復
            </h2>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #ffc107' }}>
              <p style={{ margin: '0 0 8px 0', color: '#856404', fontWeight: 'bold' }}>
                🔍 修復策略：
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
                <li>優先使用 userId 直接查找用戶資料</li>
                <li>如果找不到，則使用訂單中的 Email 比對用戶資料</li>
                <li>更新班級座號、姓名、學校、電話等缺失資訊</li>
              </ul>
            </div>
            <p style={{ marginBottom: '16px', color: '#856404' }}>
              ⚠️ 此操作將會更新所有缺少資料的訂單。請確保您已備份資料。
            </p>
            <button
              onClick={fixOrders}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(90deg, #ff512f 0%, #dd2476 100%)',
                color: 'white',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? '修復中...' : '開始修復訂單'}
            </button>
            {fixedCount > 0 && (
              <span style={{ marginLeft: '16px', color: '#28a745', fontWeight: 'bold' }}>
                ✅ 已修復 {fixedCount} 筆訂單
              </span>
            )}
          </div>
        )}

        {logs.length > 0 && (
          <div style={{ padding: '20px', background: '#212529', borderRadius: '12px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>執行日誌</h2>
              <button
                onClick={clearLogs}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #6c757d',
                  background: '#343a40',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                清除日誌
              </button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {logs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #495057',
                    color: log.type === 'error' ? '#ff6b6b' : log.type === 'success' ? '#51cf66' : log.type === 'warning' ? '#ffd43b' : 'white'
                  }}
                >
                  <span style={{ color: '#6c757d', marginRight: '8px' }}>[{log.time}]</span>
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}