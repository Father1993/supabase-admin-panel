'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { SafeHtml } from '@/components/SafeHtml'
import { Row } from '@/types/products'
import { Header } from '@/components/Header'
import { PaginationBar } from '@/components/PaginationBar'

// Список email-адресов пользователей, имеющих доступ к статистике
// Для добавления нового пользователя просто добавьте его email в этот массив
const ADMIN_EMAILS = [
    'bakum_y@mail.ru',
    'info.uroven.pro@gmail.com',
    'ekom@uroven.org',
    'shumeiko_fd@uroven.org',
]

export default function ApprovedProductsPage() {
    const [products, setProducts] = useState<Row[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [currentUser, setCurrentUser] = useState<string | null>(null)
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
    const [userStats, setUserStats] = useState<
        { email: string; count: number }[]
    >([])
    const [isSpecialUser, setIsSpecialUser] = useState(false)
    const pageSize = 50

    useEffect(() => {
        fetchProducts()
    }, [page, sortOrder]) // eslint-disable-line react-hooks/exhaustive-deps

    async function fetchProducts() {
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            window.location.href = '/login'
            return
        }
        const userEmail = user.email ?? null
        setCurrentUser(userEmail)
        setLoading(true)
        setError(null)

        // Проверка, имеет ли пользователь доступ к статистике
        const isSpecial = userEmail !== null && ADMIN_EMAILS.includes(userEmail)
        setIsSpecialUser(isSpecial)

        try {
            const { data, error, count } = await supabase
                .from('products')
                .select('*', { count: 'exact' })
                .eq('description_confirmed', true)
                .eq('confirmed_by_email', user.email)
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

        // Загрузка статистики для специального пользователя
        if (isSpecial) {
            try {
                // Получаем все подтвержденные записи
                const { data: allConfirmedData, error: statsError } =
                    await supabase
                        .from('products')
                        .select('confirmed_by_email')
                        .eq('description_confirmed', true)
                        .not('confirmed_by_email', 'is', null)

                if (!statsError && allConfirmedData) {
                    // Обрабатываем данные на клиенте
                    const stats: Record<string, number> = {}

                    // Подсчитываем количество для каждого email
                    allConfirmedData.forEach((item) => {
                        const email = item.confirmed_by_email as string
                        stats[email] = (stats[email] || 0) + 1
                    })

                    // Преобразуем в массив для сортировки
                    const statsArray = Object.entries(stats).map(
                        ([email, count]) => ({
                            email,
                            count,
                        })
                    )

                    // Сортируем по убыванию количества
                    statsArray.sort((a, b) => b.count - a.count)

                    setUserStats(statsArray)
                }
            } catch (err) {
                console.error('Ошибка при загрузке статистики:', err)
            }
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Header
                title="Подтвержденные товары"
                subtitle={`Товары, подтвержденные вами (${currentUser || ''})`}
            />

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                {/* Статистика для специального пользователя */}
                {isSpecialUser && userStats.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-bold text-indigo-700">
                                Статистика подтверждений товаров
                            </h3>
                            <div className="bg-indigo-100 text-indigo-600 text-xs rounded-full px-3 py-1">
                                Доступно только администраторам
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg border border-indigo-200 bg-white">
                            <table className="min-w-full divide-y divide-indigo-200">
                                <thead className="bg-indigo-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider"
                                        >
                                            Email сотрудника
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider"
                                        >
                                            Количество подтверждений
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-indigo-100">
                                    {userStats.map((stat, idx) => (
                                        <tr
                                            key={idx}
                                            className={
                                                idx % 2 === 0
                                                    ? 'bg-white'
                                                    : 'bg-indigo-50'
                                            }
                                        >
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {stat.email}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-indigo-700">
                                                {stat.count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {/* Сортировка */}
                <div className="bg-white rounded-lg border p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Сортировка по дате обновления:
                    </label>
                    <select
                        value={sortOrder}
                        onChange={(e) =>
                            setSortOrder(e.target.value as 'desc' | 'asc')
                        }
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
                            У вас пока нет подтвержденных товаров.
                        </p>
                    </div>
                )}

                {/* Список товаров */}
                {!loading && !error && products.length > 0 && (
                    <div className="space-y-6">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
                            >
                                {/* Заголовок */}
                                <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {product.product_name && (
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                                    {product.product_name}
                                                </h3>
                                            )}
                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <span className="bg-slate-100 px-3 py-1 rounded-full">
                                                    <span className="text-slate-500 font-medium">
                                                        ID:
                                                    </span>
                                                    <span className="text-slate-800 ml-1">
                                                        {String(product.id)}
                                                    </span>
                                                </span>
                                                {product.uid && (
                                                    <span className="bg-blue-100 px-3 py-1 rounded-full">
                                                        <span className="text-blue-600 font-medium">
                                                            UID:
                                                        </span>
                                                        <span className="text-blue-800 ml-1">
                                                            {product.uid}
                                                        </span>
                                                    </span>
                                                )}
                                                {product.article && (
                                                    <span className="bg-violet-100 px-3 py-1 rounded-full">
                                                        <span className="text-violet-600 font-medium">
                                                            Артикул:
                                                        </span>
                                                        <span className="text-violet-800 ml-1">
                                                            {product.article}
                                                        </span>
                                                    </span>
                                                )}
                                                {product.code_1c && (
                                                    <span className="bg-teal-100 px-3 py-1 rounded-full">
                                                        <span className="text-teal-600 font-medium">
                                                            Код 1С:
                                                        </span>
                                                        <span className="text-teal-800 ml-1">
                                                            {product.code_1c}
                                                        </span>
                                                    </span>
                                                )}
                                                {typeof product.push_to_pim ===
                                                    'boolean' && (
                                                    <span
                                                        className={`px-3 py-1 rounded-full font-medium ${
                                                            product.push_to_pim
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                    >
                                                        PIM:{' '}
                                                        {product.push_to_pim
                                                            ? '✓ Загружен'
                                                            : 'Не загружен'}
                                                    </span>
                                                )}
                                                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
                                                    ✓ Подтверждено вами
                                                </span>
                                                {product.link_pim && (
                                                <a
                                                    href={product.link_pim}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium hover:bg-blue-200"
                                                >
                                                    Открыть в PIM ↗
                                                </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {product.updated_at &&
                                                new Date(
                                                    product.updated_at
                                                ).toLocaleDateString('ru')}
                                        </div>
                                    </div>
                                </div>

                                {/* Описания */}
                                <div className="p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {product.short_description && (
                                            <div className="space-y-3">
                                                <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                                    <div className="w-1 h-5 bg-amber-400 rounded-full"></div>
                                                    Краткое описание
                                                </h4>
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                                    <SafeHtml
                                                        html={
                                                            product.short_description
                                                        }
                                                        className="rich-html rich-html-compact"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {product.description && (
                                            <div className="space-y-3">
                                                <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                                    <div className="w-1 h-5 bg-emerald-400 rounded-full"></div>
                                                    Полное описание
                                                </h4>
                                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                                    <SafeHtml
                                                        html={
                                                            product.description
                                                        }
                                                        className="rich-html rich-html-detailed"
                                                    />
                                                </div>
                                            </div>
                                        )}
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
