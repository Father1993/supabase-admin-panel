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
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Админка — просмотр записей</h1>
        <div className="flex gap-3">
          <Link href="/" className="underline">
            На главную
          </Link>
          <button onClick={onLogout} className="border rounded px-3 py-1">
            Выйти
          </button>
        </div>
      </div>

      {/* Информация о пагинации */}
      <PaginationBar
        page={page}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      {loading && <p>Загрузка...</p>}
      {error && (
        <p className="text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6">
          {rows.map((row) => (
            <div key={row.id} className="border rounded p-4 space-y-4 bg-white text-gray-900">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  {row.product_name && (
                    <h2 className="text-lg font-medium">{row.product_name}</h2>
                  )}
                  <div className="text-sm text-gray-600 flex flex-wrap gap-3">
                    <span>
                      <span className="text-gray-500">ID:</span> {String(row.id)}
                    </span>
                    {row.uid && (
                      <span>
                        <span className="text-gray-500">UID:</span> {row.uid}
                      </span>
                    )}
                    {typeof row.row_number !== "undefined" && row.row_number !== null && (
                      <span>
                        <span className="text-gray-500">Row #:</span> {row.row_number}
                      </span>
                    )}
                    {typeof row.push_to_pim === "boolean" && (
                      <span className={row.push_to_pim ? "text-green-700" : "text-gray-500"}>
                        push_to_pim: {row.push_to_pim ? "true" : "false"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {row.short_description && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Кратко</div>
                    <SafeHtml html={row.short_description} className="rich-html" />
                  </div>
                )}
                {row.description && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Описание</div>
                    <SafeHtml html={row.description} className="rich-html" />
                  </div>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="text-gray-600">Нет данных для отображения.</p>
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
    <div className="flex items-center justify-between gap-4 border rounded px-4 py-2 bg-white text-gray-900">
      <div className="text-sm text-gray-600">
        Показано {from}–{to} из {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="border rounded px-3 py-1 disabled:opacity-50"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >
          « Первая
        </button>
        <button
          className="border rounded px-3 py-1 disabled:opacity-50"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          ‹ Назад
        </button>
        <span className="text-sm text-gray-700">Стр. {page} / {totalPages}</span>
        <button
          className="border rounded px-3 py-1 disabled:opacity-50"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Вперёд ›
        </button>
        <button
          className="border rounded px-3 py-1 disabled:opacity-50"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
        >
          Последняя »
        </button>
      </div>
    </div>
  );
}


