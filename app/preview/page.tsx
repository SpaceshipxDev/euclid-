"use client";

import { useState, useRef, useEffect, FC, ChangeEvent, KeyboardEvent, ClipboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

// --- TYPES ---
type Cell = { id: string; type: 'text' | 'image'; content: string };
type Row = Cell[];
type Mode = 'quotation' | 'production' | 'shipping';


// --- HEADERS ---
const baseHeaders = ["图片", "名称", "材料", "数量", "表面处理", "备注"];
const quotationHeaders = ["单价", "总价"];
const productionHeaders = ["加工方式", "工艺要求"];

const baseColCount = baseHeaders.length;
const quotationColCount = quotationHeaders.length;
const productionColCount = productionHeaders.length;

function cellId(col: number, row: number) {
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

// --- COMPONENTS ---

// ModeSelector: A beautiful, animated segmented control
const ModeSelector: FC<{ selected: Mode; onSelect: (mode: Mode) => void; }> = ({ selected, onSelect }) => {
  const modes: { id: Mode; label: string }[] = [
    { id: 'quotation', label: '报价单' },
    { id: 'production', label: '生产单' },
    { id: 'shipping', label: '出货单' },
  ];

  return (
    <div className="flex space-x-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 p-1 print:hidden">
      {modes.map(mode => (
        <button
          key={mode.id}
          onClick={() => onSelect(mode.id)}
          className={`relative w-24 rounded-lg py-1.5 text-sm font-medium transition-colors
            ${selected === mode.id ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
        >
          {selected === mode.id && (
            <motion.div
              layoutId="mode-selector-active-bg"
              className="absolute inset-0 z-0 rounded-lg bg-white dark:bg-neutral-700 shadow-sm"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10">{mode.label}</span>
        </button>
      ))}
    </div>
  );
};


// EditableCell: Unchanged from previous version
interface EditableCellProps {
  cell: Cell;
  onUpdate: (newContent: string, newType: 'text' | 'image') => void;
}
const EditableCell: FC<EditableCellProps> = ({ cell, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(cell.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isEditing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [isEditing]);
  useEffect(() => { setInputValue(cell.content); }, [cell.content]);
  
  const handleBlur = () => { setIsEditing(false); if (inputValue !== cell.content) { onUpdate(inputValue, 'text'); } };
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") { inputRef.current?.blur(); } if (e.key === "Escape") { setInputValue(cell.content); setIsEditing(false); } };
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const items = e.clipboardData.items;
    const imageFile = Array.from(items).find(item => item.type.startsWith('image/'))?.getAsFile();
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdate(reader.result as string, 'image');
      reader.readAsDataURL(imageFile);
    } else {
      const text = e.clipboardData.getData('text/plain');
      if (text) onUpdate(text, 'text');
    }
    setIsEditing(false);
  };

  return (
    <div onPaste={handlePaste} className="w-full h-full min-h-20 flex items-center p-3 group transition-colors duration-200 hover:bg-blue-500/10 dark:hover:bg-blue-400/10">
      {isEditing ? (
        <input ref={inputRef} type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label={`编辑单元格 ${cell.id}`} className="w-full h-full bg-transparent outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-0" />
      ) : (
        <div onClick={() => setIsEditing(true)} className="w-full h-full cursor-pointer rounded-lg flex items-center justify-start" role="button" tabIndex={0}>
          {cell.type === 'image' && cell.content ? (
            <img src={cell.content} alt={`单元格 ${cell.id} 的内容`} className="max-w-full max-h-24 object-contain rounded-md" />
          ) : (
            <span className="truncate">{cell.content}</span>
          )}
        </div>
      )}
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---
export default function SpreadsheetPage() {
  const [mode, setMode] = useState<Mode>('quotation');
  const [metaData, setMetaData] = useState({ customerName: '', orderId: '', contactPerson: '', notes: '' });
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId') ?? '1';

  // Separate states for different data sets
  const [baseData, setBaseData] = useState<Row[]>([]);
  const [quotationExtraData, setQuotationExtraData] = useState<Row[]>([]);
  const [productionExtraData, setProductionExtraData] = useState<Row[]>([]);

  useEffect(() => {
    fetch(`/api/spreadsheet?taskId=${taskId}`)
      .then(res => res.json())
      .then(data => {
        setMetaData(data.meta || {});
        const cells = data.cells as { row: number; col: number; type: 'text' | 'image'; content: string }[];
        const rows = cells.length ? Math.max(...cells.map(c => c.row)) + 1 : 0;
        const base: Row[] = [];
        const quotation: Row[] = [];
        const production: Row[] = [];

        for (let r = 0; r < rows; r++) {
          base[r] = [];
          for (let c = 0; c < baseColCount; c++) {
            base[r][c] = { id: cellId(c, r), type: 'text', content: '' };
          }
          quotation[r] = [];
          for (let c = 0; c < quotationColCount; c++) {
            quotation[r][c] = { id: cellId(baseColCount + c, r), type: 'text', content: '' };
          }
          production[r] = [];
          for (let c = 0; c < productionColCount; c++) {
            production[r][c] = { id: cellId(baseColCount + quotationColCount + c, r), type: 'text', content: '' };
          }
        }

        cells.forEach(cell => {
          if (cell.col < baseColCount) {
            base[cell.row][cell.col] = { id: cellId(cell.col, cell.row), type: cell.type, content: cell.content };
          } else if (cell.col < baseColCount + quotationColCount) {
            const idx = cell.col - baseColCount;
            quotation[cell.row][idx] = { id: cellId(cell.col, cell.row), type: cell.type, content: cell.content };
          } else {
            const idx = cell.col - baseColCount - quotationColCount;
            production[cell.row][idx] = { id: cellId(cell.col, cell.row), type: cell.type, content: cell.content };
          }
        });

        setBaseData(base);
        setQuotationExtraData(quotation);
        setProductionExtraData(production);
      });
  }, [taskId]);

  // Derive current headers and data to display based on the selected mode
  const { currentHeaders, displayData } = (() => {
    switch (mode) {
      case 'quotation':
        return {
          currentHeaders: [...baseHeaders, ...quotationHeaders],
          displayData: baseData.map((row, i) => {
            const quantity = parseFloat(row[3].content) || 0;
            const unitPrice = parseFloat(quotationExtraData[i][0].content) || 0;
            const totalPrice = quantity * unitPrice;
            // Create a new row for display with calculated total
            const calculatedRow = [
              {...quotationExtraData[i][0]}, // unit price
              {...quotationExtraData[i][1], content: totalPrice > 0 ? totalPrice.toFixed(2) : ''} // total price
            ];
            return [...row, ...calculatedRow];
          })
        };
      case 'production':
        return {
          currentHeaders: [...baseHeaders, ...productionHeaders],
          displayData: baseData.map((row, i) => [...row, ...productionExtraData[i]])
        };
      case 'shipping':
      default:
        return {
          currentHeaders: baseHeaders,
          displayData: baseData
        };
    }
  })();
  
  const handleUpdateCell = async (rowIndex: number, colIndex: number, newContent: string, newType: 'text' | 'image') => {
    let globalCol = colIndex;
    if (mode === 'production' && colIndex >= baseColCount) {
      globalCol = baseColCount + quotationColCount + (colIndex - baseColCount);
    }

    const res = await fetch(`/api/spreadsheet?taskId=${taskId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowIndex, colIndex: globalCol, content: newContent, type: newType })
    });
    const data = await res.json();
    const updatedContent = data.content;

    if (globalCol < baseColCount) {
      const newData = [...baseData];
      newData[rowIndex][globalCol] = { ...newData[rowIndex][globalCol], content: updatedContent, type: newType };
      setBaseData(newData);
    } else if (globalCol < baseColCount + quotationColCount) {
      const idx = globalCol - baseColCount;
      const newData = [...quotationExtraData];
      newData[rowIndex][idx] = { ...newData[rowIndex][idx], content: updatedContent, type: newType };
      setQuotationExtraData(newData);
    } else {
      const idx = globalCol - baseColCount - quotationColCount;
      const newData = [...productionExtraData];
      newData[rowIndex][idx] = { ...newData[rowIndex][idx], content: updatedContent, type: newType };
      setProductionExtraData(newData);
    }
  };

  const handleMetaChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetaData(prev => ({ ...prev, [name]: value }));
    fetch(`/api/spreadsheet?taskId=${taskId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta: { [name]: value } })
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="flex justify-center min-h-screen w-full bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 p-4 sm:p-8 transition-colors duration-300 print:bg-white print:p-0">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-7xl"
      >
        {/* --- Page Header / Control Area --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8 print:hidden">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight">物料清单</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2">选择模式以查看不同信息，或打印单据。</p>
          </div>
          <div className="flex items-center gap-4">
            <ModeSelector selected={mode} onSelect={setMode} />
            <button onClick={handlePrint} className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors" aria-label="Print Document">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
            </button>
          </div>
        </div>
        
        {/* --- Meta Data Form Section --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 mb-8 print:grid-cols-4">
          {['customerName', 'orderId', 'contactPerson', 'notes'].map(field => (
            <div key={field} className={`flex flex-col gap-1 ${field === 'notes' ? 'col-span-2 md:col-span-1' : ''}`}>
              <label htmlFor={field} className="text-sm font-medium text-neutral-600 dark:text-neutral-400 print:text-black">
                {{customerName: '客户名称', orderId: '单号', contactPerson: '联系人', notes: '备注'}[field]}
              </label>
              <input 
                type="text" id={field} name={field} value={metaData[field as keyof typeof metaData]}
                onChange={handleMetaChange}
                className="w-full bg-white/60 dark:bg-black/50 rounded-lg px-3 py-2 text-base border-none outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all duration-200 print:bg-transparent print:p-0 print:text-black"
              />
            </div>
          ))}
        </div>
        
        {/* --- Spreadsheet Section --- */}
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/60 dark:bg-black/50 shadow-lg backdrop-blur-xl print:shadow-none print:border-neutral-300 print:rounded-none">
          <div className="overflow-x-auto">
            <div className="grid w-full" style={{ gridTemplateColumns: `50px repeat(${currentHeaders.length}, minmax(150px, 1fr))` }}>
              
              <div className="sticky top-0 z-10 print:hidden"></div>
              {currentHeaders.map((header) => (
                <div key={header} className="sticky top-0 z-10 font-medium text-sm text-neutral-600 dark:text-neutral-300 p-3 text-center bg-white/30 dark:bg-black/20 backdrop-blur-md border-b border-r border-neutral-200/50 dark:border-neutral-800/70 print:bg-neutral-100 print:text-black print:border-neutral-300">
                  {header}
                </div>
              ))}

              {displayData.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} className="contents">
                  <div className="sticky left-0 font-medium text-xs text-neutral-500 dark:text-neutral-400 p-3 text-center bg-white/30 dark:bg-black/20 backdrop-blur-md border-t border-r border-neutral-200/50 dark:border-neutral-800/70 flex items-center justify-center print:bg-neutral-100 print:text-black print:border-neutral-300">
                    {rowIndex + 1}
                  </div>
                  {row.map((cell, colIndex) => (
                    <div key={cell.id} className="border-t border-r border-neutral-200/50 dark:border-neutral-800/70 print:border-neutral-300">
                      <EditableCell
                        cell={cell}
                        onUpdate={(newContent, newType) => handleUpdateCell(rowIndex, colIndex, newContent, newType)}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}