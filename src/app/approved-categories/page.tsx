'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { SafeHtml } from '@/components/SafeHtml'
import { Category } from '@/types/categories'
import { Header } from '@/components/Header'
import { PaginationBar } from '@/components/PaginationBar'
import { CategoryHeader } from '@/components/CategoryHeader'

// Список email-адресов пользователей, имеющих доступ к статистике
const ADMIN_EMAILS = [
    'bakum_y@mail.ru',
    'info.uroven.pro@gmail.com',
    'ekom@uroven.org',
    'shumeiko_fd@uroven.org',
]

export default function ApprovedCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
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
        fetchCategories()
    }, [page, sortOrder]) // eslint-disable-line react-hooks/exhaustive-deps

    async function fetchCategories() {
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
                .from('categories')
                .select('*', { count: 'exact' })
                .eq('description_confirmed', true)
                .eq('confirmed_by_email', user.email)
                .order('updated_at', { ascending: sortOrder === 'asc' })
                .range((page - 1) * pageSize, page * pageSize - 1)

            if (error) {
                setError(error.message)
            } else {
                setCategories(data || [])
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
                        .from('categories')
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
                title="Подтвержденные категории"
                subtitle={`Категории, подтвержденные вами (${currentUser || ''})`}
            />

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                {/* Статистика для специального пользователя */}
                {isSpecialUser && userStats.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-bold text-indigo-700">
                                Статистика подтверждений категорий
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

                {!loading && !error && categories.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                        <p className="text-blue-800">
                            У вас пока нет подтвержденных категорий.
                        </p>
                    </div>
                )}

                {/* Список категорий */}
                {!loading && !error && categories.length > 0 && (
                    <div className="space-y-6">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
                            >
                                {/* Заголовок */}
                                <CategoryHeader 
                                    category={category}
                                    additionalBadges={[
                                        <span key="confirmed" className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
                                            ✓ Подтверждено вами
                                        </span>
                                    ]}
                                />

                                {/* Описание */}
                                <div className="p-6">
                                    {category.description ? (
                                        <div className="space-y-3">
                                            <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                                <div className="w-1 h-5 bg-emerald-400 rounded-full"></div>
                                                Описание категории
                                            </h4>
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                                <SafeHtml
                                                    html={category.description}
                                                    className="rich-html rich-html-detailed"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>Описание отсутствует</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Пагинация снизу */}
                {!loading && categories.length > 0 && (
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
