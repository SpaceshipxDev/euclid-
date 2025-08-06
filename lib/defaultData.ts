import { Row } from './types';

// Base data, common to all modes
export const defaultBaseData: Row[] = [
  [
    { id: 'A1', type: 'text', content: '' },
    { id: 'B1', type: 'text', content: 'M3 Pro 笔记本电脑' },
    { id: 'C1', type: 'text', content: '铝合金' },
    { id: 'D1', type: 'text', content: '100' },
    { id: 'E1', type: 'text', content: '深空黑' },
    { id: 'F1', type: 'text', content: '加急订单' }
  ],
  [
    { id: 'A2', type: 'text', content: '' },
    { id: 'B2', type: 'text', content: '无线充电底座' },
    { id: 'C2', type: 'text', content: 'PC+ABS' },
    { id: 'D2', type: 'text', content: '500' },
    { id: 'E2', type: 'text', content: '类肤质喷涂' },
    { id: 'F2', type: 'text', content: '需定制Logo' }
  ],
  [
    { id: 'A3', type: 'text', content: '' },
    { id: 'B3', type: 'text', content: '精密仪器外壳' },
    { id: 'C3', type: 'text', content: '不锈钢 304' },
    { id: 'D3', type: 'text', content: '250' },
    { id: 'E3', type: 'text', content: '镜面抛光' },
    { id: 'F3', type: 'text', content: '' }
  ]
];

// Mode-specific data
export const defaultQuotationData: Row[] = defaultBaseData.map((row, rIndex) => [
  { id: `G${rIndex + 1}`, type: 'text', content: `${(Math.random() * 500 + 100).toFixed(2)}` },
  { id: `H${rIndex + 1}`, type: 'text', content: '' }
]);

export const defaultProductionData: Row[] = defaultBaseData.map((row, rIndex) => [
  { id: `G${rIndex + 1}`, type: 'text', content: 'CNC 5轴' },
  { id: `H${rIndex + 1}`, type: 'text', content: '公差 +/- 0.02mm' }
]);

export const defaultMeta = {
  customerName: 'Apple Inc.',
  orderId: `QUO-${new Date().getFullYear()}-0815`,
  contactPerson: 'Tim Cook',
  notes: 'Urgent project for visionOS.'
};
