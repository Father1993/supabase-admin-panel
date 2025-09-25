'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Props = { title?: string; subtitle?: string }

// Компонент выпадающего меню
function DropdownMenu({ 
    title, 
    icon, 
    children, 
    isActive,
    onMenuClose 
}: { 
    title: string
    icon: React.ReactNode
    children: React.ReactNode
    isActive: boolean
    onMenuClose: () => void
}) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLinkClick = () => {
        setIsOpen(false)
        onMenuClose()
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-2 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    isActive 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
                {icon}
                {title}
                <svg 
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-[9999]">
                    <div onClick={handleLinkClick}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    )
}

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
    
    const isActive = (path: string) => pathname === path
    
    const isProductsActive = ['/admin', '/products', '/approved-products'].includes(pathname)
    const isCategoriesActive = ['/admin/categories', '/categories', '/approved-categories'].includes(pathname)

    return (
        <div className="bg-white border-b border-slate-200 shadow-sm relative">
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
                    } md:flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto md:overflow-visible overflow-hidden transition-all duration-300`}>
                        {/* На главную */}
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

                        {/* Товары */}
                        <DropdownMenu 
                            title="Товары"
                            isActive={isProductsActive}
                            onMenuClose={() => setMenuOpen(false)}
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="3" y1="9" x2="21" y2="9"></line>
                                    <line x1="9" y1="21" x2="9" y2="9"></line>
                                </svg>
                            }
                        >
                            <Link href="/admin" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg mx-1">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                    Начать проверку
                                </div>
                            </Link>
                            <Link href="/products" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg mx-1">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
                                    </svg>
                                    Все товары
                                </div>
                            </Link>
                            <Link href="/approved-products" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg mx-1">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                    Мои подтверждения
                                </div>
                            </Link>
                        </DropdownMenu>

                        {/* Категории */}
                        <DropdownMenu 
                            title="Категории"
                            isActive={isCategoriesActive}
                            onMenuClose={() => setMenuOpen(false)}
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                </svg>
                            }
                        >
                            <Link href="/admin/categories" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg mx-1">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 3h6l2 2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
                                    </svg>
                                    Проверка категорий
                                </div>
                            </Link>
                            <Link href="/categories" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg mx-1">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
                                    </svg>
                                    Все категории
                                </div>
                            </Link>
                            <Link href="/approved-categories" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg mx-1">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <path d="M22 4L12 14.01l-3-3"></path>
                                    </svg>
                                    Мои подтверждения
                                </div>
                            </Link>
                        </DropdownMenu>
                        
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
