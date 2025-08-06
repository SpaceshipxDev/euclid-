"use client";

import { useState, useEffect } from "react";
import { Plus, Bell, Check, X, Search, Wind } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

/* ────────────────────────────────  📑  TYPES & UTILS  ───────────────────────────── */

interface Task {
  id: string;
  title: string;
  dueDate: string;
  lastEdited: Date;
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
  { id: "quotation", title: "报价" },
  { id: "order", title: "制单" },
  { id: "approval", title: "审批" },
  { id: "outsourcing", title: "外协" },
  { id: "programming", title: "编程" },
  { id: "machine", title: "操机" },
  { id: "inspection", title: "检验" },
];

const sampleTitles = [
  "精密零件加工",
  "复杂模具制作",
  "产品原型组装",
  "关键尺寸检测",
  "表面阳极处理",
  "热处理工艺优化",
];
const randomTitle = () =>
  sampleTitles[Math.floor(Math.random() * sampleTitles.length)];

const generateSampleTasks = (col: string, count: number): Task[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${col.toUpperCase()}-${String(i + 1).padStart(4, "0")}`,
    title: `${randomTitle()} #${i + 1}`,
    dueDate: new Date(
      Date.now() + (Math.random() * 20 + 2) * 86400000,
    ).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }),
    lastEdited: new Date(Date.now() - Math.random() * 5 * 86400000),
  }));

const generatePendingTasks = (col: string): PendingTask[] =>
  Math.random() > 0.7
    ? []
    : Array.from({ length: Math.floor(Math.random() * 2) + 1 }, (_, i) => ({
        id: `PENDING-${col.toUpperCase()}-${i + 1}`,
        title: `待处理任务 #${i + 1}`,
        from: columns[Math.floor(Math.random() * columns.length)].title,
      }));

/* ────────────────────────────────  🆕  TASK DRAWER  ───────────────────────────── */

interface TaskDrawerProps {
  task: Task;
  onClose: () => void;
}

