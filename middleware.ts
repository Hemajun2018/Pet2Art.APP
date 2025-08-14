import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Redirect any non-English locale paths to root
  if (pathname.startsWith('/zh') || 
      pathname.startsWith('/zh-CN') || 
      pathname.startsWith('/zh-TW') || 
      pathname.startsWith('/zh-HK') || 
      pathname.startsWith('/zh-MO') ||
      pathname.startsWith('/ja') ||
      pathname.startsWith('/ko') ||
      pathname.startsWith('/ru') ||
      pathname.startsWith('/fr') ||
      pathname.startsWith('/de') ||
      pathname.startsWith('/ar') ||
      pathname.startsWith('/es') ||
      pathname.startsWith('/it')) {
    
    // Extract the path after the locale
    const pathSegments = pathname.split('/');
    pathSegments.splice(1, 1); // Remove the locale segment
    const newPath = pathSegments.join('/') || '/';
    
    return NextResponse.redirect(new URL(newPath, request.url));
  }
  
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/",
    "/(en|en-US|zh|zh-CN|zh-TW|zh-HK|zh-MO|ja|ko|ru|fr|de|ar|es|it)/:path*",
    "/((?!privacy-policy|terms-of-service|api/|_next|_vercel|.*\\..*).*)",
  ],
};
