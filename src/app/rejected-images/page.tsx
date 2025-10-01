'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Row } from '@/types/products'
import { Header } from '@/components/Header'
import { PaginationBar } from '@/components/PaginationBar'

export default function RejectedImagesPage() {
    const [products, setProducts] = useState<Row[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
    const pageSize = 50

    useEffect(() => {
        fetchProducts()
    }, [page, sortOrder])

    async function fetchProducts() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            window.location.href = '/login'
            return
        }
        setLoading(true)
        setError(null)

        try {
            const { data, error, count } = await supabase
                .from('products')
                .select('*', { count: 'exact' })
                .eq('image_rejected', true)
                .order('updated_at', { ascending: sortOrder === 'asc' })
                .range((page - 1) * pageSize, page * pageSize - 1)

            if (error) {
                setError(error.message)
            } else {
                setProducts(data || [])
                setTotal(count || 0)
            }
        } catch {
            setError('Ошибка загрузки данных')
        }

        setLoading(false)
    }

    async function restoreImage(product: Row) {
        const { error } = await supabase
            .from('products')
            .update({
                image_rejected: false,
            })
            .eq('id', product.id)
            
        if (error) {
            alert(`Ошибка восстановления: ${error.message}`)
            return
        }

        // Обновляем список
        await fetchProducts()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Header
                title="Отклоненные изображения"
                subtitle="Изображения, которые были отклонены при проверке"
            />

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                {/* Сортировка */}
                <div className="bg-white rounded-lg border p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Сортировка по дате обновления:
                    </label>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                        <option value="desc">Сначала свежие</option>
                        <option value="asc">Сначала старые</option>
                    </select>
                </div>

                {/* Пагинация сверху */}
                {!loading && (
                    <PaginationBar
                        page={page}
                        total={total}
                        pageSize={pageSize}
                        onPageChange={setPage}
                    />
                )}

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-slate-600 ml-3">Загрузка...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">Ошибка: {error}</p>
                    </div>
                )}

                {!loading && !error && products.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                        <p className="text-blue-800">
                            Нет отклоненных изображений.
                        </p>
                    </div>
                )}

                {/* Список товаров */}
                {!loading && !error && products.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                {/* Изображение */}
                                <div className="aspect-square relative bg-gray-100">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.product_name || 'Изображение товара'}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                <polyline points="21 15 16 10 5 21"></polyline>
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Информация о товаре */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {product.product_name || 'Без названия'}
                                    </h3>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        {product.article && (
                                            <p>Артикул: <span className="font-medium">{product.article}</span></p>
                                        )}
                                        {product.code_1c && (
                                            <p>Код 1С: <span className="font-medium">{product.code_1c}</span></p>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            ✗ Отклонено
                                        </span>
                                        <button
                                            onClick={() => restoreImage(product)}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Восстановить
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Пагинация снизу */}
                {!loading && products.length > 0 && (
                    <PaginationBar
                        page={page}
                        total={total}
                        pageSize={pageSize}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </div>
    )
}