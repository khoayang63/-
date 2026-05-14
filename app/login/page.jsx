"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/auth/actions";
import { toast } from "react-hot-toast";
import { useEffect, useRef } from "react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  const prevError = useRef(null);
  useEffect(() => {
    if (state?.error && state.error !== prevError.current) {
      toast.error(state.error);
      prevError.current = state.error;
    }
  }, [state]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              Đăng Nhập
            </h2>
            <p className="text-sm text-slate-400">
              Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.
            </p>
          </div>

          <form className="flex flex-col gap-5" action={formAction}>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Nhập địa chỉ email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-950/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all sm:text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300" htmlFor="password">
                  Mật khẩu
                </label>
                <a href="#" className="text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors">
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Nhập mật khẩu"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-950/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all sm:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-2 w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-slate-900 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Đang đăng nhập...
                </span>
              ) : "Đăng Nhập"}
            </button>
          </form>

          {state?.error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400 text-center">{state.error}</p>
            </div>
          )}

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-slate-500">Hoặc</span>
            </div>
          </div>

          <p className="text-sm text-center text-slate-400 mt-6">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-medium text-amber-500 hover:text-amber-400 hover:underline transition-colors">
              Đăng ký ngay
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}