"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, BookOpen, Home, ExternalLink } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Viewer", href: "/viewer", icon: BookOpen },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-4 py-2 rounded-2xl glass border border-white/10 shadow-2xl shadow-black/20">
        <div className="flex items-center gap-6 pr-6 mr-6 border-r border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              D
            </div>
            <span className="font-bold tracking-tight hidden md:block">DocuLearn</span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-white/10 text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive && "text-indigo-400")} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center ml-6 pl-6 border-l border-white/10">
          <Link 
            href="https://github.com" 
            target="_blank"
            className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
          >
            <ExternalLink className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
