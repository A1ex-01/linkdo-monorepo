"use client";

import { AIconLinkdo } from "@/components/icons/base";
import { WindowTitleBar } from "@/components/window-title-bar";
import { authService } from "@/services/auth";
import { setToken } from "@/services/auth-session";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconBrandNotion,
  IconChartPie,
  IconClock,
  IconList,
  IconLock,
  IconMail,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useRequest } from "ahooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

type LoginStep = "email" | "code";

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱地址")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "请输入有效的邮箱地址"),
});

const codeSchema = z.object({
  code: z
    .string()
    .length(6, "验证码为6位数字")
    .regex(/^\d+$/, "验证码为6位数字"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type CodeFormData = z.infer<typeof codeSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: "onBlur",
  });

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    mode: "onBlur",
  });

  const { run: sendCode, loading: sendingCode } = useRequest(
    async (emailToSend: string) => {
      const res = await authService.sendCode({ email: emailToSend });
      if (res.success) {
        toast.success("验证码已发送");
        setStep("code");
        setCountdown(60);
      }
      return res;
    },
    { manual: true },
  );

  const { run: verifyCode, loading: verifyingCode } = useRequest(
    async (emailToVerify: string, codeToVerify: string) => {
      const res = await authService.verifyCode({
        email: emailToVerify,
        code: codeToVerify,
      });
      if (res.success && res.data?.token) {
        setToken(res.data.token);
        toast.success("登录成功");
        router.push("/home");
      }
      return res;
    },
    { manual: true },
  );

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onEmailSubmit = (data: EmailFormData) => {
    setEmail(data.email);
    sendCode(data.email);
  };

  const onCodeSubmit = (data: CodeFormData) => {
    verifyCode(email, data.code);
  };

  const handleSendCode = emailForm.handleSubmit(onEmailSubmit);

  const handleVerify = codeForm.handleSubmit(onCodeSubmit);

  const handleBack = () => {
    setStep("email");
    codeForm.reset();
  };

  return (
    <div className="bg-background text-foreground m-0 flex h-full min-h-screen w-full items-center justify-center overflow-hidden p-0 font-sans antialiased">
      <div className="bg-card absolute top-0 left-0 z-10 w-full overflow-hidden rounded-t-md">
        <WindowTitleBar />
      </div>
      {/* 主窗口容器 */}
      <div className="bg-card relative flex h-full w-full flex-col overflow-hidden rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        {/* 主体布局 */}
        <div className="flex flex-1">
          {/* ================= 左侧面板 ================= */}
          <div className="relative flex flex-1 flex-col justify-center overflow-hidden p-20">
            {/* --- 左侧内容区 --- */}
            <div className="relative z-20 flex h-full flex-col justify-center">
              {/* Logo */}
              <div className="text-foreground mb-12 flex items-center gap-2.5 text-[24px] font-bold">
                <AIconLinkdo className="size-10 rounded-sm" alt="link-do" />
                LinkDo
              </div>

              {/* 欢迎标题 */}
              <div className="mb-10">
                <h1 className="text-foreground m-0 flex items-center text-[32px] font-extrabold tracking-tight">
                  欢迎回来 <span className="ml-2 text-3xl">&#x1F44B;</span>
                </h1>
                <p className="text-muted-foreground mt-2.5 mb-0 text-[16px]">
                  专注当下，高效成就未来
                </p>
              </div>

              {/* 功能列表 */}
              <div className="flex flex-col gap-6">
                {/* 功能 1 */}
                <div className="flex items-start gap-4">
                  <IconClock className="text-foreground size-10" />
                  <div className="mt-0.5">
                    <h3 className="text-foreground m-0 text-[15px] font-semibold">
                      专注计时
                    </h3>
                    <p className="text-muted-foreground m-0 mt-1 text-[13px]">
                      科学番茄钟，提升专注力
                    </p>
                  </div>
                </div>

                {/* 功能 2 */}
                <div className="flex items-start gap-4">
                  <IconList className="text-foreground size-10" />
                  <div className="mt-0.5">
                    <h3 className="text-foreground m-0 text-[15px] font-semibold">
                      任务管理
                    </h3>
                    <p className="text-muted-foreground m-0 mt-1 text-[13px]">
                      清晰规划，高效执行每一步
                    </p>
                  </div>
                </div>

                {/* 功能 3 */}
                <div className="flex items-start gap-4">
                  <IconChartPie className="text-foreground size-10" />
                  <div className="mt-0.5">
                    <h3 className="text-foreground m-0 text-[15px] font-semibold">
                      数据洞察
                    </h3>
                    <p className="text-muted-foreground m-0 mt-1 text-[13px]">
                      多维度分析，持续优化习惯
                    </p>
                  </div>
                </div>
              </div>

              {/* 轮播指示器 */}
              <div className="absolute bottom-10 left-0 flex gap-2">
                <div className="bg-foreground h-2 w-4 rounded-full"></div>
                <div className="bg-muted-foreground/40 h-2 w-2 rounded-full"></div>
                <div className="bg-muted-foreground/40 h-2 w-2 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* ================= 右侧面板 ================= */}
          <div className="bg-card absolute top-1/2 right-20 z-50 flex w-[480px] -translate-y-1/2 items-center justify-center rounded-lg py-20 shadow-2xl">
            {/* 登录卡片 */}
            <div className="w-[380px] text-center">
              <h2 className="text-foreground m-0 mb-2 text-[24px] font-bold">
                登录到 <span className="text-blue-400">Blitzit</span>
              </h2>
              <p className="text-muted-foreground mt-0 mb-8 text-[14px]">
                {step === "email"
                  ? "输入邮箱获取验证码"
                  : "输入发送到邮箱的验证码"}
              </p>

              {step === "email" ? (
                <>
                  {/* 邮箱输入 */}
                  <form onSubmit={handleSendCode}>
                    <div className="mb-4">
                      <div
                        className={`bg-muted text-foreground flex items-center rounded-md border px-3 py-3 ${
                          emailForm.formState.errors.email
                            ? "border-destructive"
                            : "border-border"
                        }`}
                      >
                        <IconMail className="text-muted-foreground mr-3 h-5 w-5" />
                        <input
                          type="email"
                          placeholder="请输入邮箱地址"
                          {...emailForm.register("email")}
                          className="placeholder:text-muted-foreground flex-1 bg-transparent text-[14px] outline-none"
                        />
                      </div>
                      {emailForm.formState.errors.email && (
                        <p className="text-destructive mt-1 text-left text-[12px]">
                          {emailForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* 发送验证码按钮 */}
                    <button
                      type="submit"
                      disabled={sendingCode}
                      className="bg-foreground text-background hover:bg-foreground/90 flex w-full cursor-pointer items-center justify-center gap-3 rounded-md py-3.5 text-[14px] font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendingCode ? "发送中..." : "发送验证码"}
                    </button>
                  </form>

                  {/* Notion 按钮 */}
                  <button
                    type="button"
                    className="bg-muted text-foreground border-border hover:bg-accent mt-3 flex w-full cursor-pointer items-center justify-center gap-3 rounded-md border py-3.5 text-[14px] font-semibold transition-colors duration-200"
                  >
                    <IconBrandNotion />
                    使用 Notion 继续
                  </button>

                  {/* 分隔线 */}
                  <div className="my-6 flex items-center">
                    <div className="bg-border h-[1px] flex-1"></div>
                    <span className="text-muted-foreground px-4 text-[13px]">
                      或
                    </span>
                    <div className="bg-border h-[1px] flex-1"></div>
                  </div>
                </>
              ) : (
                <>
                  {/* 返回按钮 */}
                  <button
                    type="button"
                    onClick={handleBack}
                    className="mb-4 text-[13px] text-blue-400 hover:text-blue-300"
                  >
                    &larr; 返回重新输入邮箱
                  </button>

                  {/* 验证码输入 */}
                  <form onSubmit={handleVerify}>
                    <div className="mb-4">
                      <div
                        className={`bg-muted text-foreground flex items-center rounded-md border px-3 py-3 ${
                          codeForm.formState.errors.code
                            ? "border-destructive"
                            : "border-border"
                        }`}
                      >
                        <IconLock className="text-muted-foreground mr-3 h-5 w-5" />
                        <input
                          type="text"
                          placeholder="请输入6位验证码"
                          inputMode="numeric"
                          {...codeForm.register("code", {
                            setValueAs: (value) =>
                              value.replace(/\D/g, "").slice(0, 6),
                          })}
                          className="placeholder:text-muted-foreground flex-1 bg-transparent text-[14px] outline-none"
                        />
                      </div>
                      {codeForm.formState.errors.code && (
                        <p className="text-destructive mt-1 text-left text-[12px]">
                          {codeForm.formState.errors.code.message}
                        </p>
                      )}
                    </div>

                    {/* 验证码提示 */}
                    <div className="text-muted-foreground mb-4 flex items-center justify-between text-[12px]">
                      <span>验证码已发送至 {email}</span>
                      <button
                        type="button"
                        onClick={() => {
                          emailForm.reset();
                          emailForm.handleSubmit((data) => {
                            setEmail(data.email);
                            sendCode(data.email);
                          })();
                        }}
                        disabled={countdown > 0 || sendingCode}
                        className="disabled:text-muted-foreground text-blue-400 hover:text-blue-300"
                      >
                        {countdown > 0
                          ? `${countdown}s 后可重新发送`
                          : "重新发送"}
                      </button>
                    </div>

                    {/* 验证按钮 */}
                    <button
                      type="submit"
                      disabled={verifyingCode}
                      className="bg-foreground text-background hover:bg-foreground/90 flex w-full cursor-pointer items-center justify-center gap-3 rounded-md py-3.5 text-[14px] font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {verifyingCode ? "验证中..." : "验证并登录"}
                    </button>
                  </form>
                </>
              )}

              {/* 信息提示框 */}
              <div className="bg-muted mt-6 flex items-start gap-3 rounded-lg border border-blue-400/40 p-4 text-left">
                <IconShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <div className="flex-1">
                  <h4 className="text-foreground m-0 text-[13px] font-semibold">
                    我们不会访问你的 Notion 内容
                  </h4>
                  <p className="text-muted-foreground m-0 mt-1 text-[12px] leading-relaxed">
                    仅用于身份验证，保障你的数据安全
                  </p>
                </div>
              </div>

              {/* 了解更多 */}
              <div className="text-muted-foreground mt-8 flex items-center justify-center gap-1 text-[13px]">
                没有 Notion 账号？
                <a
                  href="#"
                  className="flex items-center font-semibold text-blue-400 transition-colors hover:text-blue-300"
                >
                  了解更多
                  <svg
                    className="ml-0.5 h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </a>
              </div>
            </div>

            {/* 底部协议区 */}
            <div className="text-muted-foreground absolute bottom-6 w-full text-center text-[12px]">
              继续即表示你同意
              <a
                href="#"
                className="px-1 text-blue-400 transition-colors hover:text-blue-300"
              >
                服务条款
              </a>{" "}
              和
              <a
                href="#"
                className="px-1 text-blue-400 transition-colors hover:text-blue-300"
              >
                隐私政策
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
