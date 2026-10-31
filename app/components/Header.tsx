"use client";

import React, { useState } from "react";
import {
  Menu,
  Search,
  Bell,
  Plus,
  Calendar,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { QuickCreateModal } from "./QuickCreateModal";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Format current date nicely
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <header className="sticky top-0 z-30 h-20 bg-white/90 backdrop-blur-md border-b border-[#C6A46A]/20 px-4 sm:px-8 flex items-center justify-between">
        {/* Left: Mobile Toggle & Search */}
        <div className="flex items-center space-x-3 sm:space-x-6 flex-1 max-w-md">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-lg text-navy hover:bg-ivory border border-gray-200 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search weddings, palaces, couples, vendors..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#F7F5F0]/60 rounded-xl border border-transparent hover:border-gold/30 focus:border-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold transition-all"
            />
          </div>
        </div>

        {/* Right: Date, Notifications, Quick-Create, Avatar */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Date Indicator (hidden on small screens) */}
          <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-navy/70 bg-ivory/80 px-3 py-1.5 rounded-lg border border-[#C6A46A]/20">
            <Calendar className="w-3.5 h-3.5 text-gold" />
            <span>{currentDate}</span>
          </div>

          {/* Quick Create Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-gold flex items-center space-x-1.5 text-xs sm:text-sm py-2 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Enquiry</span>
            <span className="sm:hidden">Enquiry</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              className="p-2 rounded-xl text-navy/80 hover:text-navy hover:bg-ivory border border-gray-100 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold animate-pulse" />
            </button>
          </div>

          {/* User Profile Avatar */}
          <div className="flex items-center space-x-2.5 pl-2 sm:pl-3 border-l border-gray-200">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-navy text-gold font-serif font-bold text-sm flex items-center justify-center border border-gold/40 shadow-sm">
                GD
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-navy leading-none">Gayatri Devi</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">
                Senior Royal Partner
              </p>
            </div>
            <ChevronDown className="hidden lg:block w-3 h-3 text-gray-400" />
          </div>
        </div>
      </header>

      {/* Quick Create Enquiry Modal */}
      <QuickCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
