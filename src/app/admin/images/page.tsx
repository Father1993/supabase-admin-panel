'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Row } from '@/types/products'
import { Header } from '@/components/Header'

export default function AdminImagesPage() {
    const [products, setProducts] = useState<Row[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
    const [remainingToConfirm, setRemainingToConfirm] = useState(0)

    const [imageSize, setImageSize] = useState<{w:number,h:number} | null>(null)

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            window.location.href = '/login'
            return
        }
        setCurrentUserEmail(user.email ?? null)
        setLoading(true)
        setError(null)

        try {
            // Получаем товары для проверки картинок
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('image_confirmed', false)
                .eq('image_rejected', false)
                .not('image_optimized_url', 'is', null)
                .limit(50)

            if (error) {
                setError(error.message)
            } else {
                setProducts(data || [])
            }

            // Подсчитываем оставшиеся для проверки
            const { count: remainingCount } = await supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .eq('image_confirmed', false)
                .eq('image_rejected', false)
                .not('image_optimized_url', 'is', null)
            setRemainingToConfirm(remainingCount ?? 0)
        } catch {
            setError('Ошибка загрузки данных')
        }

        setLoading(false)
    }

    async function confirmImage(product: Row) {
        if (!currentUserEmail) {
            alert('Нет email пользователя. Авторизуйтесь заново.')
            return
        }
        
        const { error } = await supabase
            .from('products')
            .update({
                image_confirmed: true,
                image_confirmed_by_email: currentUserEmail,
            })
            .eq('id', product.id)
            
        if (error) {
            alert(`Ошибка подтверждения: ${error.message}`)
            return
        }

        // Переходим к следующей картинке
        setRemainingToConfirm(prev => Math.max(0, prev - 1))
        if (currentIndex < products.length - 1) {
            setCurrentIndex(currentIndex + 1)
        } else {
            // Загружаем новую порцию
            await fetchProducts()
            setCurrentIndex(0)
        }
    }

    async function rejectImage(product: Row) {
        const { error } = await supabase
            .from('products')
            .update({
                image_rejected: true,
            })
            .eq('id', product.id)
            
        if (error) {
            alert(`Ошибка отклонения: ${error.message}`)
            return
        }

        // Переходим к следующей картинке
        setRemainingToConfirm(prev => Math.max(0, prev - 1))
        if (currentIndex < products.length - 1) {
            setCurrentIndex(currentIndex + 1)
        } else {
            // Загружаем новую порцию
            await fetchProducts()
            setCurrentIndex(0)
        }
    }

    const currentProduct = products[currentIndex]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Header 
                title="Проверка изображений"
                subtitle="Подтверждение качества изображений товаров"
            />

            <div className=" px-6 py-8 ">
                {/* Информация о работе */}
                <div className="bg-white border rounded-lg px-4 py-3">
                    <div className="text-sm text-gray-600">
                        Осталось изображений для проверки:{' '}
                        <span className="font-medium text-gray-900">
                            {remainingToConfirm}
                        </span>
                    </div>
                </div>

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

                {!loading && !error && currentProduct && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                        {/* Заголовок */}
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">
                                        {currentProduct.product_name || 'Без названия'}
                                    </h2>
                                    <div className="flex gap-3 mt-2 text-sm text-slate-600">
                                        {currentProduct.article && (
                                            <span>Артикул: <span className="font-medium">{currentProduct.article}</span></span>
                                        )}
                                        {currentProduct.code_1c && (
                                            <span>Код 1С: <span className="font-medium">{currentProduct.code_1c}</span></span>
                                        )}
                                    </div>
                                </div>
                                
                            </div>
                        </div>

                        {/* Изображение и кнопки */}
                        <div className="p-8">
                            <div className="flex flex-col items-center  overflow-auto  w-full h-full">
                                {/* Изображение */}
                                
                                <div className="relative  border-1 border-orange-300 p-0 bg-gray-100 rounded-0 "
                                >
                                    {currentProduct.image_optimized_url && (
                                        // TODO Поменять на Image
                                        <img 
                                        className=' '
                                             src={currentProduct.image_optimized_url}
                                             alt={currentProduct.product_name || 'Изображение товара'}
                                             style={{ 
                                               minWidth: imageSize?.w, 
                                               minHeight: imageSize?.h 
                                             }}
                                             onLoad={(e) => {
                                               const img = e.currentTarget
                                               setImageSize({ w: img.naturalWidth, h: img.naturalHeight })
                                             }}
                                            />
                                    )}
                                </div>

                                {/* Статус */}
                                <div className="text-center">
                                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                                        currentProduct.image_confirmed 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {currentProduct.image_confirmed ? '✓ Проверено' : '⏳ Не проверено'}
                                    </span>
                                </div>
                                {imageSize && (
                                    <p className="text-sm text-gray-600">
                                        Размер: <span className="font-medium">{imageSize.w} × {imageSize.h}</span> px
                                    </p>
                                )}

                                {/* Кнопки управления */}
                                <div className="flex items-center gap-8">
                                    <button
                                        onClick={() => rejectImage(currentProduct)}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium cursor-pointer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                        Отклонить изображения
                                    </button>
                                    
                                    <button
                                        onClick={() => confirmImage(currentProduct)}
                                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium cursor-pointer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        Подтвердить изображения
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && !error && products.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🎉</span>
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 mb-2">
                            Нет изображений для проверки
                        </h3>
                        <p className="text-slate-600">
                            Все изображения уже проверены или отклонены
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}