"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import quotationStyles from "../quotation.module.css";
import outsourcingStyles from "../outsourcing.module.css";
import productionStyles from "../production.module.css";
import shippingStyles from "../shipping.module.css";

type Mode = "quotation" | "outsourcing" | "production" | "shipping";

type Cell = { type: string; content: string };
type MetaData = {
  customerName?: string;
  contactPerson?: string;
  orderId?: string;
  notes?: string;
  supplier?: string;
  supplierContact?: string;
  purchaseNotes?: string;
  sendOutTime?: string;
};

const baseHeaders = ["图片", "名称", "材料", "数量", "表面处理", "备注", "外协"];
const quotationHeaders = ["单价", "总价"];
const productionHeaders = ["加工方式", "工艺要求"];

const baseColCount = baseHeaders.length;
const quotationColCount = quotationHeaders.length;
const productionColCount = productionHeaders.length;
const outsourcingColIndex = baseColCount - 1;
const baseHeadersWithoutOutsourcing = baseHeaders.slice(0, outsourcingColIndex);

export default function PrintPage({ params }: { params: { mode: Mode } }) {
  const { mode } = params;
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId") || "1";

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Cell[][]>([]);
  const [metaData, setMetaData] = useState<MetaData>({});

  const stylesMap: Record<Mode, any> = {
    quotation: quotationStyles,
    outsourcing: outsourcingStyles,
    production: productionStyles,
    shipping: shippingStyles,
  };
  
  const styles = stylesMap[mode];

  useEffect(() => {
    if (!taskId) return;
    fetch(`/api/spreadsheet?taskId=${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        setMetaData(data.meta || {});
        const cells = data.cells as { row: number; col: number; type: string; content: string }[];
        const fetchedRows = cells.length ? Math.max(...cells.map((c) => c.row)) + 1 : 0;
        const rowsCount = Math.max(fetchedRows, 10);
        
        const base: Cell[][] = Array.from({ length: rowsCount }, () => Array.from({ length: baseColCount }, () => ({ type: "text", content: "" })));
        const quotation: Cell[][] = Array.from({ length: rowsCount }, () => Array.from({ length: quotationColCount }, () => ({ type: "text", content: "" })));
        const production: Cell[][] = Array.from({ length: rowsCount }, () => Array.from({ length: productionColCount }, () => ({ type: "text", content: "" })));

        cells.forEach((cell) => {
          if (cell.row >= rowsCount) return;
          if (cell.col < baseColCount) {
            base[cell.row][cell.col] = { type: cell.type, content: cell.content };
          } else if (cell.col < baseColCount + quotationColCount) {
            quotation[cell.row][cell.col - baseColCount] = { type: cell.type, content: cell.content };
          } else {
            production[cell.row][cell.col - baseColCount - quotationColCount] = { type: cell.type, content: cell.content };
          }
        });

        let currentHeaders: string[] = [];
        let displayData: Cell[][] = [];

        switch (mode) {
          case "quotation": {
            currentHeaders = [ "序号", ...baseHeadersWithoutOutsourcing, ...quotationHeaders];
            displayData = base.map((row, i) => {
              const baseWithoutOutsourcing = row.slice(0, outsourcingColIndex);
              const quantity = parseFloat(row[3].content) || 0;
              const unitPrice = parseFloat(quotation[i][0].content) || 0;
              const totalPrice = quantity * unitPrice;
              const calculated = [
                { ...quotation[i][0], content: unitPrice > 0 ? unitPrice.toFixed(2) : '' },
                { ...quotation[i][1], content: totalPrice > 0 ? totalPrice.toFixed(2) : '' },
              ];
              const itemNumberCell = { type: 'text', content: row.some(c => c.content) ? (i + 1).toString() : '' };
              return [itemNumberCell, ...baseWithoutOutsourcing, ...calculated];
            });
            break;
          }
          case "outsourcing": {
            // Updated header order
            currentHeaders = [ "序号", "图片", "名称", "材料", "表面处理", "数量", "单价", "总价"];
            
            const outsourcedItems = base
                .map((row, i) => ({ row, i }))
                .filter(({ row }) => row[outsourcingColIndex].content === 'true');
            
            displayData = Array.from({ length: rowsCount }, (_, index) => {
                if (index < outsourcedItems.length) {
                    const { row, i } = outsourcedItems[index];
                    // Updated cell order: [图片, 名称, 材料, 表面处理, 数量]
                    const baseCells = [row[0], row[1], row[2], row[4], row[3]]; 
                    
                    const quantity = parseFloat(row[3].content) || 0;
                    const unitPrice = parseFloat(quotation[i][0].content) || 0;
                    const totalPrice = quantity * unitPrice;

                    const calculatedPriceCells = [
                      { ...quotation[i][0], content: unitPrice > 0 ? unitPrice.toFixed(2) : '' },
                      { ...quotation[i][1], content: totalPrice > 0 ? totalPrice.toFixed(2) : '' },
                    ];

                    const itemNumberCell = { type: 'text', content: (index + 1).toString() };
                    
                    return [itemNumberCell, ...baseCells, ...calculatedPriceCells];
                }
                return Array(currentHeaders.length).fill({ type: 'text', content: '' });
            });
            break;
          }
          default: {
            displayData = base.map((row) => row.slice(0, outsourcingColIndex));
            currentHeaders = baseHeadersWithoutOutsourcing;
            break;
          }
        }
        setHeaders(currentHeaders);
        setRows(displayData);
      });
  }, [taskId, mode]);

  const totalAmount = useMemo(() => {
    if (mode !== 'quotation' && mode !== 'outsourcing') return 0;
    
    const priceColIndex = headers.indexOf('总价');
    if (priceColIndex === -1) return 0;
    
    return rows.reduce((sum, row) => {
        const totalPriceCell = row[priceColIndex];
        const price = parseFloat(totalPriceCell?.content) || 0;
        return sum + price;
    }, 0);
  }, [rows, headers, mode]);

  useEffect(() => {
    if (rows.length > 0) {
      setTimeout(() => window.print(), 500);
    }
  }, [rows]);

  if (mode === 'quotation') {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
            <h1 className={styles.title}>手板报价单</h1>
            <div className={styles.parties}>
                <div className={styles.party}>
                    <span>甲方：{metaData.customerName || '________________'}</span>
                    <span>联系人：{metaData.contactPerson || '________________'}</span>
                </div>
                <div className={styles.party}>
                    <span>乙方：杭州越侬模型科技有限公司</span>
                    <span>联系人：傅士勤</span>
                </div>
            </div>
             <div className={styles.meta}>
                <span>订单号: {metaData.orderId || 'N/A'}</span>
                <span>电话: 13777479066</span>
                <span>日期: {new Date().toLocaleDateString('zh-CN')}</span>
                <span>地址：杭州市富阳区</span>
            </div>
        </header>
        <main>
            <table className={styles.table}>
                <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i}>{row.map((cell, j) => (
                            <td key={j} className={['单价', '总价', '数量'].includes(headers[j]) ? styles.numeric : ''}>
                                {cell.type === "image" && cell.content ? <img src={cell.content} alt="" className={styles.imageCell} /> : <span>{cell.content}</span>}
                            </td>))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
        <footer className={styles.footer}>
            <div className={styles.notes}>备注：{metaData.notes || '无'}</div>
            <div className={styles.summary}>
                <div className={styles.total}>
                    <span>合计 (RMB):</span>
                    <span className={styles.totalAmount}>{totalAmount > 0 ? totalAmount.toFixed(2) : '0.00'}</span>
                </div>
                <div className={styles.signature}>
                    <span>审核/签字:</span><span className={styles.signatureLine}></span>
                </div>
            </div>
        </footer>
      </div>
    );
  }

  if (mode === 'outsourcing') {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>采&nbsp;&nbsp;购&nbsp;&nbsp;单</h1>
                <div className={styles.metaGrid}>
                    <span>采购单号：{metaData.orderId || '________________'}</span>
                    <span>寄出时间：{metaData.sendOutTime ? new Date(metaData.sendOutTime).toLocaleDateString('zh-CN') : '________________'}</span>
                    <span>供应商：{metaData.supplier || '________________'}</span>
                    <span>联系人：{metaData.supplierContact || '________________'}</span>
                    <span className={styles.fullWidth}>收件地址：杭州市富阳区</span>
                    <span className={styles.fullWidth}>收件人：王雪梅</span>
                </div>
            </header>
            <main>
                <table className={styles.table}>
                    <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i}>{row.map((cell, j) => (
                                <td key={j} className={['单价', '总价', '数量'].includes(headers[j]) ? styles.numeric : ''}>
                                    {cell.type === "image" && cell.content ? <img src={cell.content} alt="" className={styles.imageCell} /> : <span>{cell.content}</span>}
                                </td>))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
            <footer className={styles.footer}>
                <div className={styles.notes}>采购备注：{metaData.purchaseNotes || '无'}</div>
                <div className={styles.summary}>
                    <div className={styles.total}>
                        <span>合计 (RMB):</span>
                        <span className={styles.totalAmount}>{totalAmount > 0 ? totalAmount.toFixed(2) : '0.00'}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
  }

  return (
    <div>
      <h2>{mode.charAt(0).toUpperCase() + mode.slice(1)} Print View</h2>
      <p>This print view has not been designed yet.</p>
    </div>
  );
}