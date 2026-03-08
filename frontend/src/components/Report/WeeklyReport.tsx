"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Copy, Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { WeeklyReportData, Todo } from "@/types";

// ---- helpers ----

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function toDateParam(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

const PRIORITY_LABEL: Record<string, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

const CATEGORY_LABEL: Record<string, string> = {
  work: "업무",
  personal: "개인",
};

// ---- Sub components ----

function TodoCard({ todo, showCompleted }: { todo: Todo; showCompleted?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-2 px-3 rounded-lg bg-white border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{todo.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-gray-400">
            {CATEGORY_LABEL[todo.category] ?? todo.category}
          </span>
          {todo.task_type && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: todo.task_type.color + "22", color: todo.task_type.color }}
            >
              {todo.task_type.name}
            </span>
          )}
          <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLOR[todo.priority] ?? "bg-gray-100 text-gray-600"}`}>
            {PRIORITY_LABEL[todo.priority] ?? todo.priority}
          </span>
          <span className="text-xs text-gray-400">
            {todo.start_date ? formatDate(todo.start_date) : "?"}
            {" ~ "}
            {todo.due_date ? formatDate(todo.due_date) : "?"}
          </span>
          {showCompleted && todo.completed_at && (
            <span className="text-xs text-emerald-600">
              완료 {formatDate(todo.completed_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  todos,
  color,
  showCompleted,
}: {
  title: string;
  todos: Todo[];
  color: string;
  showCompleted?: boolean;
}) {
  return (
    <div className="mb-6">
      <div className={`flex items-center gap-2 mb-2`}>
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <h3 className="text-sm font-semibold text-gray-700">
          {title}
          <span className="ml-1.5 text-xs font-normal text-gray-400">({todos.length})</span>
        </h3>
      </div>
      {todos.length === 0 ? (
        <p className="text-xs text-gray-400 pl-4">없음</p>
      ) : (
        <div className="space-y-1.5 pl-4">
          {todos.map((t) => (
            <TodoCard key={t.id} todo={t} showCompleted={showCompleted} />
          ))}
        </div>
      )}
    </div>
  );
}

function BarChart({ data, title }: { data: Record<string, number>; title: string }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  if (total === 0) {
    return (
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">{title}</p>
        <p className="text-xs text-gray-400">데이터 없음</p>
      </div>
    );
  }

  const COLORS = [
    "bg-blue-400",
    "bg-emerald-400",
    "bg-violet-400",
    "bg-orange-400",
    "bg-pink-400",
    "bg-cyan-400",
    "bg-amber-400",
  ];

  const entries = Object.entries(data);
  const labelMap: Record<string, string> = {
    work: "업무",
    personal: "개인",
    high: "높음",
    medium: "보통",
    low: "낮음",
  };

  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-2">{title}</p>
      <div className="space-y-1.5">
        {entries.map(([key, count], idx) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16 shrink-0 truncate">
                {labelMap[key] ?? key}
              </span>
              <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                <div
                  className={`h-full ${COLORS[idx % COLORS.length]} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-12 text-right shrink-0">
                {count}건 ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Report text builder ----

