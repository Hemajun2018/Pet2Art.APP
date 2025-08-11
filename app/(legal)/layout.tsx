import "@/app/globals.css";

import { MdOutlineHome } from "react-icons/md";
import { HiOutlineShieldCheck } from "react-icons/hi";
import { Metadata } from "next";
import React from "react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: {
      template: `%s | ${t("metadata.title")}`,
      default: t("metadata.title"),
    },
    description: t("metadata.description"),
    keywords: t("metadata.keywords"),
  };
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen bg-gradient-to-br from-base-100 via-base-100 to-primary/5">
        <div className="min-h-screen">
          {/* Header Navigation */}
          <div className="border-b border-base-200/50 backdrop-blur-sm bg-base-100/80 sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
              <a
                className="flex items-center gap-3 text-base-content hover:text-primary transition-colors group"
                href="/"
              >
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <MdOutlineHome className="text-xl text-primary" />
                </div>
                <span className="font-semibold">Pet2Art</span>
              </a>
              
              <div className="flex items-center gap-2 text-sm text-base-content/60">
                <HiOutlineShieldCheck className="text-lg text-success" />
                <span>Secure & Compliant</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="bg-base-100 rounded-2xl shadow-xl border border-base-200/50 overflow-hidden">
              {/* Decorative Header Banner */}
              <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
              
              {/* Content Area */}
              <div className="px-8 py-10 md:px-12 md:py-14">
                <div className="prose prose-lg max-w-none
                  prose-headings:font-bold prose-headings:text-base-content
                  prose-h1:text-5xl prose-h1:mb-8 prose-h1:pb-6 prose-h1:text-center prose-h1:font-extrabold
                  prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:font-bold prose-h2:text-base-content
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:font-semibold prose-h3:text-base-content/90
                  prose-p:text-base prose-p:text-base-content/70 prose-p:leading-relaxed prose-p:my-4
                  prose-li:text-base prose-li:text-base-content/70 prose-li:my-2
                  prose-strong:text-base-content prose-strong:font-semibold
                  prose-a:text-primary prose-a:no-underline prose-a:font-medium
                  hover:prose-a:text-primary/80 hover:prose-a:underline
                  prose-code:text-secondary prose-code:bg-secondary/10 
                  prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                  prose-blockquote:border-l-4 prose-blockquote:border-primary/30
                  prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-base-content/70
                  prose-hr:border-base-200 prose-hr:my-12">
                  {children}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="mt-12 text-center text-sm text-base-content/60">
              <p>© 2025 Pet2Art. All rights reserved.</p>
              <div className="mt-4 flex items-center justify-center gap-6">
                <a href="/privacy-policy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
                <span>•</span>
                <a href="/terms-of-service" className="hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
