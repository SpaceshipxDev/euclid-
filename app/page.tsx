"use client";

import { useState, useEffect } from "react";
import { Plus, Bell, Check, X, Search, Wind, ArrowLeft, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import Spreadsheet from "@/components/Spreadsheet";

/* ────────────────────────────────  📑  TYPES & UTILS  ───────────────────────────── */

interface Task {
  id: string;
  title: string;
  dueDate: string;
  lastEdited: Date;
  columnId?: string; // Track which column the task is from
  columnTitle?: string; // Track the column title
}
interface PendingTask {
  id: string;
  title: string;
  from: string;
}
interface ColumnData {
  id: string;
  title: string;
}
const formatRelativeTime = (date: Date) => {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/* ────────────────────────────────  📋  COLUMN SETUP  ───────────────────────────── */

const columns: ColumnData[] = [
  { id: "quote", title: "报价" },
  { id: "order", title: "制单" },
  { id: "approval", title: "审批" },
  { id: "outsourcing", title: "外协" },
  { id: "daohe", title: "道禾" },
  { id: "programming", title: "编程" },
  { id: "machine", title: "操机" },
  { id: "manual", title: "手工" },
  { id: "surface", title: "表面处理" },
  { id: "inspection", title: "检验" },
  { id: "shipping", title: "出货" },
];

/* ────────────────────────────────  🎯  ULTRA-MODERN FULL-SCREEN EDITOR  ───────────────────────────── */

interface TaskEditorModalProps {
  task: Task;
  onClose: () => void;
}

const TaskEditorModal = ({ task, onClose }: TaskEditorModalProps) => {
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isExiting, setIsExiting] = useState(false);

  // Beautiful, smooth animations
  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.4, 
        ease: [0.25, 0.1, 0.25, 1],
        when: "beforeChildren" 
      } 
    },
    exit: { 
      opacity: 0, 
      transition: { 
        duration: 0.3, 
        ease: [0.25, 0.1, 0.25, 1],
        when: "afterChildren" 
      } 
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.5, 
        ease: [0.25, 0.1, 0.25, 1],
        delay: 0.1
      } 
    },
    exit: { 
      opacity: 0, 
      y: 40, 
      scale: 0.95,
      transition: { 
        duration: 0.25, 
        ease: [0.25, 0.1, 0.25, 1] 
      } 
    },
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      // Cmd/Ctrl + W or Escape to close
      if ((event.metaKey || event.ctrlKey) && event.key === 'w') {
        event.preventDefault();
        handleClose();
      } else if (event.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    // Simulate a brief save check
    setTimeout(() => {
      onClose();
    }, 200);
  };

  // Simulate auto-save status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoSaveStatus('saving');
      setTimeout(() => setAutoSaveStatus('saved'), 1000);
    }, 15000); // Every 15 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white dark:bg-zinc-950"
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      aria-modal="true"
    >
      <motion.div
        variants={contentVariants}
        className="flex h-full flex-col"
      >
        {/* Ultra-clean header with contextual information */}
        <header className="relative flex h-16 flex-shrink-0 items-center justify-between border-b border-zinc-200/50 px-6 dark:border-zinc-800/50">
          {/* Left side - Navigation and context */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="group -ml-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-sm font-medium">返回看板</span>
            </Button>
            
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-400 dark:text-zinc-600">/</span>
              <span className="text-zinc-500 dark:text-zinc-500">{task.columnTitle || '任务'}</span>
              <span className="text-zinc-400 dark:text-zinc-600">/</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{task.title}</span>
            </div>
          </div>



          {/* Right side - Status and actions */}
          <div className="flex items-center gap-4">
            {/* Auto-save indicator */}
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full transition-colors ${
                autoSaveStatus === 'saved' ? 'bg-green-500' : 
                autoSaveStatus === 'saving' ? 'animate-pulse bg-amber-500' : 
                'bg-zinc-300'
              }`} />
              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                {autoSaveStatus === 'saved' ? '已保存' : 
                 autoSaveStatus === 'saving' ? '保存中...' : 
                 '未保存'}
              </span>
            </div>

            {/* Keyboard shortcut hint */}
            <div className="hidden items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-900 md:flex">
              <Command className="h-3 w-3 text-zinc-400" />
              <span className="text-xs text-zinc-400">W</span>
            </div>
          </div>
        </header>

        {/* Instruction bar - Subtle and helpful */}
        <div className="flex h-10 flex-shrink-0 items-center justify-center border-b border-zinc-100 bg-zinc-50/50 px-6 dark:border-zinc-900 dark:bg-zinc-900/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            💡 提示：单击任意单元格进行编辑，支持直接粘贴图片。所有更改将自动保存。
          </p>
        </div>

        {/* Main content area with smooth transitions */}
        <motion.div 
          className="flex-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Spreadsheet taskId={task.id} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

/* ────────────────────────────────  🏗️  MAIN PAGE  ───────────────────────────── */

export default function KanbanPage() {
  const emptyT = columns.reduce<Record<string, Task[]>>((a, c) => ({ ...a, [c.id]: [] }), {});
  const emptyP = columns.reduce<Record<string, PendingTask[]>>((a, c) => ({ ...a, [c.id]: [] }), {});

  const [tasks, setTasks] = useState(emptyT);
  const [pending, setPending] = useState(emptyP);
  const [activeColumn, setActiveColumn] = useState<ColumnData | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "review" | null>(null);
  const [newTaskId, setNewTaskId] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        const map = columns.reduce<Record<string, Task[]>>((a, c) => ({ ...a, [c.id]: [] }), {});
        data.tasks.forEach((t: any) => {
          map[columns[0].id].push({
            id: String(t.id),
            title: t.meta?.orderId || String(t.id),
            dueDate: new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }),
            lastEdited: new Date(),
          });
        });
        setTasks(map);
      });
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTasks((t) => ({ ...t })), 60000);
    return () => clearInterval(id);
  }, []);

  const openDialog = (c: ColumnData, m: "add" | "review") => {
    setActiveColumn(c);
    setDialogMode(m);
  };
  const closeDialog = () => {
    setDialogMode(null);
    setNewTaskId("");
    setTimeout(() => setActiveColumn(null), 300);
  };

  const addTask = async () => {
    if (!newTaskId.trim() || !activeColumn) return;
    if (activeColumn.id === columns[0].id) {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta: { orderId: newTaskId } }),
      });
      const data = await res.json();
      const t: Task = {
        id: String(data.id),
        title: newTaskId,
        dueDate: new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }),
        lastEdited: new Date(),
      };
      setTasks((p) => ({ ...p, [activeColumn.id]: [t, ...p[activeColumn.id]] }));
    } else {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      const existing = data.tasks.find((t: any) => t.meta?.orderId === newTaskId);
      if (existing) {
        const t: Task = {
          id: String(existing.id),
          title: existing.meta.orderId,
          dueDate: new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }),
          lastEdited: new Date(),
        };
        setTasks((p) => ({ ...p, [activeColumn.id]: [t, ...p[activeColumn.id]] }));
      }
    }
    closeDialog();
  };
  
  const acceptPending = (c: string, id: string) => {
    const pend = pending[c].find((t) => t.id === id);
    if (!pend) return;
    const accepted: Task = {
      id: pend.id,
      title: pend.title,
      dueDate: new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }),
      lastEdited: new Date(),
    };
    setTasks((p) => ({ ...p, [c]: [accepted, ...p[c]] }));
    setPending((p) => ({ ...p, [c]: p[c].filter((t) => t.id !== id) }));
  };
  
  const declinePending = (c: string, id: string) =>
    setPending((p) => ({ ...p, [c]: p[c].filter((t) => t.id !== id) }));

  // Enhanced click handler that passes column context
  const handleTaskClick = (task: Task, column: ColumnData) => {
    setSelectedTask({
      ...task,
      columnId: column.id,
      columnTitle: column.title
    });
  };

  return (
    <div
      className={`min-h-screen w-full select-none bg-zinc-100 font-sans transition-all duration-500 dark:bg-zinc-950 ${
        selectedTask ? "overflow-hidden" : ""
      }`}
    >
      {/* Clean navigation header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/0 bg-zinc-100/80 backdrop-blur-xl dark:border-zinc-800/0 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-4 md:px-10">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 shadow-sm dark:from-zinc-100 dark:to-zinc-300">
            <Wind className="h-5 w-5 text-zinc-50 dark:text-zinc-900" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            生产流程
          </h1>
        </div>
      </header>

      {/* Kanban board */}
      <main className="h-[calc(100vh-64px)] w-full">
        <div className="mx-auto flex h-full max-w-screen-2xl gap-6 overflow-x-auto px-4 py-6 md:px-10">
          {columns.map((col, i) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-80 flex-shrink-0"
            >
              <div className="flex h-full flex-col">
                {/* Column header - Cleaner design */}
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {col.title}
                    </h2>
                    <span
                      suppressHydrationWarning
                      className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-zinc-200/80 px-1.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400"
                    >
                      {tasks[col.id].length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {pending[col.id].length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="group relative h-8 w-8 rounded-full transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        onClick={() => openDialog(col, "review")}
                      >
                        <Bell className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-blue-600 dark:text-zinc-400 dark:group-hover:text-blue-400" />
                        <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                        </span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="group h-8 w-8 rounded-full transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800"
                      onClick={() => openDialog(col, "add")}
                    >
                      <Plus className="h-4 w-4 text-zinc-500 transition-all group-hover:rotate-90 group-hover:text-blue-600 dark:text-zinc-400 dark:group-hover:text-blue-400" />
                    </Button>
                  </div>
                </div>

                {/* Task cards - More refined */}
                <div className="flex-1 space-y-3 overflow-y-auto px-1 pb-4 [mask-image:linear-gradient(to_bottom,transparent,black_8px,black_calc(100%-8px),transparent)]">
                  <AnimatePresence>
                    {tasks[col.id].map((task) => (
                      <motion.div
                        key={task.id}
                        layout="position"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        onClick={() => handleTaskClick(task, col)}
                      >
                        <div className="group cursor-pointer rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm transition-all hover:shadow-lg hover:shadow-zinc-200/50 hover:-translate-y-0.5 hover:border-zinc-300/80 dark:border-zinc-800/60 dark:bg-zinc-900 dark:hover:shadow-zinc-950/50 dark:hover:border-zinc-700/80">
                          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {task.title}
                          </h3>
                          <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-500">
                            #{task.id}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="rounded-lg bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
                              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                {task.dueDate}
                              </p>
                            </div>
                            <p className="text-xs text-zinc-400 dark:text-zinc-600">
                              {formatRelativeTime(task.lastEdited)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Dialogs remain the same but with refined styling */}
      <Dialog open={dialogMode !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md rounded-3xl border-zinc-200/30 bg-white/95 p-0 shadow-2xl backdrop-blur-xl dark:border-zinc-800/30 dark:bg-zinc-900/95">
          <AnimatePresence mode="wait">
            {dialogMode === "add" && activeColumn && (
              <motion.div
                key="add"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <DialogHeader className="p-6 pb-2 text-left">
                  <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    添加到 {activeColumn.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-400">
                    输入任务 ID 以接收新任务
                  </DialogDescription>
                </DialogHeader>
                <div className="px-6 pb-6">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-600" />
                    <Input
                      autoFocus
                      placeholder="ORDER-1138"
                      value={newTaskId}
                      onChange={(e) => setNewTaskId(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTask()}
                      className="h-12 rounded-xl border-0 bg-zinc-100 pl-10 text-base font-medium shadow-inner placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:placeholder:text-zinc-600"
                    />
                  </div>
                  <Button
                    onClick={addTask}
                    disabled={!newTaskId.trim()}
                    className="mt-4 h-11 w-full rounded-xl bg-blue-600 text-base font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
                  >
                    确认添加
                  </Button>
                </div>
              </motion.div>
            )}

            {dialogMode === "review" && activeColumn && (
              <motion.div
                key="review"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <DialogHeader className="p-6 pb-3 text-left">
                  <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    待处理任务
                  </DialogTitle>
                  <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-400">
                    审批来自其他流程的任务 ({pending[activeColumn.id]?.length || 0})
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[50vh] space-y-2 overflow-y-auto px-6 pb-6">
                  <AnimatePresence>
                    {(pending[activeColumn.id] || []).map((t) => (
                      <motion.div
                        key={t.id}
                        layout="position"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10, transition: { duration: 0.15 } }}
                        className="flex items-center justify-between rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {t.title}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500">来自: {t.from}</p>
                        </div>
                        <div className="flex flex-shrink-0 gap-1.5 pl-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-400"
                            onClick={() => declinePending(activeColumn.id, t.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            className="h-8 w-8 rounded-full bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
                            onClick={() => acceptPending(activeColumn.id, t.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Full-screen editor modal */}
      <AnimatePresence>
        {selectedTask && <TaskEditorModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
      </AnimatePresence>
    </div>
  );
}