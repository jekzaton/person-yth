"use client";

import { useEffect, useRef, useState } from "react";
import { Code2, ShieldCheck, LockKeyhole, AlertTriangle } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { APP_CONFIG, APP_CREDIT_SIGNATURE } from "@/utils/constant";

export default function AppFooter() {
  const footerRef = useRef<HTMLDivElement>(null);
  const [isTampered, setIsTampered] = useState(false);

  useEffect(() => {
    if (!APP_CONFIG.security.enabled) return;

    const container = footerRef.current;
    if (!container) return;

    const checkIntegrity = () => {
      const creditElement = container.querySelector("[data-app-credit]");

      const currentCredit = creditElement?.textContent?.trim();

      if (currentCredit !== APP_CREDIT_SIGNATURE) {
        setIsTampered(true);
      }
    };

    checkIntegrity();

    const observer = new MutationObserver(checkIntegrity);

    observer.observe(container, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={footerRef}>
        <footer className="w-full border-t border-gray-200 bg-white px-5 py-3 sm:px-6 lg:px-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col items-center justify-between gap-3 text-center lg:flex-row lg:gap-4 lg:text-left">
            {/* LEFT: ระบบและโรงพยาบาล */}
            <div className="flex min-w-0 items-center gap-2.5">
              <ShieldCheck
                size={19}
                className="shrink-0 text-blue-600 dark:text-blue-400"
              />

              <span className="truncate text-xs font-medium text-gray-600 dark:text-gray-300">
                {APP_CONFIG.name}
              </span>

              <span className="hidden text-gray-300 lg:inline dark:text-gray-600">
                |
              </span>

              <span className="hidden text-xs whitespace-nowrap text-gray-400 lg:inline">
                {APP_CONFIG.copyright}
              </span>
            </div>

            {/* CENTER: เครดิตผู้พัฒนา */}
            <div className="flex shrink-0 items-center gap-1.5">
              <Code2 size={15} className="text-blue-500 dark:text-blue-400" />

              <span className="text-xs text-gray-400">Developed by</span>

              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {APP_CONFIG.developer}
              </span>
            </div>

            {/* RIGHT: Version */}
            <div className="flex shrink-0 items-center gap-2">
              <LockKeyhole size={14} className="text-emerald-500" />

              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                v{APP_CONFIG.version}
              </span>
            </div>
          </div>

          {/* ข้อมูลสำหรับตรวจสอบเครดิต */}
          <span data-app-credit className="sr-only">
            {APP_CREDIT_SIGNATURE}
          </span>
        </footer>
      </div>

      <Modal
        isOpen={isTampered}
        onClose={() => setIsTampered(false)}
        className="max-w-[480px] p-6 lg:p-8"
      >
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <AlertTriangle size={32} className="text-red-600" />
          </div>

          <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
            {APP_CONFIG.security.warningTitle}
          </h3>

          <p className="text-sm leading-7 text-gray-500 dark:text-gray-400">
            {APP_CONFIG.security.warningMessage}
          </p>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="text-xs leading-6 text-amber-800 dark:text-amber-300">
              การเข้าถึงหรือแก้ไขระบบคอมพิวเตอร์
              โดยไม่ได้รับอนุญาตอาจมีความผิดตาม
              พระราชบัญญัติว่าด้วยการกระทำความผิด เกี่ยวกับคอมพิวเตอร์ พ.ศ. 2550
              และที่แก้ไขเพิ่มเติม ทั้งนี้ขึ้นอยู่กับ
              ข้อเท็จจริงและองค์ประกอบความผิด
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsTampered(false)}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            รับทราบ
          </button>
        </div>
      </Modal>
    </>
  );
}
