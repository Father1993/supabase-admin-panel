"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SafeHtml } from "@/components/SafeHtml";
import Link from "next/link";

type Row = {
	id: string | number;
	row_number?: number | null;
	uid?: string | null;
	product_name?: string | null;
	short_description?: string | null;
	description?: string | null;
	description_added?: boolean | null;
	push_to_pim?: boolean | null;
};

export default function AdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 50;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      setLoading(true);
      setError(null);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("products")
        .select(
          "row_number, id, uid, product_name, short_description, description, description_added, push_to_pim",
          { count: "exact" }
        )
        .eq("description_added", true)
        .order("id", { ascending: false })
        .range(from, to);

      if (error) {
        setError(error.message);
        setRows([]);
        setTotal(0);
      } else {
        setRows(data ?? []);
        setTotal(count ?? 0);
      }
      setLoading(false);
    };
    fetchData();
  }, [page]);

  async function onLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Шапка */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Админка товаров
              </h1>
              <p className="text-slate-600 mt-1">Проверка и оценка AI-генерированных описаний</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/" 
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                На главную
              </Link>
              <button 
                onClick={onLogout} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

      {/* Информация о пагинации */}
      <PaginationBar
        page={page}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
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
              <div key={row.id} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
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
                        {typeof row.row_number !== "undefined" && row.row_number !== null && (
                          <span className="bg-indigo-100 px-3 py-1 rounded-full">
                            <span className="text-indigo-600 font-medium">Row #:</span>
                            <span className="text-indigo-800 ml-1">{row.row_number}</span>
                          </span>
                        )}
                        {typeof row.push_to_pim === "boolean" && (
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            row.push_to_pim 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            PIM: {row.push_to_pim ? "✓ Готов" : "○ Не готов"}
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
                    </div>
                  )}


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
        />
      </div>
    </div>
  );
}

type PaginationProps = {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
};

function PaginationBar({ page, total, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-slate-600 font-medium">
          Показано <span className="text-slate-900 font-semibold">{from}–{to}</span> из <span className="text-slate-900 font-semibold">{total}</span> товаров
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            « Первая
          </button>
          <button
            className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            ‹ Назад
          </button>
          <span className="px-4 py-2 text-sm font-semibold text-slate-800 bg-blue-50 border border-blue-200 rounded-lg">
            Стр. {page} / {totalPages}
          </span>
          <button
            className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Вперёд ›
          </button>
          <button
            className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
          >
            Последняя »
          </button>
        </div>
      </div>
    </div>
  );
}


