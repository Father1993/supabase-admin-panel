import Link from "next/link";
import Image from "next/image";
import Logo from "@/images/logo.png";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex items-center gap-4">
          <div className="relative h-12 w-[210px] sm:h-14 sm:w-[250px]">
            <Image src={Logo} alt="Уровень — территория ремонта" fill className="object-contain" priority />
          </div>
          <span className="ml-auto text-sm text-slate-600 hidden sm:block">Внутренний сервис компании</span>
        </header>

        <section className="mt-8 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Uroven Admin</h1>
            <p className="text-slate-700">Админка для работы с таблицей продуктов в Supabase: редактирование описаний, подтверждение контента и подготовка к отправке в PIM.</p>
            <ul className="text-slate-700 space-y-2">
              <li className="flex items-start gap-2"><span className="text-emerald-600 mt-1">✓</span><span>Просмотр и фильтрация товаров с готовыми описаниями</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-600 mt-1">✓</span><span>Редактирование HTML-разметки краткого и полного описания</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-600 mt-1">✓</span><span>Подтверждение описания с фиксацией email</span></li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                Войти
              </Link>
              <Link href="/admin" className="px-5 py-3 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition">
                В админку
              </Link>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl border border-slate-200 shadow-lg p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Для кого</h2>
              <p className="text-slate-700">Для сотрудников контент-отдела и менеджеров, которые проверяют и утверждают описания товаров перед публикацией в PIM.</p>
              <h2 className="text-lg font-semibold text-slate-900 pt-2">Как это работает</h2>
              <ol className="list-decimal list-inside text-slate-700 space-y-1">
                <li>Авторизуйтесь через Supabase.</li>
                <li>Откройте карточку товара, отредактируйте HTML-описание.</li>
                <li>Подтвердите описание — система зафиксирует ваш email.</li>
              </ol>
              <div className="text-xs text-slate-500">Данные хранятся в Supabase. Изменения автоматически логируются по времени обновления.</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
