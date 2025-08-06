"use client";

import { useSearchParams } from "next/navigation";
import Spreadsheet from "@/components/Spreadsheet";

export default function PreviewPage() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId") ?? "1";
  return <Spreadsheet taskId={taskId} />;
}
