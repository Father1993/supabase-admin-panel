'use client'

import Link from 'next/link'
import Image from 'next/image'
import Logo from '@/images/logo.png'

export default function Home() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50'>
      <div className='max-w-7xl mx-auto px-6 py-12'>
        {/* Верх: логотип и кнопка входа */}
        <header className='flex items-center justify-between mb-12'>
          <div className='relative h-12 w-[210px] sm:h-14 sm:w-[250px]'>
            <Image
              src={Logo}
              alt='Уровень — территория ремонта'
              fill
              className='object-contain'
              priority
            />
          </div>
          <div className='flex items-center gap-4'>
            <span className='text-sm text-slate-600 hidden sm:block'>
              Внутренний сервис компании
            </span>
            <Link
              href='/login'
              className='inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium'
            >
              <span>🚪</span>
              Войти
            </Link>
          </div>
        </header>

        {/* Основной контент: две колонки */}
        <section className='grid lg:grid-cols-[70%_30%] gap-8 items-stretch'>
          {/* Левая колонка: действия */}
          <div className='flex flex-col gap-6'>
            {/* Товары */}
            <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-6 flex-1 flex flex-col'>
              <h2 className='text-lg font-semibold text-slate-900 mb-4'>
                📦 Товары
              </h2>
              <div className='space-y-3 flex-1 flex flex-col justify-start'>
                <Link
                  href='/admin'
                  className='flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition w-full justify-center'
                >
                  <span>🔍</span>
                  Начать проверку
                </Link>
                <Link
                  href='/products'
                  className='flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition w-full justify-center'
                >
                  <span>📋</span>
                  Список товаров
                </Link>
                <Link
                  href='/approved-products'
                  className='flex items-center gap-2 px-5 py-3 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition w-full justify-center'
                >
                  <span>✅</span>
                  Подтверждённые товары
                </Link>
              </div>
            </div>

            {/* Категории */}
            <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-6 flex-1 flex flex-col'>
              <h2 className='text-lg font-semibold text-slate-900 mb-4'>
                🏷️ Категории
              </h2>
              <div className='space-y-3 flex-1 flex flex-col justify-start'>
                <Link
                  href='/admin/categories'
                  className='flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition w-full justify-center'
                >
                  <span>🔍</span>
                  Проверка категорий
                </Link>
                <Link
                  href='/categories'
                  className='flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition w-full justify-center'
                >
                  <span>📋</span>
                  Список категорий
                </Link>
                <Link
                  href='/approved-categories'
                  className='flex items-center gap-2 px-5 py-3 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition w-full justify-center'
                >
                  <span>✅</span>
                  Подтверждённые категории
                </Link>
              </div>
            </div>

            {/* Категории */}
            <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-6 flex-1 flex flex-col'>
              <h2 className='text-lg font-semibold text-slate-900 mb-4'>
                📷 Изображения
              </h2>
              <div className='space-y-3 flex-1 flex flex-col justify-start'>
                <Link
                  href='/admin/images'
                  className='flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition w-full justify-center'
                >
                  <span>🔍</span>
                  Проверка изображений
                </Link>
                <Link
                  href='/images'
                  className='flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition w-full justify-center'
                >
                  <span>📋</span>
                  Список изображений
                </Link>
                <Link
                  href='/approved-images'
                  className='flex items-center gap-2 px-5 py-3 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition w-full justify-center'
                >
                  <span>✅</span>
                  Подтверждённые изображения
                </Link>
              </div>
            </div>
          </div>

          {/* Правая колонка: инструкция */}
          <div className='bg-white/80 backdrop-blur rounded-xl border border-slate-200 shadow-lg p-6 flex flex-col'>
            <h2 className='text-lg font-semibold text-slate-900 mb-6'>
              📖 Инструкция
            </h2>

            <div className='space-y-6 flex-1'>
              <div>
                <h3 className='text-base font-semibold text-slate-800 mb-3'>
                  Для кого
                </h3>
                <ul className='text-slate-700 space-y-1 text-sm'>
                  <li>• Сотрудники контент-отдела</li>
                  <li>• Менеджеры продуктов</li>
                  <li>• Редакторы описаний</li>
                </ul>
              </div>

              <div>
                <h3 className='text-base font-semibold text-slate-800 mb-3'>
                  Как это работает
                </h3>
                <ol className='text-slate-700 space-y-1 text-sm'>
                  <li>1. Авторизуйтесь через Supabase</li>
                  <li>2. Выберите раздел для работы</li>
                  <li>3. Редактируйте HTML-описания</li>
                  <li>4. Подтвердите готовые описания</li>
                </ol>
              </div>

              <div className='text-xs text-slate-500 pt-4 border-t border-slate-200'>
                Данные хранятся в Supabase. Все изменения автоматически
                логируются с отметкой времени и email пользователя.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
