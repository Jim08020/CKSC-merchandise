export const products = [
  { id: 1, textid: "1", no: 1, name: "棒球外套", price: 700, orPrice: 900 },
  { id: 2_1, textid: "2_1", no: 2, name: "棉短踢", category: "A", price: 300, orPrice: 500 },
  { id: 2_2, textid: "2_2", no: 2, name: "棉短踢", category: "B", price: 300, orPrice: 500 },
  { id: 2_3, textid: "2_3", no: 2, name: "棉短踢", category: "C", price: 300, orPrice: 500 },
  { id: 3, textid: "3", no: 3, name: "真皮證件套", price: 200, orPrice: 400 },
  { id: 4_1, textid: "4_1", no: 4, name: "帽踢", category: "A", price: 650, orPrice: 850 },
  { id: 4_2, textid: "4_2", no: 4, name: "帽踢", category: "B", price: 650, orPrice: 850 },
  { id: 5, textid: "5", no: 5, name: "毛巾", price: 200, orPrice: 400 },
  { id: 6, textid: "6", no: 6, name: "包包", price: 750, orPrice: 950 },
  { id: 7_1, textid: "7_1", no: 7, name: "鑰匙圈", category: "A", price: 50, orPrice: 70 },
  { id: 7_2, textid: "7_2", no: 7, name: "鑰匙圈", category: "B", price: 50, orPrice: 70 },
  { id: 8, textid: "8", no: 8, name: "徽章", price: 50, orPrice: 70 },
];

export const comboDeals = [
  {
    id: "combo1",
    name: "組合包A",
    items: [2, 5], // 短踢+毛巾
    originalPrice: 750,
    comboPrice: 400,
    discount: 350,
  },
  {
    id: "combo2",
    name: "組合包B",
    items: [1, 4], // 棒球外套+帽踢
    originalPrice: 1600,
    comboPrice: 1250,
    discount: 350,
  },
  {
    id: "combo3",
    name: "組合包C",
    items: [1, 2, 4], // 棒球外套+帽踢+短踢
    originalPrice: 1900,
    comboPrice: 1500,
    discount: 400,
  },
  {
    id: "combo4",
    name: "全套組合包",
    items: [1, 2, 3, 4, 5, 6, 7, 8],
    originalPrice: 3000,
    comboPrice: 2500,
    discount: 500,
  },
];

export const sizeData1 = [
    { size: "S", length: 64, sleeve: 51, chest: 114, shoulder: 50, productId: 1_1 },
    { size: "M", length: 66, sleeve: 53, chest: 118, shoulder: 52, productId: 1_2 },
    { size: "L", length: 68, sleeve: 55, chest: 122, shoulder: 54, productId: 1_3 },
    { size: "XL", length: 70, sleeve: 57, chest: 126, shoulder: 56, productId: 1_4 },
    { size: "2L", length: 72, sleeve: 59, chest: 130, shoulder: 58, productId: 1_5 },
];

export const sizeData2_1 = [
    { size: "S", length: 64, sleeve: 51, chest: 114, shoulder: 50, productId: 2_1 },
    { size: "M", length: 66, sleeve: 53, chest: 118, shoulder: 52, productId: 2_2 },
    { size: "L", length: 68, sleeve: 55, chest: 122, shoulder: 54, productId: 2_3 },
    { size: "XL", length: 70, sleeve: 57, chest: 126, shoulder: 56, productId: 2_4 },
    { size: "2L", length: 72, sleeve: 59, chest: 130, shoulder: 58, productId: 2_5 },
];

export const sizeData2_2 = [
    { size: "S", length: 64, sleeve: 51, chest: 114, shoulder: 50, productId: 2_6 },
    { size: "M", length: 66, sleeve: 53, chest: 118, shoulder: 52, productId: 2_7 },
    { size: "L", length: 68, sleeve: 55, chest: 122, shoulder: 54, productId: 2_8 },
    { size: "XL", length: 70, sleeve: 57, chest: 126, shoulder: 56, productId: 2_9 },
    { size: "2L", length: 72, sleeve: 59, chest: 130, shoulder: 58, productId: 2_10 },
];

export const sizeData2_3 = [
    { size: "S", length: 64, sleeve: 51, chest: 114, shoulder: 50, productId: 2_11 },
    { size: "M", length: 66, sleeve: 53, chest: 118, shoulder: 52, productId: 2_12 },
    { size: "L", length: 68, sleeve: 55, chest: 122, shoulder: 54, productId: 2_13 },
    { size: "XL", length: 70, sleeve: 57, chest: 126, shoulder: 56, productId: 2_14 },
    { size: "2L", length: 72, sleeve: 59, chest: 130, shoulder: 58, productId: 2_15 },
];

