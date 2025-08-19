"use client";

import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { supabase } from "@/lib/supabaseClient";
import { SafeHtml } from "@/components/SafeHtml";
import { Row } from "@/types/products";
import { Header } from "@/components/Header";
import { PaginationBar } from "@/components/PaginationBar";
import { RichTextEditorModal } from "@/components/RichTextEditorModal";

export default function AdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 50;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [remainingToConfirm, setRemainingToConfirm] = useState(0);
  const [leavingIds, setLeavingIds] = useState<Set<string | number>>(new Set());

  const [editorState, setEditorState] = useState<{
    open: boolean;
    rowId: string | number | null;
    field: "short_description" | "description" | null;
    initialHtml: string;
  }>({ open: false, rowId: null, field: null, initialHtml: "" });

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      setCurrentUserEmail(user.email ?? null);

      setLoading(true);
      setError(null);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from("products")
        .select(
          "row_number, id, uid, product_name, article, code_1c, short_description, description, description_added, push_to_pim, description_confirmed, confirmed_by_email",
          { count: "exact" }
        )
        .eq("description_added", true)
        .eq("description_confirmed", false)
        .order("id", { ascending: false })
        .range(from, to);

      if (error) {
        setError(error.message);
        setRows([]);
        setTotal(0);
      } else {
        setRows(data ?? []);
        setTotal(count ?? 0);
        // Count remaining to confirm across all items with description_added = true
        const { count: remainingCount } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("description_added", true)
          .eq("description_confirmed", false);
        setRemainingToConfirm(remainingCount ?? 0);
      }
      setLoading(false);
    };
    fetchData();
  }, [page]);

  function openEditor(row: Row, field: "short_description" | "description") {
    setEditorState({
      open: true,
      rowId: row.id,
      field,
      initialHtml: String(row[field] ?? ""),
    });
  }

  async function saveEditor(html: string) {
    if (!editorState.open || !editorState.field || editorState.rowId == null) return;
    const sanitized = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    const fieldName = editorState.field;
    const { data, error } = await supabase
      .from("products")
      .update({ [fieldName]: sanitized })
      .eq("id", editorState.rowId)
      .select("id, short_description, description");
    if (error) {
      alert(`Ошибка сохранения: ${error.message}`);
      return;
    }
    const updated = data?.[0];
    if (updated) {
      setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    }
    setEditorState({ open: false, rowId: null, field: null, initialHtml: "" });
  }

  async function confirmDescription(row: Row) {
    if (!currentUserEmail) {
      alert("Нет email пользователя. Авторизуйтесь заново.");
      return;
    }
    const { data, error } = await supabase
      .from("products")
      .update({ description_confirmed: true, confirmed_by_email: currentUserEmail })
      .eq("id", row.id)
      .select("id, description_confirmed, confirmed_by_email");
    if (error) {
      alert(`Ошибка подтверждения: ${error.message}`);
      return;
    }
    const updated = data?.[0];
    if (updated) {
      // Плавно скрываем карточку, затем удаляем из списка
      setLeavingIds((prev) => new Set(prev).add(updated.id));
      window.setTimeout(() => {
        setRows((prev) => prev.filter((r) => r.id !== updated.id));
        setRemainingToConfirm((x) => Math.max(0, x - 1));
        setLeavingIds((prev) => {
          const next = new Set(prev);
          next.delete(updated.id);
          return next;
        });
      }, 350);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Шапка */}
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

      {/* Информация о пагинации */}
      <PaginationBar
        page={page}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        remainingToConfirm={remainingToConfirm}
      />

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 text-lg">Загрузка...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
            <p className="text-red-800 font-medium">Ошибка: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            {rows.map((row) => (
              <div
                key={row.id}
                className={`bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${
                  leavingIds.has(row.id) ? "opacity-0 scale-[0.98] translate-y-2" : "opacity-100"
                }`}
              >
                {/* Заголовок карточки */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-b border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {row.product_name && (
                        <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
                          {row.product_name}
                        </h2>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="bg-slate-100 px-3 py-1 rounded-full">
                          <span className="text-slate-500 font-medium">ID:</span>
                          <span className="text-slate-800 ml-1">{String(row.id)}</span>
                        </span>
                        {row.uid && (
                          <span className="bg-blue-100 px-3 py-1 rounded-full">
                            <span className="text-blue-600 font-medium">UID:</span>
                            <span className="text-blue-800 ml-1">{row.uid}</span>
                          </span>
                        )}
                        {row.article && (
                          <span className="bg-violet-100 px-3 py-1 rounded-full">
                            <span className="text-violet-600 font-medium">Артикул:</span>
                            <span className="text-violet-800 ml-1">{row.article}</span>
                          </span>
                        )}
                        {row.code_1c && (
                          <span className="bg-teal-100 px-3 py-1 rounded-full">
                            <span className="text-teal-600 font-medium">Код 1С:</span>
                            <span className="text-teal-800 ml-1">{row.code_1c}</span>
                          </span>
                        )}
                        {typeof row.push_to_pim === "boolean" && (
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            row.push_to_pim 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            PIM: {row.push_to_pim ? "✓ Загружен" : "Не загружен"}
                          </span>
                        )}
                        {typeof row.description_confirmed === "boolean" && (
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            row.description_confirmed 
                              ? "bg-emerald-100 text-emerald-800" 
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {row.description_confirmed ? "✓ Подтверждено" : "○ Не подтверждено"}
                            {row.description_confirmed && row.confirmed_by_email ? ` • ${row.confirmed_by_email}` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Контент карточки */}
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Краткое описание */}
                    {row.short_description && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-slate-800">Краткое описание</h3>
                          <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                            AI Generated
                          </span>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                          <SafeHtml html={row.short_description} className="rich-html rich-html-compact" />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditor(row, "short_description")}
                            className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200"
                          >
                            Редактировать краткое описание
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Полное описание */}
                    {row.description && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-slate-800">Полное описание</h3>
                          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                            AI Generated
                          </span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                          <SafeHtml html={row.description} className="rich-html rich-html-detailed" />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditor(row, "description")}
                            className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200"
                          >
                            Редактировать полное описание
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Если есть только одно описание, покажем его во всю ширину */}
                  {(row.short_description && !row.description) && (
                    <div className="mt-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-slate-800">Описание товара</h3>
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                          AI Generated
                        </span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                        <SafeHtml html={row.short_description} className="rich-html rich-html-detailed" />
                      </div>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => openEditor(row, "short_description")}
                          className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200"
                        >
                          Редактировать описание
                        </button>
                      </div>
                    </div>
                  )}

                  {(!row.short_description && row.description) && (
                    <div className="mt-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-slate-800">Описание товара</h3>
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                          AI Generated
                        </span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                        <SafeHtml html={row.description} className="rich-html rich-html-detailed" />
                      </div>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => openEditor(row, "description")}
                          className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200"
                        >
                          Редактировать описание
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      onClick={() => confirmDescription(row)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      disabled={row.description_confirmed === true}
                    >
                      {row.description_confirmed ? "Описание подтверждено" : "Подтвердить описание"}
                    </button>
                  </div>

                </div>
              </div>
            ))}
            
            {rows.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📦</span>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">Нет товаров для отображения</h3>
                <p className="text-slate-600">Попробуйте изменить фильтры или добавить новые товары</p>
              </div>
            )}
          </div>
        )}

        {/* Дублируем пагинацию снизу для удобства */}
        <PaginationBar
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          remainingToConfirm={remainingToConfirm}
        />
      </div>

      <RichTextEditorModal
        open={editorState.open}
        initialHtml={editorState.initialHtml}
        onCancel={() => setEditorState({ open: false, rowId: null, field: null, initialHtml: "" })}
        onSave={saveEditor}
      />
    </div>
  );
}

