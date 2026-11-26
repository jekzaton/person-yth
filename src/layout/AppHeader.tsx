"use client";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { Link } from "@/i18n/navigation";
import { BASE_PATH } from "@/lib/api";
import { cn } from "@/utils";
import {
  Ellipsis,
  EllipsisVertical,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const AppHeader: React.FC = () => {
  const t = useTranslations("header");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const { isExpanded, isMobileOpen, toggleSidebar, toggleMobileSidebar } =
    useSidebar();

  const handleToggle = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setApplicationMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex w-full",
        "relative border-gray-200 bg-white lg:border-b",
        "dark:border-gray-800 dark:bg-gray-900",
      )}
    >
      <div className="flex w-full min-w-0 flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-6">
        <div
          className={cn(
            "flex w-full min-w-0 items-center justify-between gap-3",
            "border-b border-gray-200 px-3 py-3",
            "lg:w-auto lg:flex-1 lg:justify-start",
            "lg:border-b-0 lg:px-0 lg:py-4",
            "dark:border-gray-800",
          )}
        >
          <button
            type="button"
            onClick={handleToggle}
            aria-label={t("toggleSidebar")}
            aria-expanded={isMobileOpen}
            className={cn(
              "relative z-10 flex h-10 w-10 shrink-0",
              "items-center justify-center rounded-xl",
              "border border-gray-200 bg-white",
              "text-gray-600 transition-colors",
              "hover:bg-gray-100 hover:text-blue-600",
              "focus-visible:ring-2 focus-visible:outline-none",
              "focus-visible:ring-blue-500",
              "lg:h-11 lg:w-11",
              "dark:border-gray-700 dark:bg-gray-800",
              "dark:text-gray-300 dark:hover:bg-gray-700",
            )}
          >
            {/* Mobile / Tablet */}
            <span className="lg:hidden">
              {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
            </span>

            {/* Desktop */}
            <span className="hidden lg:flex">
              {isExpanded ? (
                <PanelLeftClose size={22} />
              ) : (
                <PanelLeftOpen size={22} />
              )}
            </span>
          </button>

          <Link href="/" className="lg:hidden">
            <Image
              width={154}
              height={32}
              className="dark:hidden"
              src={`${BASE_PATH}/images/logo/logo.svg`}
              alt="Logo"
            />
            <Image
              width={154}
              height={32}
              className="hidden dark:block"
              src={`${BASE_PATH}/images/logo/logo-dark.svg`}
              alt="Logo"
            />
          </Link>

          <button
            type="button"
            onClick={toggleApplicationMenu}
            aria-label={
              isApplicationMenuOpen ? "ปิดเมนูผู้ใช้" : "เปิดเมนูผู้ใช้"
            }
            aria-expanded={isApplicationMenuOpen}
            aria-controls="header-user-menu"
            className={cn(
              "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center",
              "rounded-lg text-gray-700 transition-colors",
              "hover:bg-gray-100 lg:hidden",
              "dark:text-gray-400 dark:hover:bg-gray-800",
              isApplicationMenuOpen && "bg-gray-100 dark:bg-gray-800",
            )}
          >
            {isApplicationMenuOpen ? (
              <X size={22} />
            ) : (
              <EllipsisVertical size={24} strokeWidth={2.5} />
            )}
          </button>
        </div>
        <div
          id="header-user-menu"
          className={cn(
            // Mobile / Tablet: Dropdown ลอยลงใต้ Header
            "absolute inset-x-0 top-full z-40",
            "items-center justify-end gap-4",
            "border-t border-gray-100 bg-white px-5 py-4",
            "shadow-lg shadow-gray-900/10",
            "dark:border-gray-800 dark:bg-gray-900",

            // Desktop: อยู่ฝั่งขวาของ Header
            "lg:static lg:ml-auto lg:flex lg:w-auto lg:shrink-0",
            "lg:items-center lg:justify-end",
            "lg:border-0 lg:bg-transparent lg:px-0 lg:py-0",
            "lg:shadow-none",

            // เปิด/ปิดเฉพาะ Mobile
            isApplicationMenuOpen ? "flex" : "hidden",
          )}
        >
          <div className="flex items-center justify-end gap-3 sm:gap-4">
            <ThemeToggleButton />

            <NotificationDropdown />

            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
