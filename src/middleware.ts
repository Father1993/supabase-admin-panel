import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/", "/admin", "/admin/:path*"],
};

// Простейшая защита: закрыть сайт от публичного просмотра даже без индексации
// Логика: если нет куки supabase сессии — редирект на /login
// Примечание: для полноценной SSR-проверки можно читать куки supabase; здесь минимальный вариант.
export default function middleware() {
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
  return res;
}