export const sizeData4_1 = [
    { size: "S", length: 64, sleeve: 51, chest: 114, shoulder: 50, productId: 4_1 },
    { size: "M", length: 66, sleeve: 53, chest: 118, shoulder: 52, productId: 4_2 },
    { size: "L", length: 68, sleeve: 55, chest: 122, shoulder: 54, productId: 4_3 },
    { size: "XL", length: 70, sleeve: 57, chest: 126, shoulder: 56, productId: 4_4 },
    { size: "2L", length: 72, sleeve: 59, chest: 130, shoulder: 58, productId: 4_5 },
];

export const sizeData4_2 = [
    { size: "S", length: 64, sleeve: 51, chest: 114, shoulder: 50, productId: 4_6 },
    { size: "M", length: 66, sleeve: 53, chest: 118, shoulder: 52, productId: 4_7 },
    { size: "L", length: 68, sleeve: 55, chest: 122, shoulder: 54, productId: 4_8 },
    { size: "XL", length: 70, sleeve: 57, chest: 126, shoulder: 56, productId: 4_9 },
    { size: "2L", length: 72, sleeve: 59, chest: 130, shoulder: 58, productId: 4_10 },
];

export const product1s = [
    { id: 1_1, no: 1, name: "棒球外套S", price: 700, orPrice: 900 },
    { id: 1_2, no: 1, name: "棒球外套M", price: 700, orPrice: 900 },
    { id: 1_3, no: 1, name: "棒球外套L", price: 700, orPrice: 900 },
    { id: 1_4, no: 1, name: "棒球外套XL", price: 700, orPrice: 900 },
    { id: 1_5, no: 1, name: "棒球外套2L", price: 700, orPrice: 900 },
];

export const product2_1s = [
    { id: 2_1, no: 2, name: "棉短踢A-S", price: 300, orPrice: 500 },
    { id: 2_2, no: 2, name: "棉短踢A-M", price: 300, orPrice: 500 },
    { id: 2_3, no: 2, name: "棉短踢A-L", price: 300, orPrice: 500 },
    { id: 2_4, no: 2, name: "棉短踢A-XL", price: 300, orPrice: 500 },
    { id: 2_5, no: 2, name: "棉短踢A-2L", price: 390, orPrice: 500 },
];

export const product2_2s = [
    { id: 2_6, no: 2, name: "棉短踢B-S", price: 300, orPrice: 500 },
    { id: 2_7, no: 2, name: "棉短踢B-M", price: 300, orPrice: 500 },
    { id: 2_8, no: 2, name: "棉短踢B-L", price: 300, orPrice: 500 },
    { id: 2_9, no: 2, name: "棉短踢B-XL", price: 300, orPrice: 500 },
    { id: 2_10, no: 2, name: "棉短踢B-2L", price: 390, orPrice: 500 },
];

export const product2_3s = [
    { id: 2_11, no: 2, name: "棉短踢C-S", price: 300, orPrice: 500 },
    { id: 2_12, no: 2, name: "棉短踢C-M", price: 300, orPrice: 500 },
    { id: 2_13, no: 2, name: "棉短踢C-L", price: 300, orPrice: 500 },
    { id: 2_14, no: 2, name: "棉短踢C-XL", price: 300, orPrice: 500 },
    { id: 2_15, no: 2, name: "棉短踢C-2L", price: 390, orPrice: 500 },
];

export const product4_1s = [
    { id: 4_1, no: 4, name: "帽踢A-S", price: 650, orPrice: 850 },
    { id: 4_2, no: 4, name: "帽踢A-M", price: 650, orPrice: 850 },
    { id: 4_3, no: 4, name: "帽踢A-L", price: 650, orPrice: 850 },
    { id: 4_4, no: 4, name: "帽踢A-XL", price: 650, orPrice: 850 },
    { id: 4_5, no: 4, name: "帽踢A-2L", price: 650, orPrice: 850 },
];

export const product4_2s = [
    { id: 4_6, no: 4, name: "帽踢B-S", price: 650, orPrice: 850 },
    { id: 4_7, no: 4, name: "帽踢B-M", price: 650, orPrice: 850 },
    { id: 4_8, no: 4, name: "帽踢B-L", price: 650, orPrice: 850 },
    { id: 4_9, no: 4, name: "帽踢B-XL", price: 650, orPrice: 850 },
    { id: 4_10, no: 4, name: "帽踢B-2L", price: 650, orPrice: 850 },
];

export const adminEmails = [
  "ck11300333@gl.ck.tp.edu.tw", //80-1主席，網站管理員
  "chris20090731@gmail.com", //同上
  "ck11300329@gl.ck.tp.edu.tw", //80-1資訊長，網站管理員
  "ck11300569@gl.ck.tp.edu.tw", //80-1服務長
  "ck11300110@gl.ck.tp.edu.tw", //80-1副主席
  "ck11300044@gl.ck.tp.edu.tw", //80-1服務執行王猷巽
  "ck11300307@gl.ck.tp.edu.tw", //80-1服務執行洪鈵椉
  "ck11300554@gl.ck.tp.edu.tw", //80-1服務執行陳謙行
  "stud2@gl.ck.tp.edu.tw"//社團活動組楊蕙瑜組長
]