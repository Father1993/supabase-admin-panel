'use client'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Props = { title?: string; subtitle?: string }

export function Header({
    title = 'Админка товаров — Уровень',
    subtitle = 'Проверка и оценка AI-генерированных описаний',
}: Props) {
    async function handleLogout() {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <div className="bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {title}
                        </h1>
                        <p className="text-slate-600 mt-1">{subtitle}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/"
                            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            На главную
                        </Link>
                        <Link
                            href="/approved-products"
                            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            Мои подтверждения
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300"
                        >
                            Выйти
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
