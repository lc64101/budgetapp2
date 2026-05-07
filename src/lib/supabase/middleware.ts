import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getClientSupabaseEnv } from "@/lib/supabase/env";

const PROTECTED_PATHS = ["/", "/budget", "/calculator", "/goals", "/settings", "/social"] as const;
const AUTH_PAGES = new Set(["/login"]);

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export function getAuthRedirectPath(pathname: string, isAuthenticated: boolean): string | null {
  if (isApiPath(pathname)) {
    return null;
  }

  if (!isAuthenticated && isProtectedPath(pathname)) {
    return "/login";
  }

  if (isAuthenticated && AUTH_PAGES.has(pathname)) {
    return "/";
  }

  return null;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const { url, anonKey } = getClientSupabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectPath = getAuthRedirectPath(request.nextUrl.pathname, Boolean(user));
  if (redirectPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = redirectPath;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}