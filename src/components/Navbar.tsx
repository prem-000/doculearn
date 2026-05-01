"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Home, ArrowLeft } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Navbar() {
  const pathname = usePathname();

  // Determine if we should show a back button instead of home
  const isHome = pathname === "/";
  const showBack = !isHome;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4">
      {/* Left Action: Home or Back */}
      <div className="flex items-center">
        {showBack ? (
          <Link href="/" className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              D
            </div>
          </Link>
        )}
      </div>

      {/* Center: Title (Truncated) */}
      <div className="flex-1 flex justify-center px-4 overflow-hidden">
        <span className="font-semibold text-sm truncate max-w-full">
          {isHome ? "DocuLearn AI" : pathname === "/viewer" ? "Document Viewer" : pathname === "/settings" ? "Settings" : "DocuLearn"}
        </span>
      </div>

      {/* Right Action: Settings */}
      <div className="flex items-center">
        <Link 
          href="/settings" 
          className={cn(
            "p-2 -mr-2 transition-colors rounded-full",
            pathname === "/settings" ? "text-indigo-400 bg-white/5" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="w-6 h-6" />
        </Link>
      </div>
    </nav>
  );
}
