"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Check, ChevronDown, Search, X } from "lucide-react";

export type SelectOption = {
  id: number;
  name: string;
};

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];

  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
  error?: string;
  name?: string;
  className?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "ค้นหาหรือเลือกรายการ",
  emptyMessage = "ไม่พบข้อมูล",
  disabled = false,
  required = false,
  loading = false,
  error,
  name,
  className = "",
}: SearchableSelectProps) {
  const uid = useId();
  const listId = `${uid}-list`;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlighted, setHighlighted] = useState(0);

  const selected = useMemo(
    () => options.find((item) => String(item.id) === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();

    if (!keyword) return options;

    return options.filter(
      (item) =>
        item.name.toLocaleLowerCase().includes(keyword) ||
        String(item.id).includes(keyword),
    );
  }, [options, search]);

  // ปิดเมื่อคลิกภายนอก
  useEffect(() => {
    function handleOutside(event: PointerEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("pointerdown", handleOutside);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, []);

  const choose = (item: SelectOption) => {
    onChange(String(item.id));
    setSearch("");
    setIsOpen(false);
    setHighlighted(0);
  };

  const clear = () => {
    onChange("");
    setSearch("");
    setHighlighted(0);
    inputRef.current?.focus();
  };

  const open = () => {
    if (disabled) return;

    setIsOpen(true);
    setSearch("");
    setHighlighted(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!isOpen) {
        open();
      } else {
        setHighlighted((prev) => Math.min(prev + 1, filtered.length - 1));
      }
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setHighlighted((prev) => Math.max(prev - 1, 0));
    }

    if (event.key === "Enter" && isOpen) {
      event.preventDefault();

      if (filtered[highlighted]) {
        choose(filtered[highlighted]);
      }
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setSearch("");
    }
  };

  return (
    <div ref={wrapperRef} className={`relative w-full min-w-0 ${className}`}>
      <div
        className={`relative flex h-11 items-center rounded-xl border bg-white transition-all duration-200 focus-within:ring-4 dark:bg-slate-950/60 ${
          error
            ? "border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/10"
            : "border-slate-200 focus-within:border-indigo-500 focus-within:ring-indigo-500/10 hover:border-indigo-300 dark:border-slate-700"
        } ${disabled ? "opacity-60" : ""} `}
      >
        <Search
          size={17}
          className="ml-3 shrink-0 text-indigo-500 dark:text-indigo-300"
        />

        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          disabled={disabled}
          role="combobox"
          aria-label={placeholder}
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen && filtered[highlighted]
              ? `${uid}-option-${filtered[highlighted].id}`
              : undefined
          }
          aria-invalid={Boolean(error)}
          placeholder={placeholder}
          value={
            isOpen ? search : selected?.name || (value ? `รหัส ${value}` : "")
          }
          onFocus={open}
          onClick={() => {
            if (!isOpen) open();
          }}
          onChange={(event) => {
            setSearch(event.target.value);
            setHighlighted(0);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={clear}
            aria-label="ล้างรายการที่เลือก"
            className="flex h-9 w-8 shrink-0 items-center justify-center text-slate-400 hover:text-rose-500"
          >
            <X size={15} />
          </button>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={() => (isOpen ? setIsOpen(false) : open())}
          aria-label="เปิดรายการตัวเลือก"
          className="flex h-10 w-10 shrink-0 items-center justify-center text-slate-400 hover:text-indigo-600"
        >
          <ChevronDown
            size={18}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* รองรับการส่งข้อมูลผ่าน HTML Form */}
      {name && (
        <input type="hidden" name={name} value={value} required={required} />
      )}

      {/* DROPDOWN */}
      {isOpen && !disabled && (
        <div
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-50 mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/15 dark:border-slate-700 dark:bg-slate-900"
        >
          {loading ? (
            <div className="px-3 py-5 text-center text-sm text-slate-400">
              กำลังโหลดข้อมูล...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-5 text-center text-sm text-slate-400">
              {emptyMessage}
            </div>
          ) : (
            filtered.map((item, index) => {
              const active = String(item.id) === value;

              return (
                <button
                  key={item.id}
                  id={`${uid}-option-${item.id}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => choose(item)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 font-bold text-indigo-700 dark:from-blue-500/15 dark:to-indigo-500/15 dark:text-indigo-300"
                      : index === highlighted
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  } `}
                >
                  <span className="min-w-0 flex-1 break-words">
                    {item.name}
                  </span>

                  {active && (
                    <Check size={16} className="shrink-0 text-indigo-600" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