function buildReportText(data: WeeklyReportData): string {
  const { week_start, week_end, sections, stats, summary } = data;
  const lines: string[] = [];

  lines.push(`[주간 리포트] ${formatDateFull(week_start)} ~ ${formatDateFull(week_end)}`);
  lines.push("");
  lines.push("== 요약 ==");
  lines.push(`총 카드: ${summary.total_count}건`);
  lines.push(`완료율: ${summary.completion_rate}% (${summary.completed_count}/${summary.total_count})`);
  lines.push(`신규: ${summary.new_count}건`);
  if (summary.avg_duration_days !== null) {
    lines.push(`평균 소요: ${summary.avg_duration_days}일`);
  }
  lines.push("");

  const sectionDefs: [string, keyof typeof sections][] = [
    ["신규 업무", "new_tasks"],
    ["이월 업무", "carryover_tasks"],
    ["완료 업무", "completed_tasks"],
    ["진행 중 업무", "in_progress_tasks"],
    ["취소 업무", "cancelled_tasks"],
  ];

  for (const [label, key] of sectionDefs) {
    const todos = sections[key];
    lines.push(`== ${label} (${todos.length}) ==`);
    if (todos.length === 0) {
      lines.push("  없음");
    } else {
      for (const t of todos) {
        const cat = CATEGORY_LABEL[t.category] ?? t.category;
        const pri = PRIORITY_LABEL[t.priority] ?? t.priority;
        const tt = t.task_type?.name ?? "기타";
        const dates = `${t.start_date ? formatDate(t.start_date) : "?"}~${t.due_date ? formatDate(t.due_date) : "?"}`;
        lines.push(`  - [${cat}][${tt}][${pri}] ${t.title} (${dates})`);
      }
    }
    lines.push("");
  }

  lines.push("== 통계 ==");
  const statDefs: [string, Record<string, number>][] = [
    ["카테고리별", stats.category_stats],
    ["업무유형별", stats.task_type_stats],
    ["우선순위별", stats.priority_stats],
  ];
  for (const [label, stat] of statDefs) {
    const total = Object.values(stat).reduce((s, v) => s + v, 0);
    const items = Object.entries(stat)
      .map(([k, v]) => {
        const lbl = { work: "업무", personal: "개인", high: "높음", medium: "보통", low: "낮음" }[k] ?? k;
        return `${lbl}: ${v}건 (${total > 0 ? Math.round((v / total) * 100) : 0}%)`;
      })
      .join(", ");
    lines.push(`${label}: ${items}`);
  }

  return lines.join("\n");
}

// ---- Main component ----

export function WeeklyReport() {
  const [currentDate, setCurrentDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [data, setData] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchReport = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const result = await api.getWeeklyReport(date);
      setData(result);
    } catch (err) {
      console.error("Failed to fetch weekly report:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(currentDate);
  }, [currentDate, fetchReport]);

  const goToPrevWeek = () => {
    if (!data) return;
    setCurrentDate(addDays(data.week_start, -7));
  };

  const goToNextWeek = () => {
    if (!data) return;
    setCurrentDate(addDays(data.week_start, 7));
  };

  const goToThisWeek = () => {
    setCurrentDate(new Date().toISOString().split("T")[0]);
  };

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(buildReportText(data));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Clipboard copy failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        로딩 중...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const { week_start, week_end, sections, stats, summary } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4 text-gray-400" />
            {formatDateFull(week_start)} ~ {formatDateFull(week_end)}
          </div>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToThisWeek} className="text-xs">
            이번 주
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={handleCopy} className="flex items-center gap-1.5">
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-600">복사됨</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              리포트 복사
            </>
          )}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-400 mb-1">총 카드</p>
          <p className="text-2xl font-bold text-gray-800">{summary.total_count}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-400 mb-1">완료율</p>
          <p className="text-2xl font-bold text-emerald-600">{summary.completion_rate}%</p>
          <p className="text-xs text-gray-400">{summary.completed_count}/{summary.total_count}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-400 mb-1">신규</p>
          <p className="text-2xl font-bold text-blue-600">{summary.new_count}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-400 mb-1">평균 소요</p>
          <p className="text-2xl font-bold text-violet-600">
            {summary.avg_duration_days !== null ? `${summary.avg_duration_days}일` : "-"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sections */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-5">
          <Section title="이번 주 신규 업무" todos={sections.new_tasks} color="bg-blue-400" />
          <Section title="지난주 이월 업무" todos={sections.carryover_tasks} color="bg-amber-400" />
          <Section title="완료된 업무" todos={sections.completed_tasks} color="bg-emerald-400" showCompleted />
          <Section title="진행 중 업무" todos={sections.in_progress_tasks} color="bg-violet-400" />
          <Section title="취소된 업무" todos={sections.cancelled_tasks} color="bg-gray-400" />
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl border p-5 space-y-6">
          <h3 className="text-sm font-semibold text-gray-700">업무 통계</h3>
          <BarChart data={stats.category_stats} title="카테고리별" />
          <BarChart data={stats.task_type_stats} title="업무 유형별" />
          <BarChart data={stats.priority_stats} title="우선순위별" />
        </div>
      </div>
    </div>
  );
}
