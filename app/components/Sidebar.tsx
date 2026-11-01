"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Crown,
  Store,
  FileSpreadsheet,
  CheckSquare,
  Users,
  Compass,
  FileSignature,
  CreditCard,
  BarChart3,
  Settings,
  X,
  Sparkles,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { getSessionAction, logoutAction, UserSession } from "@/actions/auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const navigationItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard, isImplemented: true },
  { name: "Enquiries", href: "/enquiries", icon: Inbox, isImplemented: true },
  { name: "Weddings", href: "/weddings", icon: Crown, isImplemented: true },
  { name: "Vendors", href: "/vendors", icon: Store, isImplemented: true },
  { name: "Vendor Quotes", href: "/vendor-quotes", icon: FileSpreadsheet, isImplemented: true },
  { name: "Wedding Tasks", href: "/wedding-tasks", icon: CheckSquare, isImplemented: true },
  { name: "Guest Management", href: "/guests", icon: Users, isImplemented: true },
  { name: "Day-of Command Center", href: "/command-center", icon: Compass, isImplemented: true },
  { name: "Contracts", href: "/contracts", icon: FileSignature, isImplemented: true },
  { name: "Payments & Expenses", href: "/payments", icon: CreditCard, isImplemented: true },
  { name: "Analytics & Reports", href: "/analytics", icon: BarChart3, isImplemented: true },
  { name: "Settings", href: "/settings", icon: Settings, isImplemented: true },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    getSessionAction().then(setSession);
  }, [pathname]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-dark/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-navy text-ivory flex flex-col border-r border-[#C6A46A]/20 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[#C6A46A]/20 bg-navy-dark/60">
          <Link href="/" className="flex items-center space-x-3 group" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C6A46A] to-[#8C7142] flex items-center justify-center text-navy shadow-gold group-hover:scale-105 transition-transform">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="block font-serif text-lg font-bold tracking-widest text-[#DFC698]">
                THE ROYAL KNOT
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-ivory/60 font-sans">
                Jaipur • Udaipur
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-ivory/60 hover:text-white p-1 rounded-md"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Routes */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-all ${
                  isActive
                    ? "bg-[#C6A46A] text-navy font-semibold shadow-gold"
                    : "text-ivory/80 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? "text-navy" : "text-[#C6A46A] group-hover:text-gold-light"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {!item.isImplemented && (
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-sans tracking-wider ${
                      isActive
                        ? "bg-navy/20 text-navy font-semibold"
                        : "bg-white/10 text-ivory/50"
                    }`}
                  >
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Agency Footer Status & Active Session */}
        <div className="p-4 border-t border-[#C6A46A]/20 bg-navy-dark/40 space-y-2">
          {session ? (
            <div className="p-3 rounded-xl bg-navy/80 border border-gold/30 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C6A46A] to-[#8C7142] flex items-center justify-center text-navy font-bold text-xs shadow-sm flex-shrink-0">
                  {session.avatarLetter}
                </div>
                <div className="text-xs min-w-0">
                  <p className="font-semibold text-white truncate">{session.name}</p>
                  <p className="text-[10px] text-gold-light/80 truncate">{session.role}</p>
                </div>
              </div>
              <button
                onClick={() => logoutAction()}
                title="Sign Out"
                className="p-1.5 rounded-lg text-ivory/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="w-full py-2 px-3 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold-light text-xs font-semibold flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                <span>Staff & Manager Login</span>
              </div>
              <span className="text-[10px] text-gold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </Link>
          )}

          <Link
            href="/login"
            onClick={onClose}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-ivory/70 hover:text-white text-xs font-medium flex items-center justify-between transition-colors group"
          >
            <span>Client & Guest Desk</span>
            <span className="text-[10px] text-ivory/40 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