const TaskDrawer = ({ task, onClose }: TaskDrawerProps) => {
  const drawer = {
    hidden: { x: "100%" },
    visible: { x: "0%", transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
    exit: { x: "100%", transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } },
  };
  const overlay = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/30"
        variants={overlay}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-y-0 right-0 z-50 w-full rounded-l-2xl border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 md:w-5/6 lg:w-4/6"
        variants={drawer}
        initial="hidden"
        animate="visible"
        exit="exit"
        aria-modal="true"
      >
        <div className="flex h-full flex-col">
          {/* header */}
          <div className="flex items-center justify-between p-4 pl-6 md:p-6">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {task.title}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-lg border-zinc-300 dark:border-zinc-700">
                编辑任务
              </Button>
              <Separator orientation="vertical" className="mx-1 h-6 bg-zinc-200 dark:bg-zinc-700" />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <Separator className="bg-zinc-200 dark:bg-zinc-800" />

          {/* content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-2xl space-y-8">
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">任务 ID</p>
                <p className="font-mono text-base text-zinc-900 dark:text-zinc-100">{task.id}</p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">截止日期</p>
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {task.dueDate}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">上次编辑</p>
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatRelativeTime(task.lastEdited)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">任务描述</h3>
                <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                  此处应包含任务的详细描述，例如具体要求、附件或相关文档。
                  这只是示例文本，用于测试滚动行为。
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

/* ────────────────────────────────  🏗️  MAIN PAGE  ───────────────────────────── */

export default function KanbanPage() {
  // keep SSR/CSR identical -> start empty
  const emptyT = columns.reduce<Record<string, Task[]>>((a, c) => ({ ...a, [c.id]: [] }), {});
  const emptyP = columns.reduce<Record<string, PendingTask[]>>((a, c) => ({ ...a, [c.id]: [] }), {});

  const [tasks, setTasks] = useState(emptyT);
  const [pending, setPending] = useState(emptyP);
  const [activeColumn, setActiveColumn] = useState<ColumnData | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "review" | null>(null);
  const [newTaskId, setNewTaskId] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  /* generate demo data client-side */
  useEffect(() => {
    setTasks(
      columns.reduce<Record<string, Task[]>>(
        (a, c) => ({ ...a, [c.id]: generateSampleTasks(c.id, Math.floor(Math.random() * 6) + 3) }),
        {},
      ),
    );
    setPending(
      columns.reduce<Record<string, PendingTask[]>>(
        (a, c) => ({ ...a, [c.id]: generatePendingTasks(c.id) }),
        {},
      ),
    );
  }, []);

  /* refresh “2h ago” every minute */
  useEffect(() => {
    const id = setInterval(() => setTasks((t) => ({ ...t })), 60000);
    return () => clearInterval(id);
  }, []);

  /* dialog helpers */
  const openDialog = (c: ColumnData, m: "add" | "review") => {
    setActiveColumn(c);
    setDialogMode(m);
  };
  const closeDialog = () => {
    setDialogMode(null);
    setNewTaskId("");
    setTimeout(() => setActiveColumn(null), 300);
  };

  /* task ops */
  const addTask = () => {
    if (!newTaskId.trim() || !activeColumn) return;
    const t: Task = {
      id: newTaskId.toUpperCase(),
      title: `新任务: ${newTaskId}`,
      dueDate: new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }),
      lastEdited: new Date(),
    };
    setTasks((p) => ({ ...p, [activeColumn.id]: [t, ...p[activeColumn.id]] }));
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

  /* render */
  return (
    <div
      className={`min-h-screen w-full select-none bg-zinc-100 font-sans transition-transform duration-500 dark:bg-zinc-950 ${
        selectedTask ? "overflow-hidden" : ""
      }`}
    >
      {/* nav */}
      <header className="sticky top-0 z-30 p-4 md:px-10 md:py-5">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-900 dark:bg-zinc-50">
            <Wind className="h-5 w-5 text-zinc-50 dark:text-zinc-900" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            生产流程
          </h1>
        </div>
      </header>

      {/* board */}
      <main className="h-[calc(100vh-92px)] w-full">
        <div className="mx-auto flex h-full max-w-screen-2xl gap-8 overflow-x-auto px-4 pb-12 md:px-10">
          {columns.map((col, i) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="w-80 flex-shrink-0"
            >
              <div className="flex h-full flex-col">
                {/* column header */}
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
                      {col.title}
                    </h2>
                    <span
                      suppressHydrationWarning
                      className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-zinc-200 px-1.5 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {tasks[col.id].length}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {pending[col.id].length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="group relative h-8 w-8 rounded-full"
                        onClick={() => openDialog(col, "review")}
                      >
                        <Bell className="h-4 w-4 text-zinc-500 group-hover:text-blue-500" />
                        <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                        </span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="group h-8 w-8 rounded-full"
                      onClick={() => openDialog(col, "add")}
                    >
                      <Plus className="h-5 w-5 text-zinc-500 group-hover:text-blue-500" />
                    </Button>
                  </div>
                </div>

                {/* tasks */}
                <div className="flex-1 space-y-4 overflow-y-auto p-2 [mask-image:linear-gradient(to_bottom,transparent,black_16px,black_calc(100%-16px),transparent)]">
                  <AnimatePresence>
                    {tasks[col.id].map((task) => (
                      <motion.div
                        key={task.id}
                        layout="position"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="group cursor-pointer rounded-xl border border-zinc-200/70 bg-white/60 p-4 shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:hover:border-zinc-700">
                          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {task.title}
                          </h3>
                          <p className="mt-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {task.id}
                          </p>
                          <div className="mt-4 flex items-end justify-between">
                            <div className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                {task.dueDate}
                              </p>
                            </div>
                            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
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

      {/* dialogs */}
      <Dialog open={dialogMode !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md rounded-2xl border-zinc-200/50 bg-zinc-100/70 p-0 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/70">
          <AnimatePresence mode="wait">
            {dialogMode === "add" && activeColumn && (
              <motion.div
                key="add"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              >
                <DialogHeader className="p-6 pb-2 text-left">
                  <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    添加到 {activeColumn.title}
                  </DialogTitle>
                  <DialogDescription className="text-zinc-600 dark:text-zinc-400">
                    输入任务 ID 以接收新任务。
                  </DialogDescription>
                </DialogHeader>
                <div className="px-6 pb-6">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                    <Input
                      autoFocus
                      placeholder="ORDER-1138"
                      value={newTaskId}
                      onChange={(e) => setNewTaskId(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTask()}
                      className="h-12 rounded-lg border-zinc-300 bg-zinc-50/50 pl-10 text-base shadow-inner dark:border-zinc-700 dark:bg-zinc-800/50"
                    />
                  </div>
                  <Button
                    onClick={addTask}
                    disabled={!newTaskId.trim()}
                    className="mt-4 h-11 w-full rounded-lg bg-blue-600 text-base font-medium text-white shadow-sm transition-all hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
                  >
                    确认添加
                  </Button>
                </div>
              </motion.div>
            )}

            {dialogMode === "review" && activeColumn && (
              <motion.div
                key="review"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              >
                <DialogHeader className="p-6 pb-3 text-left">
                  <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    待处理任务
                  </DialogTitle>
                  <DialogDescription className="text-zinc-600 dark:text-zinc-400">
                    审批来自其他流程的任务 ({pending[activeColumn.id]?.length || 0})
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[50vh] space-y-2.5 overflow-y-auto px-6 pb-6">
                  <AnimatePresence>
                    {(pending[activeColumn.id] || []).map((t) => (
                      <motion.div
                        key={t.id}
                        layout="position"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10, transition: { duration: 0.2 } }}
                        className="flex items-center justify-between rounded-lg bg-zinc-200/50 p-3 dark:bg-zinc-800/50"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {t.title}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">来自: {t.from}</p>
                        </div>
                        <div className="flex flex-shrink-0 gap-1.5 pl-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-zinc-500 hover:bg-red-500/10 hover:text-red-500"
                            onClick={() => declinePending(activeColumn.id, t.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            className="h-8 w-8 rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700"
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

      {/* drawer */}
      <AnimatePresence>
        {selectedTask && <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />}
      </AnimatePresence>
    </div>
  );
}
