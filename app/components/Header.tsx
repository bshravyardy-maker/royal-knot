"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  Plus,
  Calendar,
  Sparkles,
  ChevronDown,
  X,
  Loader2,
  Crown,
  Inbox,
  Store,
  LogIn,
} from "lucide-react";
import { QuickCreateModal } from "./QuickCreateModal";
import { liveSearchAction, SearchResultItem } from "@/actions/search";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Format current date nicely
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setIsDropdownOpen(true);

    const timer = setTimeout(async () => {
      try {
        const results = await liveSearchAction(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleResultClick(href: string) {
    setIsDropdownOpen(false);
    setSearchQuery("");
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setIsDropdownOpen(false);
    } else if (e.key === "Enter" && searchResults.length > 0) {
      handleResultClick(searchResults[0].href);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-20 bg-white/95 backdrop-blur-md border-b border-[#C6A46A]/20 px-4 sm:px-8 flex items-center justify-between">
        {/* Left: Mobile Toggle & Live Search */}
        <div
          ref={searchContainerRef}
          className="relative flex items-center space-x-3 sm:space-x-6 flex-1 max-w-md"
        >
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
              onFocus={() => {
                if (searchResults.length > 0) setIsDropdownOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search weddings, palaces, couples, vendors..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-[#F7F5F0]/80 rounded-xl border border-transparent hover:border-gold/30 focus:border-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold transition-all"
            />
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-gold animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            ) : searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsDropdownOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}

            {/* Live Search Results Dropdown */}
            {isDropdownOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-elevated border border-[#C6A46A]/30 overflow-hidden z-50 animate-fadeIn">
                <div className="p-2 border-b border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3">
                  <span>Search Results</span>
                  {isSearching ? (
                    <span className="text-gold">Searching...</span>
                  ) : (
                    <span>{searchResults.length} found</span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 p-1">
                  {searchResults.length === 0 && !isSearching ? (
                    <div className="py-6 text-center text-xs text-gray-500">
                      No palaces, weddings, or vendors matched &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    searchResults.map((item) => {
                      const Icon =
                        item.category === "wedding"
                          ? Crown
                          : item.category === "enquiry"
                          ? Inbox
                          : Store;
                      const iconBg =
                        item.category === "wedding"
                          ? "bg-amber-100 text-amber-800"
                          : item.category === "enquiry"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-emerald-100 text-emerald-800";

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleResultClick(item.href)}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-ivory/80 flex items-center space-x-3 transition-colors group"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-navy group-hover:text-gold-dark truncate">
                                {item.title}
                              </span>
                              {item.tag && (
                                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                                  {item.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 truncate">
                              {item.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Date, Portal / Login, Quick-Create, Avatar */}
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

          {/* Login / Client Query Portal Link */}
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-gold/40 text-gold-dark hover:bg-gold/15 text-xs font-semibold transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Client & Guest Portal</span>
          </Link>

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
