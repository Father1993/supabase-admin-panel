"use client";

import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { supabase } from "@/lib/supabaseClient";
import { SafeHtml } from "@/components/SafeHtml";
import { Row } from "@/types/products";
import { Header } from "@/components/Header";

import { RichTextEditorModal } from "@/components/RichTextEditorModal";

export default function AdminPage() {
  const [currentRow, setCurrentRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [remainingToConfirm, setRemainingToConfirm] = useState(0);

  const [editorState, setEditorState] = useState<{
    open: boolean;
    rowId: string | number | null;
    field: "short_description" | "description" | null;
    initialHtml: string;
  }>({ open: false, rowId: null, field: null, initialHtml: "" });

  useEffect(() => {
    const fetchRandomRow = async () => {
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

      try {
        // Освобождаем просроченные блокировки (больше 10 минут)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        await supabase
          .from("products")
          .update({ locked_until: null })
          .lt("locked_until", tenMinutesAgo);

        // Ищем свободную рандомную карточку
        const { data, error } = await supabase
          .from("products")
          .select("row_number, id, uid, product_name, article, code_1c, short_description, description, description_added, push_to_pim, description_confirmed, confirmed_by_email, created_at, updated_at, locked_until")
          .eq("description_added", true)
          .eq("description_confirmed", false)
          .or("locked_until.is.null,locked_until.lt." + new Date().toISOString())
          .limit(50); // Берём 50 записей для рандомизации

        if (error) {
          setError(error.message);
          setCurrentRow(null);
        } else if (data && data.length > 0) {
          // Выбираем случайную карточку из полученных
          const randomIndex = Math.floor(Math.random() * data.length);
          const row = data[randomIndex];
          
          // Блокируем карточку на 10 минут
          const lockUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          await supabase
            .from("products")
            .update({ locked_until: lockUntil })
            .eq("id", row.id);

          setCurrentRow({ ...row, locked_until: lockUntil });
        } else {
          setCurrentRow(null);
          setError("Нет доступных товаров для подтверждения");
        }

        // Подсчитываем оставшиеся товары
        const { count: remainingCount } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("description_added", true)
          .eq("description_confirmed", false);
        setRemainingToConfirm(remainingCount ?? 0);

      } catch {
        setError("Ошибка загрузки данных");
        setCurrentRow(null);
      }
      
      setLoading(false);
    };
    
    fetchRandomRow();
  }, []);

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
    if (updated && currentRow) {
      setCurrentRow({ ...currentRow, ...updated });
    }
    setEditorState({ open: false, rowId: null, field: null, initialHtml: "" });
  }

  async function confirmDescription(row: Row) {
    if (!currentUserEmail) {
      alert("Нет email пользователя. Авторизуйтесь заново.");
      return;
    }
    const { error } = await supabase
      .from("products")
      .update({ 
        description_confirmed: true, 
        confirmed_by_email: currentUserEmail,
        locked_until: null // Освобождаем блокировку
      })
      .eq("id", row.id)
      .select("id, description_confirmed, confirmed_by_email");
    if (error) {
      alert(`Ошибка подтверждения: ${error.message}`);
      return;
    }
    
    // Успешно подтвердили - загружаем следующую карточку
    setRemainingToConfirm((x) => Math.max(0, x - 1));
    window.location.reload(); // Простая перезагрузка для получения новой карточки
  }
  
  async function loadNextCard() {
    window.location.reload(); // Простая перезагрузка для получения новой карточки
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Шапка */}
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

      {/* Информация о работе */}
      <div className="bg-white border rounded-lg px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Осталось товаров для подтверждения: <span className="font-medium text-gray-900">{remainingToConfirm}</span>
        </div>
        <button
          onClick={loadNextCard}
          className="px-4 py-2 border rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Загрузить следующий товар
        </button>
      </div>

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

        {!loading && !error && currentRow && (
          <div className="space-y-8">
            <div
              className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Заголовок карточки */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-8 py-6 border-b border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {currentRow.product_name && (
                        <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
                          {currentRow.product_name}
                        </h2>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="bg-slate-100 px-3 py-1 rounded-full">
                          <span className="text-slate-500 font-medium">ID:</span>
                          <span className="text-slate-800 ml-1">{String(currentRow.id)}</span>
                        </span>
                        {currentRow.uid && (
                          <span className="bg-blue-100 px-3 py-1 rounded-full">
                            <span className="text-blue-600 font-medium">UID:</span>
                            <span className="text-blue-800 ml-1">{currentRow.uid}</span>
                          </span>
                        )}
                        {currentRow.article && (
                          <span className="bg-violet-100 px-3 py-1 rounded-full">
                            <span className="text-violet-600 font-medium">Артикул:</span>
                            <span className="text-violet-800 ml-1">{currentRow.article}</span>
                          </span>
                        )}
                        {currentRow.code_1c && (
                          <span className="bg-teal-100 px-3 py-1 rounded-full">
                            <span className="text-teal-600 font-medium">Код 1С:</span>
                            <span className="text-teal-800 ml-1">{currentRow.code_1c}</span>
                          </span>
                        )}
                        {typeof currentRow.push_to_pim === "boolean" && (
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            currentRow.push_to_pim 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            PIM: {currentRow.push_to_pim ? "✓ Загружен" : "Не загружен"}
                          </span>
                        )}
                        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium text-xs">
                          🔒 Заблокировано для вас
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Контент карточки */}
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Краткое описание */}
                    {currentRow.short_description && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-slate-800">Краткое описание</h3>
                          <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                            AI Generated
                          </span>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                          <SafeHtml html={currentRow.short_description} className="rich-html rich-html-compact" />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditor(currentRow, "short_description")}
                            className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200"
                          >
                            Редактировать краткое описание
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Полное описание */}
                    {currentRow.description && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-slate-800">Полное описание</h3>
                          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                            AI Generated
                          </span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                          <SafeHtml html={currentRow.description} className="rich-html rich-html-detailed" />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditor(currentRow, "description")}
                            className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200"
                          >
                            Редактировать полное описание
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Если есть только одно описание, покажем его во всю ширину */}
                  {(currentRow.short_description && !currentRow.description) && (
                    <div className="mt-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-slate-800">Описание товара</h3>
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                          AI Generated
                        </span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                        <SafeHtml html={currentRow.short_description} className="rich-html rich-html-detailed" />
                      </div>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => openEditor(currentRow, "short_description")}
                          className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200"
                        >
                          Редактировать описание
                        </button>
                      </div>
                    </div>
                  )}

                  {(!currentRow.short_description && currentRow.description) && (
                    <div className="mt-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-slate-800">Описание товара</h3>
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                          AI Generated
                        </span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                        <SafeHtml html={currentRow.description} className="rich-html rich-html-detailed" />
                      </div>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => openEditor(currentRow, "description")}
                          className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200"
                        >
                          Редактировать описание
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      onClick={() => confirmDescription(currentRow)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      Подтвердить описание
                    </button>
                  </div>

                </div>
              </div>
          </div>
        )}

        {!loading && !error && !currentRow && (
          <div className="text-center py-12">
            <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">Нет товаров для подтверждения</h3>
            <p className="text-slate-600">Все товары уже обработаны или заблокированы другими пользователями</p>
            <button
              onClick={loadNextCard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Попробовать снова
            </button>
          </div>
        )}
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

