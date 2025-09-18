'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Props = { title?: string; subtitle?: string }

export function Header({
    title = 'Админка товаров — Уровень',
    subtitle = 'Проверка и оценка AI-генерированных описаний',
}: Props) {
    const pathname = usePathname()
    const [menuOpen, setMenuOpen] = useState(false)
    
    async function handleLogout() {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }
    
    const isActive = (path: string) => {
        return pathname === path
    }

    return (
        <div className="bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {title}
                            </h1>
                            <p className="text-slate-600 mt-1 text-sm sm:text-sm">{subtitle}</p>
                        </div>
                        <button 
                            className={`md:hidden p-2 rounded-lg transition-colors ${
                                menuOpen 
                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Открыть меню"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform">
                                {menuOpen ? (
                                    <>
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </>
                                ) : (
                                    <>
                                        <line x1="4" y1="12" x2="20" y2="12"></line>
                                        <line x1="4" y1="6" x2="20" y2="6"></line>
                                        <line x1="4" y1="18" x2="20" y2="18"></line>
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                    
                    <nav className={`${
                        menuOpen 
                            ? 'flex max-h-[400px] opacity-100' 
                            : 'max-h-0 opacity-0 md:max-h-[400px] md:opacity-100'
                    } md:flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto overflow-hidden transition-all duration-300`}>
                        <Link
                            href="/"
                            className={`px-2 py-2 rounded-lg flex items-center gap-2 transition-colors ${isActive('/') 
                                ? 'bg-blue-50 text-blue-700 font-medium' 
                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            На главную
                        </Link>
                        <Link
                            href="/admin"
                            className={`px-2 py-2 rounded-lg flex items-center gap-2 transition-colors ${isActive('/admin') 
                                ? 'bg-blue-50 text-blue-700 font-medium' 
                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            Начать проверку
                        </Link>
                        <Link
                            href="/products"
                            className={`px-2 py-2 rounded-lg flex items-center gap-2 transition-colors ${isActive('/products') 
                                ? 'bg-blue-50 text-blue-700 font-medium' 
                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="9" y1="21" x2="9" y2="9"></line>
                            </svg>
                            Все товары
                        </Link>
                        <Link
                            href="/approved-products"
                            className={`px-2 py-2 rounded-lg flex items-center gap-2 transition-colors ${isActive('/approved-products') 
                                ? 'bg-blue-50 text-blue-700 font-medium' 
                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            Мои подтверждения
                        </Link>
                        <button
                            onClick={() => {
                                setMenuOpen(false)
                                handleLogout()
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300 flex items-center gap-2 md:ml-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Выйти
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    )
}
