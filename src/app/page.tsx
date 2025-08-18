import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Uroven Admin</h1>
      <p className="text-gray-600">Простая админка для просмотра одной таблицы.</p>
      <div className="flex gap-3">
        <Link href="/login" className="underline">
          Войти
        </Link>
        <Link href="/admin" className="underline">
          В админку
        </Link>
      </div>
    </main>
  );
}
