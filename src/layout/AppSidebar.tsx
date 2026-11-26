"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";

import { ArrowRight, CarFront, LogOut, UsersIcon, X } from "lucide-react";
import { api, BASE_PATH } from "@/lib/api";
import { toast } from "react-toastify";

type NavItem = {
  key: string;
  icon: React.ReactNode;
  path?: string;
  new?: boolean;
  target?: string;
  subItems?: {
    key: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    target?: string;
  }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    key: "dashboard",
    subItems: [{ key: "dashboard", path: "/dashboard" }],
  },

  {
    icon: <UserCircleIcon />,
    key: "userProfile",
    path: "/profile",
  },
  {
    key: "forms",
    icon: <ListIcon />,
    subItems: [{ key: "formElements", path: "/form-elements", pro: false }],
  },
  {
    key: "tables",
    icon: <TableIcon />,
    subItems: [{ key: "basicTables", path: "/basic-tables", pro: false }],
  },
  {
    key: "pages",
    icon: <PageIcon />,
    subItems: [
      { key: "blankPage", path: "/blank" },
      { key: "error404", path: "/error-404" },
    ],
  },
];

const othersItems: NavItem[] = [
  {
    icon: <UsersIcon />,
    key: "person",
    subItems: [
      { key: "personnel", path: "/personnel", pro: false },
      { key: "position", path: "/position", pro: false },
      { key: "department", path: "/department", pro: false },
      { key: "positionType", path: "/positionType", pro: false },
    ],
  },
  {
    icon: <CarFront />,
    key: "carmanage",
    subItems: [
      { key: "cars", path: "/cars", pro: false },
      { key: "carType", path: "/cars/car-type", pro: false },
      { key: "carbrand", path: "/cars/car-brand", pro: false },
    ],
  },
  {
    icon: <PieChartIcon />,
    key: "charts",
    subItems: [
      { key: "lineChart", path: "/line-chart", pro: false },
      { key: "barChart", path: "/bar-chart", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    key: "uiElements",
    subItems: [
      { key: "alerts", path: "/alerts" },
      { key: "avatar", path: "/avatars" },
      { key: "badge", path: "/badge" },
      { key: "buttons", path: "/buttons" },
      { key: "images", path: "/images" },
      { key: "videos", path: "/videos" },
    ],
  },
  {
    icon: <PlugInIcon />,
    key: "authentication",
    subItems: [
      { key: "signIn", path: "/signin", pro: false },
      { key: "signUp", path: "/signup", pro: false },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const router = useRouter();

  const {
    isExpanded,
    isMobileOpen,
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
  } = useSidebar();

  const pathname = usePathname();
  const t = useTranslations("sidebar");

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const previousPathname = useRef(pathname);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isCompact = !isExpanded;

  const isActive = useCallback(
    (path: string): boolean => {
      if (pathname === path) return true;

      if (path === "/" || path === "/cars") {
        return false;
      }

      return pathname.startsWith(`${path}/`);
    },
    [pathname],
  );

  // เปิด Submenu ให้ตรงกับหน้าปัจจุบัน
  useEffect(() => {
    const groups = [
      { type: "main", items: navItems },
      { type: "others", items: othersItems },
    ];

    for (const group of groups) {
      for (const item of group.items) {
        const matched = item.subItems?.some((sub) => isActive(sub.path));

        if (matched) {
          setOpenSubmenu(`${group.type}-${item.key}`);
          return;
        }
      }
    }
  }, [isActive]);
  const closeMobile = () => {
    closeMobileSidebar();
  };

  // ปิด Drawer เมื่อมีการเปลี่ยนหน้า
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      closeMobileSidebar();
    }
  }, [pathname, closeMobileSidebar]);

  // ล็อก scroll เมื่อเปิด Drawer
  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileSidebar();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileOpen, closeMobileSidebar]);
  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-1.5">
      {items.map((nav) => {
        const menuKey = `${menuType}-${nav.key}`;
        const hasSubmenu = Boolean(nav.subItems?.length);
        const isOpen = openSubmenu === menuKey;

        const isSelected =
          (nav.path ? isActive(nav.path) : false) ||
          Boolean(nav.subItems?.some((sub) => isActive(sub.path)));

        const menuClass = cn(
          "group flex min-h-11 w-full min-w-0 items-center",
          "gap-3 rounded-xl px-3 py-2.5",
          "text-sm font-medium",
          "transition-colors duration-200",
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-blue-500",

          isSelected
            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",

          isCompact
            ? "lg:justify-center lg:gap-0 lg:px-2"
            : "lg:justify-start lg:gap-3",
        );

        return (
          <li key={menuKey} className="min-w-0">
            {hasSubmenu ? (
              <button
                type="button"
                aria-expanded={isOpen}
                title={isCompact ? t(`items.${nav.key}`) : undefined}
                onClick={() => {
                  if (!isExpanded && window.innerWidth >= 1024) {
                    toggleSidebar();
                  }

                  setOpenSubmenu((prev) => (prev === menuKey ? null : menuKey));
                }}
                className={menuClass}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center",
                    "[&_svg]:block",
                    "[&_svg]:h-6",
                    "[&_svg]:w-6",
                    "[&_svg]:shrink-0",
                  )}
                >
                  {nav.icon}
                </span>

                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-left",
                    isCompact && "lg:hidden",
                  )}
                >
                  {t(`items.${nav.key}`)}
                </span>

                <span
                  className={cn(
                    "ml-auto shrink-0 transition-transform duration-200",
                    isOpen && "rotate-180",
                    isCompact && "lg:hidden",
                  )}
                >
                  <ChevronDownIcon />
                </span>
              </button>
            ) : nav.path ? (
              <Link
                href={nav.path}
                target={nav.target}
                onClick={closeMobile}
                aria-current={isSelected ? "page" : undefined}
                title={isCompact ? t(`items.${nav.key}`) : undefined}
                className={menuClass}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center",
                    "[&_svg]:block",
                    "[&_svg]:h-6",
                    "[&_svg]:w-6",
                    "[&_svg]:shrink-0",
                  )}
                >
                  {nav.icon}
                </span>

                <span
                  className={cn("min-w-0 truncate", isCompact && "lg:hidden")}
                >
                  {t(`items.${nav.key}`)}
                </span>
              </Link>
            ) : null}

            {hasSubmenu && (
              <div
                className={cn(
                  "grid transition-[grid-template-rows,opacity]",
                  "duration-300 ease-in-out",
                  isCompact && "lg:hidden",
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <ul className="ms-5 mt-1 space-y-1 border-s border-gray-200 ps-4 dark:border-gray-700">
                    {nav.subItems?.map((sub) => (
                      <li key={sub.key}>
                        <Link
                          href={sub.path}
                          target={sub.target}
                          onClick={closeMobile}
                          aria-current={isActive(sub.path) ? "page" : undefined}
                          className={cn(
                            "flex min-h-10 items-center gap-2",
                            "rounded-lg px-3 py-2 text-sm",
                            "transition-colors",
                            isActive(sub.path)
                              ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {t(`items.${sub.key}`)}
                          </span>

                          {sub.new && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                              {t("badges.new")}
                            </span>
                          )}

                          {sub.pro && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700">
                              {t("badges.pro")}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  const renderGroup = (
    title: string,
    items: NavItem[],
    type: "main" | "others",
  ) => (
    <section className="mb-7">
      <div
        className={cn(
          "mb-3 flex min-h-6 items-center px-3",
          isCompact ? "lg:justify-center" : "justify-between",
        )}
      >
        <h2
          className={cn(
            "text-[11px] font-semibold tracking-widest uppercase",
            "text-gray-400 dark:text-gray-500",
            isCompact && "lg:hidden",
          )}
        >
          {title}
        </h2>

        {isCompact && (
          <span className="hidden text-gray-400 lg:block">
            <HorizontaLDots />
          </span>
        )}
      </div>

      {renderMenuItems(items, type)}
    </section>
  );

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      await api.post("/auth/signout");

      toast.success("ออกจากระบบสำเร็จ", {
        autoClose: 1200,
      });

      // Full reload เพื่อให้ Server ตรวจ Cookie ใหม่
      window.location.replace(`${BASE_PATH}/signin`);
    } catch (error) {
      console.error("Logout error:", error);

      toast.error("ไม่สามารถออกจากระบบได้ กรุณาลองใหม่");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Overlay: Mobile / Tablet */}
      {isMobileOpen && (
        <button
          type="button"
          aria-label="ปิดเมนูด้านข้าง"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-gray-950/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        aria-label="เมนูหลัก"
        className={cn(
          "fixed inset-y-0 left-0 z-50",
          "flex h-dvh flex-col",
          "border-r border-gray-200 bg-white",
          "transition-[width,transform] duration-300 ease-in-out",
          "dark:border-gray-800 dark:bg-gray-900",

          // Mobile
          "w-[min(290px,calc(100vw-24px))]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",

          // Desktop
          "lg:translate-x-0",
          isExpanded ? "lg:w-72.5" : "lg:w-22.5",
        )}
      >
        {/* Header */}
        <div className="flex h-20 shrink-0 items-center border-b border-gray-100 px-3 dark:border-gray-800">
          <Link
            href="/"
            onClick={closeMobile}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-3",
              isCompact && "lg:justify-center",
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center",
                "rounded-2xl bg-blue-50 ring-1 ring-blue-100",
                "dark:bg-blue-500/10 dark:ring-blue-500/20",
              )}
            >
              <Image
                src={`${BASE_PATH}/images/logo/logo-icon.svg`}
                alt="Hospital logo"
                width={38}
                height={38}
                className="h-9 w-9 shrink-0 object-contain"
                priority
              />
            </div>

            <div className={cn("min-w-0 flex-1", isCompact && "lg:hidden")}>
              <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                ระบบบุคลากรโรงพยาบาล
              </p>
              <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                Personnel Management
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeMobile}
            aria-label="ปิดเมนู"
            className="ms-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="min-h-0 flex-1 scrollbar-thin overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-6">
          <nav>
            {renderGroup(t("groups.menu"), navItems, "main")}

            {othersItems.length > 0 &&
              renderGroup(t("groups.others"), othersItems, "others")}
          </nav>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-3 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="ออกจากระบบ"
            className={cn(
              "group flex min-h-12 w-full items-center gap-3",
              "rounded-xl border border-red-100",
              "bg-red-50 px-3 py-3",
              "text-sm font-semibold text-red-600",
              "transition-all duration-200",
              "hover:border-red-200 hover:bg-red-100",
              "hover:shadow-sm active:scale-[0.98]",
              "focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "dark:border-red-500/20 dark:bg-red-500/10",
              "dark:text-red-400 dark:hover:bg-red-500/20",
              isCompact && "lg:justify-center",
            )}
          >
            <LogOut
              size={20}
              className={cn(
                "shrink-0 transition-transform duration-200",
                !isLoggingOut && "group-hover:-translate-x-0.5",
                isLoggingOut && "animate-pulse",
              )}
            />

            {!isCompact && (
              <>
                <span className="flex-1 text-left">
                  {isLoggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
                </span>

                {!isLoggingOut && (
                  <ArrowRight
                    size={17}
                    className="opacity-60 transition-transform group-hover:translate-x-1"
                  />
                )}
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
