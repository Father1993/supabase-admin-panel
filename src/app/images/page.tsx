'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Row } from '@/types/products'
import { Header } from '@/components/Header'
import { PaginationBar } from '@/components/PaginationBar'

export default function ImagesPage() {
    const [products, setProducts] = useState<Row[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [remainingToConfirm, setRemainingToConfirm] = useState(0)
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
    const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'rejected' | 'pending'>('all')
    const pageSize = 50

    useEffect(() => {
        fetchProducts()
    }, [page, sortOrder, filterStatus])

    async function fetchProducts() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            window.location.href = '/login'
            return
        }
        setLoading(true)
        setError(null)

        try {
            let query = supabase
                .from('products')
                .select('*', { count: 'exact' })
                .not('image_url', 'is', null)

            // Применяем фильтр по статусу
            if (filterStatus === 'confirmed') {
                query = query.eq('image_confirmed', true)
            } else if (filterStatus === 'rejected') {
                query = query.eq('image_rejected', true)
            } else if (filterStatus === 'pending') {
                query = query.eq('image_confirmed', false).eq('image_rejected', false)
            }

            query = query
                .order('updated_at', { ascending: sortOrder === 'asc' })
                .range((page - 1) * pageSize, page * pageSize - 1)

            const { data, error, count } = await query

            if (error) {
                setError(error.message)
            } else {
                setProducts(data || [])
                setTotal(count || 0)
            }

            // Подсчитываем товары для подтверждения
            const { count: remainingCount } = await supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .eq('image_confirmed', false)
                .eq('image_rejected', false)
                .not('image_url', 'is', null)
            setRemainingToConfirm(remainingCount ?? 0)

        } catch {
            setError('Ошибка загрузки данных')
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Header 
                title="Все изображения" 
                subtitle="Просмотр всех изображений товаров" 
            />

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
                {/* Фильтры и сортировка */}
                <div className="bg-white rounded-lg border p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Фильтр по статусу:
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value as any)
                                    setPage(1)
                                }}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            >
                                <option value="all">Все изображения</option>
                                <option value="pending">Не проверенные</option>
                                <option value="confirmed">Подтвержденные</option>
                                <option value="rejected">Отклоненные</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Сортировка по дате:
                            </label>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                            >
                                <option value="desc">Сначала свежие</option>
                                <option value="asc">Сначала старые</option>
                            </select>
                        </div>
                    </div>
                    {remainingToConfirm > 0 && (
                        <div className="text-sm text-gray-600 pt-2 border-t">
                            Осталось проверить изображений: <span className="font-medium text-gray-900">{remainingToConfirm}</span>
                        </div>
                    )}
                </div>

                {/* Пагинация сверху */}
                {!loading && <PaginationBar page={page} total={total} pageSize={pageSize} onPageChange={setPage} />}

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

                {/* Список изображений */}
                {!loading && !error && products.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
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
                                    
                                    {/* Статус в углу */}
                                    <div className="absolute top-2 right-2">
                                        {product.image_confirmed && (
                                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                                ✓
                                            </span>
                                        )}
                                        {product.image_rejected && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                                ✗
                                            </span>
                                        )}
                                        {!product.image_confirmed && !product.image_rejected && (
                                            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                                                ?
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Информация о товаре */}
                                <div className="p-3">
                                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                                        {product.product_name || 'Без названия'}
                                    </h3>
                                    <div className="space-y-1 text-xs text-gray-600">
                                        {product.article && (
                                            <p>Арт: {product.article}</p>
                                        )}
                                        {product.code_1c && (
                                            <p>1С: {product.code_1c}</p>
                                        )}
                                    </div>
                                    
                                    {/* Статус */}
                                    <div className="mt-2">
                                        {product.image_confirmed && (
                                            <div className="text-xs text-green-700">
                                                <span className="font-medium">Подтверждено</span>
                                                {product.image_confirmed_by_email && (
                                                    <p className="text-gray-600 truncate">{product.image_confirmed_by_email}</p>
                                                )}
                                            </div>
                                        )}
                                        {product.image_rejected && (
                                            <span className="text-xs font-medium text-red-700">Отклонено</span>
                                        )}
                                        {!product.image_confirmed && !product.image_rejected && (
                                            <span className="text-xs font-medium text-yellow-700">Ожидает проверки</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && !error && products.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                        <p className="text-blue-800">
                            Нет изображений для отображения.
                        </p>
                    </div>
                )}

                {/* Пагинация снизу */}
                {!loading && products.length > 0 && (
                    <PaginationBar page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
                )}
            </div>
        </div>
    )
}