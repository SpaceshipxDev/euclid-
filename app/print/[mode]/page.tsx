"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import quotationStyles from "../quotation.module.css";
import outsourcingStyles from "../outsourcing.module.css";
import productionStyles from "../production.module.css";
import shippingStyles from "../shipping.module.css";

type Mode = "quotation" | "outsourcing" | "production" | "shipping";

type Cell = { type: string; content: string };

const baseHeaders = ["图片", "名称", "材料", "数量", "表面处理", "备注", "外协"];
const quotationHeaders = ["单价", "总价"];
const productionHeaders = ["加工方式", "工艺要求"];

const baseColCount = baseHeaders.length;
const quotationColCount = quotationHeaders.length;
const productionColCount = productionHeaders.length;
const outsourcingColIndex = baseColCount - 1;
const baseHeadersWithoutOutsourcing = baseHeaders.slice(0, outsourcingColIndex);
const outsourcingHeader = baseHeaders[outsourcingColIndex];

export default function PrintPage({ params }: { params: { mode: Mode } }) {
  const { mode } = params;
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId") || "1";

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Cell[][]>([]);

  const stylesMap: Record<Mode, { table: string }> = {
    quotation: quotationStyles,
    outsourcing: outsourcingStyles,
    production: productionStyles,
    shipping: shippingStyles,
  } as const;

  useEffect(() => {
    fetch(`/api/spreadsheet?taskId=${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        const cells = data.cells as { row: number; col: number; type: string; content: string }[];
        const fetchedRows = cells.length ? Math.max(...cells.map((c) => c.row)) + 1 : 0;
        const rowsCount = fetchedRows > 0 ? fetchedRows : 4;
        const base: Cell[][] = Array.from({ length: rowsCount }, () =>
          Array.from({ length: baseColCount }, () => ({ type: "text", content: "" }))
        );
        const quotation: Cell[][] = Array.from({ length: rowsCount }, () =>
          Array.from({ length: quotationColCount }, () => ({ type: "text", content: "" }))
        );
        const production: Cell[][] = Array.from({ length: rowsCount }, () =>
          Array.from({ length: productionColCount }, () => ({ type: "text", content: "" }))
        );

        cells.forEach((cell) => {
          if (cell.col < baseColCount) {
            base[cell.row][cell.col] = { type: cell.type, content: cell.content };
          } else if (cell.col < baseColCount + quotationColCount) {
            quotation[cell.row][cell.col - baseColCount] = { type: cell.type, content: cell.content };
          } else {
            production[cell.row][cell.col - baseColCount - quotationColCount] = {
              type: cell.type,
              content: cell.content,
            };
          }
        });

        let currentHeaders: string[] = [];
        let displayData: Cell[][] = [];

        switch (mode) {
          case "quotation": {
            currentHeaders = [
              ...baseHeadersWithoutOutsourcing,
              ...quotationHeaders,
              outsourcingHeader,
            ];
            displayData = base.map((row, i) => {
              const outsourcingCell = row[outsourcingColIndex];
              const baseWithoutOutsourcing = row.slice(0, outsourcingColIndex);
              const quantity = parseFloat(row[3].content) || 0;
              const unitPrice = parseFloat(quotation[i][0].content) || 0;
              const totalPrice = quantity * unitPrice;
              const calculated = [
                { ...quotation[i][0] },
                {
                  ...quotation[i][1],
                  content: totalPrice > 0 ? totalPrice.toFixed(2) : "",
                },
              ];
              return [...baseWithoutOutsourcing, ...calculated, outsourcingCell];
            });
            break;
          }
          case "production": {
            currentHeaders = [
              ...baseHeadersWithoutOutsourcing,
              ...productionHeaders,
              outsourcingHeader,
            ];
            displayData = base.map((row, i) => {
              const outsourcingCell = row[outsourcingColIndex];
              const baseWithoutOutsourcing = row.slice(0, outsourcingColIndex);
              return [...baseWithoutOutsourcing, ...production[i], outsourcingCell];
            });
            break;
          }
          case "outsourcing":
          case "shipping":
          default: {
            currentHeaders = [...baseHeadersWithoutOutsourcing, outsourcingHeader];
            displayData = base.map((row) => {
              const outsourcingCell = row[outsourcingColIndex];
              const baseWithoutOutsourcing = row.slice(0, outsourcingColIndex);
              return [...baseWithoutOutsourcing, outsourcingCell];
            });
            break;
          }
        }

        setHeaders(currentHeaders);
        setRows(displayData);
      });
  }, [taskId, mode]);

  useEffect(() => {
    if (rows.length) {
      window.print();
    }
  }, [rows]);

  const styles = stylesMap[mode];

  return (
    <div>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>
                  {cell.type === "image" && cell.content ? (
                    <img
                      src={cell.content}
                      alt=""
                      style={{ maxWidth: "100px", maxHeight: "100px" }}
                    />
                  ) : (
                    cell.content
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
