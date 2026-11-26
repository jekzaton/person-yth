"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  IdCard,
  Loader2,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { api, ApiError, BASE_PATH } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [cid, setCid] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProviderLoading, setIsProviderLoading] = useState(false);

  const handleCidChange = (value: string) => {
    // เอาเฉพาะตัวเลข และจำกัด 13 หลัก
    const numbers = value.replace(/\D/g, "").slice(0, 13);

    // format: x-xxxx-xxxxx-xx-x
    let formatted = numbers;

    if (numbers.length > 1) {
      formatted = `${numbers.slice(0, 1)}-${numbers.slice(1)}`;
    }

    if (numbers.length > 5) {
      formatted = `${numbers.slice(0, 1)}-${numbers.slice(1, 5)}-${numbers.slice(5)}`;
    }

    if (numbers.length > 10) {
      formatted = `${numbers.slice(0, 1)}-${numbers.slice(1, 5)}-${numbers.slice(5, 10)}-${numbers.slice(10)}`;
    }

    if (numbers.length > 12) {
      formatted = `${numbers.slice(0, 1)}-${numbers.slice(1, 5)}-${numbers.slice(5, 10)}-${numbers.slice(10, 12)}-${numbers.slice(12, 13)}`;
    }

    setCid(formatted);
  };
  const cidDigits = cid.replace(/\D/g, "");
  const cidLength = cidDigits.length;

  // ตรวจสอบเลขบัตรประชาชน
  const cleanCid = cid.replace(/\D/g, "");
  const isSubmitDisabled =
    isLoading ||
    isProviderLoading ||
    cleanCid.length !== 13 ||
    !password.trim();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    const cleanCid = cid.replace(/\D/g, "");

    if (!/^\d{13}$/.test(cleanCid)) {
      toast.warning("กรุณากรอกเลขบัตรประชาชน 13 หลัก", {
        icon: <AlertTriangle size={22} />,
      });
      return;
    }

    if (!password.trim()) {
      toast.warning("กรุณากรอกรหัสผ่าน", {
        icon: <LockKeyhole size={22} />,
      });
      return;
    }

    setIsLoading(true);

    const toastId = toast.loading("กำลังตรวจสอบข้อมูลเข้าสู่ระบบ...");

    let redirecting = false;

    try {
      const result = await api.post("/auth/signin", {
        ac_cid: cleanCid,
        ac_password: password,
      });

      if (result.success) {
        redirecting = true;

        toast.update(toastId, {
          render: "เข้าสู่ระบบสำเร็จ กำลังไปยังหน้าหลัก...",
          type: "success",
          isLoading: false,
          autoClose: 1200,
          icon: <CheckCircle2 size={22} />,
        });

        window.location.replace(`${BASE_PATH}/dashboard`);
        return;
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";

      console.error("[LOGIN ERROR]", {
        message,
        status: error instanceof ApiError ? error.status : undefined,
      });

      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 4000,
        closeButton: true,
        icon: <XCircle size={22} />,
      });
    } finally {
      if (!redirecting) {
        setIsLoading(false);
      }
    }
  };

  const handleProviderLogin = () => {
    try {
      setIsProviderLoading(true);

      // เปลี่ยน URL นี้ให้ตรงกับ API Provider ID ของระบบ
      window.location.href = "/api/auth/provider";
    } catch (error) {
      console.error("Provider ID login error:", error);
      setIsProviderLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-gray-950">
      {/* ======================================================
          LEFT SIDE
      ====================================================== */}
      <div className="relative hidden overflow-hidden bg-linear-to-br from-blue-700 via-blue-600 to-cyan-500 lg:flex lg:w-[52%]">
        {/* Background decoration */}
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-20 -bottom-25 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="absolute top-[22%] left-[12%] h-40 w-40 rounded-full border border-white/10" />
        <div className="absolute top-[30%] left-[18%] h-20 w-20 rounded-full border border-white/10" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          {/* Logo / Hospital */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-md">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>

            <div>
              <p className="text-lg font-semibold text-white">
                โรงพยาบาลยางตลาด
              </p>

              <p className="text-sm text-blue-100">จังหวัดกาฬสินธุ์</p>
            </div>
          </div>

          {/* Main content */}
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md">
              <ShieldCheck className="h-4 w-4" />
              Hospital Information System
            </div>

            <h1 className="text-4xl leading-tight font-bold text-white xl:text-5xl">
              ระบบสารสนเทศ
              <br />
              บุคลากรโรงพยาบาล
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-blue-100 xl:text-lg">
              ระบบสำหรับบุคลากรโรงพยาบาล
              เพื่อเข้าใช้งานบริการและระบบสารสนเทศภายในองค์กร
              อย่างสะดวกและปลอดภัย
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <ShieldCheck className="mb-3 h-6 w-6 text-cyan-200" />
                <p className="font-medium text-white">ปลอดภัย</p>
                <p className="mt-1 text-xs text-blue-100">
                  สำหรับบุคลากรที่ได้รับอนุญาต
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <Building2 className="mb-3 h-6 w-6 text-cyan-200" />
                <p className="font-medium text-white">ระบบภายในองค์กร</p>
                <p className="mt-1 text-xs text-blue-100">
                  เชื่อมต่อบริการของโรงพยาบาล
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-blue-100">
            © {new Date().getFullYear()} Ton Thanatnin
          </div>
        </div>
      </div>

      {/* ======================================================
          RIGHT SIDE - LOGIN
      ====================================================== */}
      <div className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-[48%]">
        <div className="w-full max-w-115">
          {/* Mobile hospital header */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>

            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                โรงพยาบาลยางตลาด
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                จังหวัดกาฬสินธุ์
              </p>
            </div>
          </div>

          {/* Login header */}
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <LockKeyhole className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              เข้าสู่ระบบ
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              กรุณาเข้าสู่ระบบด้วยข้อมูลบัญชีบุคลากรของโรงพยาบาล
            </p>
          </div>

          {/* Form */}
          {/* ================= LOGIN FORM ================= */}

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* CID */}
              <div>
                <Label>
                  เลขบัตรประชาชน
                  <span className="ml-1 text-error-500">*</span>
                </Label>

                <div className="relative mt-2">
                  <div className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2">
                    <CreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>

                  <Input
                    type="text"
                    inputMode="numeric"
                    value={cid}
                    onChange={(e) => handleCidChange(e.target.value)}
                    placeholder="x-xxxx-xxxxx-xx-x"
                    className="pl-12"
                  />
                </div>

                <div className="mt-2 flex h-4 justify-end">
                  {cidLength > 0 && (
                    <span
                      className={`text-xs ${
                        cidLength === 13
                          ? "font-medium text-emerald-500"
                          : "text-gray-400"
                      }`}
                    >
                      {cidLength}/13 หลัก
                    </span>
                  )}
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <Label>
                  รหัสผ่าน
                  <span className="ml-1 text-error-500">*</span>
                </Label>

                <div className="relative mt-2">
                  <div className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2">
                    <LockKeyhole className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>

                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    className="pr-12 pl-12"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute top-1/2 right-4 z-30 flex -translate-y-1/2 items-center justify-center text-gray-400 transition-colors hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
                  </button>
                </div>
              </div>

              {/* SECURITY */}
              <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/[0.07]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/10">
                  <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    การเข้าใช้งานระบบ
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    สำหรับบุคลากรโรงพยาบาลที่ได้รับอนุญาตเท่านั้น!
                  </p>
                </div>
              </div>

              {/* NORMAL LOGIN */}

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-blue-600 via-blue-600 to-cyan-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 dark:from-blue-600 dark:to-cyan-600 dark:shadow-blue-950/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : isProviderLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>กรุณารอสักครู่...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    <span>เข้าสู่ระบบ</span>
                  </>
                )}
              </button>

              {/* DIVIDER */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-800" />
                </div>

                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs text-gray-400 dark:bg-gray-950 lg:dark:bg-gray-950">
                    หรือเข้าสู่ระบบด้วย
                  </span>
                </div>
              </div>

              {/* PROVIDER ID */}
              <button
                type="button"
                onClick={handleProviderLogin}
                disabled={isLoading || isProviderLoading}
                className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
              >
                {isProviderLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                    <span>กำลังเชื่อมต่อ Provider ID...</span>
                  </>
                ) : (
                  <>
                    <Image
                      src={`${BASE_PATH}/images/logo/providerid.webp`}
                      alt="Provider ID"
                      width={100}
                      height={32}
                      className="h-7 w-auto object-contain"
                    />

                    <span>เข้าสู่ระบบด้วย Provider ID</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Help */}
          <div className="mt-8 border-t border-gray-100 pt-6 text-center dark:border-gray-800">
            <p className="text-xs leading-5 text-gray-400">
              หากไม่สามารถเข้าสู่ระบบได้
              <br />
              กรุณาติดต่อเจ้าหน้าที่งานเทคโนโลยีสารสนเทศ ต่อ 100
            </p>
          </div>

          {/* Mobile copyright */}
          <p className="mt-8 text-center text-xs text-gray-400 lg:hidden">
            © {new Date().getFullYear()} โรงพยาบาลยางตลาด
          </p>
        </div>
      </div>
    </div>
  );
}
