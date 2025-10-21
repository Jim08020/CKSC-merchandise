export const products = [
  { id: 1, textid: "1", no: 1, name: "棒球外套", price: 700, orPrice: 900 },
  { id: 2_1, textid: "2_1", no: 2, name: "CKHS深藍短踢", price: 300, orPrice: 500 },
  { id: 2_2, textid: "2_2", no: 2, name: "CKHS白短踢", price: 300, orPrice: 500 },
  { id: 2_3, textid: "2_3", no: 2, name: "我沒有偷卷短踢", price: 300, orPrice: 500 },
  { id: 3, textid: "3", no: 3, name: "真皮證件套", price: 200, orPrice: 400 },
  { id: 4_1, textid: "4_1", no: 4, name: "CKHS白帽踢", price: 650, orPrice: 850 },
  { id: 4_2, textid: "4_2", no: 4, name: "CKHS黑帽踢", price: 650, orPrice: 850 },
  { id: 5, textid: "5", no: 5, name: "毛巾", price: 200, orPrice: 400 },
  { id: 6, textid: "6", no: 6, name: "包包", price: 750, orPrice: 950 },
  { id: 7_1, textid: "7_1", no: 7, name: "不得外出鑰匙圈", price: 50, orPrice: 70 },
  { id: 7_2, textid: "7_2", no: 7, name: "CKHS鑰匙圈", price: 50, orPrice: 70 },
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
    { size: "S", length: 65, sleeve: 19, chest: 49, shoulder: 42, productId: 1_1 },
    { size: "M", length: 69, sleeve: 20, chest: 52, shoulder: 46, productId: 1_2 },
    { size: "L", length: 73, sleeve: 22, chest: 55, shoulder: 50, productId: 1_3 },
    { size: "XL", length: 77, sleeve: 24, chest: 58, shoulder: 54, productId: 1_4 },
    { size: "XXL", length: 81, sleeve: 25, chest: 63, shoulder: 57, productId: 1_5 },
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
    { size: "S", length: 65, sleeve: 52, chest: 110, shoulder: 56, productId: 4_1 },
    { size: "M", length: 67, sleeve: 53, chest: 114, shoulder: 58, productId: 4_2 },
    { size: "L", length: 69, sleeve: 54, chest: 118, shoulder: 60, productId: 4_3 },
    { size: "XL", length: 71, sleeve: 55, chest: 122, shoulder: 62, productId: 4_4 },
    { size: "2L", length: 73, sleeve: 56, chest: 126, shoulder: 64, productId: 4_5 },
];

export const sizeData4_2 = [
    { size: "S", length: 65, sleeve: 52, chest: 110, shoulder: 56, productId: 4_6 },
    { size: "M", length: 67, sleeve: 53, chest: 114, shoulder: 58, productId: 4_7 },
    { size: "L", length: 69, sleeve: 54, chest: 118, shoulder: 60, productId: 4_8 },
    { size: "XL", length: 71, sleeve: 55, chest: 122, shoulder: 62, productId: 4_9 },
    { size: "2L", length: 73, sleeve: 56, chest: 126, shoulder: 64, productId: 4_10 },
];

export const product1s = [
    { id: 1_1, no: 1, name: "棒球外套S", price: 700, orPrice: 900 },
    { id: 1_2, no: 1, name: "棒球外套M", price: 700, orPrice: 900 },
    { id: 1_3, no: 1, name: "棒球外套L", price: 700, orPrice: 900 },
    { id: 1_4, no: 1, name: "棒球外套XL", price: 700, orPrice: 900 },
    { id: 1_5, no: 1, name: "棒球外套2L", price: 700, orPrice: 900 },
];

export const product2_1s = [
    { id: 2_1, no: 2, name: "CKHS深藍短踢-S", price: 300, orPrice: 500 },
    { id: 2_2, no: 2, name: "CKHS深藍短踢-M", price: 300, orPrice: 500 },
    { id: 2_3, no: 2, name: "CKHS深藍短踢-L", price: 300, orPrice: 500 },
    { id: 2_4, no: 2, name: "CKHS深藍短踢-XL", price: 300, orPrice: 500 },
    { id: 2_5, no: 2, name: "CKHS深藍短踢-2L", price: 390, orPrice: 500 },
];

export const product2_2s = [
    { id: 2_6, no: 2, name: "CKHS白短踢-S", price: 300, orPrice: 500 },
    { id: 2_7, no: 2, name: "CKHS白短踢-M", price: 300, orPrice: 500 },
    { id: 2_8, no: 2, name: "CKHS白短踢-L", price: 300, orPrice: 500 },
    { id: 2_9, no: 2, name: "CKHS白短踢-XL", price: 300, orPrice: 500 },
    { id: 2_10, no: 2, name: "CKHS白短踢-2L", price: 390, orPrice: 500 },
];

export const product2_3s = [
    { id: 2_11, no: 2, name: "我沒有偷卷短踢-S", price: 300, orPrice: 500 },
    { id: 2_12, no: 2, name: "我沒有偷卷短踢-M", price: 300, orPrice: 500 },
    { id: 2_13, no: 2, name: "我沒有偷卷短踢-L", price: 300, orPrice: 500 },
    { id: 2_14, no: 2, name: "我沒有偷卷短踢-XL", price: 300, orPrice: 500 },
    { id: 2_15, no: 2, name: "我沒有偷卷短踢-2L", price: 390, orPrice: 500 },
];

export const product4_1s = [
    { id: 4_1, no: 4, name: "CKHS白帽踢-S", price: 650, orPrice: 850 },
    { id: 4_2, no: 4, name: "CKHS白帽踢-M", price: 650, orPrice: 850 },
    { id: 4_3, no: 4, name: "CKHS白帽踢-L", price: 650, orPrice: 850 },
    { id: 4_4, no: 4, name: "CKHS白帽踢-XL", price: 650, orPrice: 850 },
    { id: 4_5, no: 4, name: "CKHS白帽踢-2L", price: 650, orPrice: 850 },
];

export const product4_2s = [
    { id: 4_6, no: 4, name: "CKHS黑帽踢-S", price: 650, orPrice: 850 },
    { id: 4_7, no: 4, name: "CKHS黑帽踢-M", price: 650, orPrice: 850 },
    { id: 4_8, no: 4, name: "CKHS黑帽踢-L", price: 650, orPrice: 850 },
    { id: 4_9, no: 4, name: "CKHS黑帽踢-XL", price: 650, orPrice: 850 },
    { id: 4_10, no: 4, name: "CKHS黑帽踢-2L", price: 650, orPrice: 850 },
];