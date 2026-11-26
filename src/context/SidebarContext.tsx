"use client";

import { usePathname } from "@/i18n/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type SidebarContextType = {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  activeItem: string | null;
  openSubmenu: string | null;

  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;

  setIsHovered: (isHovered: boolean) => void;
  setActiveItem: (item: string | null) => void;
  toggleSubmenu: (item: string) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
};

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  // Desktop Sidebar
  const [isExpanded, setIsExpanded] = useState(true);

  // Mobile / Tablet Drawer
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // เก็บไว้เพื่อรองรับ Component เดิม
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const pathname = usePathname();

  // Desktop: ย่อ / ขยาย
  const toggleSidebar = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Mobile: เปิด / ปิด
  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  // Mobile: ปิดเท่านั้น
  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // Submenu
  const toggleSubmenu = useCallback((item: string) => {
    setOpenSubmenu((prev) => (prev === item ? null : item));
  }, []);

  // ปิด Drawer เมื่อเปลี่ยนหน้า
  useEffect(() => {
    closeMobileSidebar();
  }, [pathname, closeMobileSidebar]);

  // เมื่อขยายหน้าจอถึง Desktop ให้ปิด Drawer
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        closeMobileSidebar();
      }
    };

    if (mediaQuery.matches) {
      closeMobileSidebar();
    }

    mediaQuery.addEventListener("change", handleBreakpointChange);

    return () => {
      mediaQuery.removeEventListener("change", handleBreakpointChange);
    };
  }, [closeMobileSidebar]);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isMobileOpen,
        isHovered,
        activeItem,
        openSubmenu,

        toggleSidebar,
        toggleMobileSidebar,
        closeMobileSidebar,

        setIsHovered,
        setActiveItem,
        toggleSubmenu,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
