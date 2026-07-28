import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, ShoppingCart, Smartphone, Sparkles, Store, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME, APP_SHORT_NAME } from "@/const";
import { cn } from "@/lib/utils";
import { trpc } from "@/providers/trpc";
import { defaultPath } from "@/lib/registry";

export default function Login() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const afterLogin = async () => {
    await utils.auth.me.invalidate();
    toast.success("登录成功", { description: "已接入真实业务系统。" });
    navigate(defaultPath, { replace: true });
  };
  const login = trpc.auth.login.useMutation({
    onSuccess: afterLogin,
    onError: (error) => toast.error("登录失败", { description: error.message }),
  });
  const smsLogin = trpc.auth.smsLogin.useMutation({
    onSuccess: afterLogin,
    onError: (error) => toast.error("登录失败", { description: error.message }),
  });
  const sendCode = trpc.auth.sendSmsCode.useMutation({
    onSuccess: () => {
      toast.success("验证码已发送");
      setCountdown(60);
    },
    onError: (error) => toast.error("发送失败", { description: error.message }),
  });
  const [mode, setMode] = useState<"password" | "sms">("password");
  const [orgCode, setOrgCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [agreed, setAgreed] = useState(true);

  useEffect(() => {
    if (me.data) navigate(defaultPath, { replace: true });
  }, [me.data, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!agreed) {
      toast.warning("请先勾选并同意协议");
      return;
    }
    if (mode === "sms") {
      smsLogin.mutate({ phone, code: smsCode });
    } else {
      login.mutate({ orgCode, username, password });
    }
  }

  return (
    <div className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eef6ff_48%,#ecfeff_100%)] lg:grid-cols-[minmax(440px,42%)_1fr]">
      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-slate-950">{APP_SHORT_NAME}<span className="text-blue-600">3.0</span></div>
              <div className="text-sm text-slate-500">门店端 · 真实业务系统直连</div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/82 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-950">欢迎使用{APP_SHORT_NAME}</h1>
              <p className="mt-1 text-sm text-slate-500">{APP_NAME}</p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-medium text-slate-500">
              <button type="button" onClick={() => setMode("sms")} className={cn("rounded-xl px-3 py-2 text-center", mode === "sms" && "bg-white text-blue-600 shadow-sm")}>验证码登录</button>
              <button type="button" onClick={() => setMode("password")} className={cn("rounded-xl px-3 py-2 text-center", mode === "password" && "bg-white text-blue-600 shadow-sm")}>账号登录</button>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              {mode === "password" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="org">授权机构号</Label>
                    <div className="relative">
                      <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="org" value={orgCode} onChange={(e) => setOrgCode(e.target.value)} className="h-12 rounded-xl pl-9" placeholder="请输入授权机构号" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">账号</Label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 rounded-xl pl-9" placeholder="请输入账号" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">密码</Label>
                      <button type="button" className="text-xs text-slate-400 hover:text-blue-600" onClick={() => toast.info("请前往新零帮官方登录页重置密码")}>忘记密码</button>
                    </div>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl pl-9 pr-10" placeholder="请输入密码" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">手机号</Label>
                    <div className="relative">
                      <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="phone" type="tel" maxLength={11} value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-xl pl-9" placeholder="请输入手机号" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smsCode">验证码</Label>
                    <div className="flex gap-2">
                      <Input id="smsCode" maxLength={6} value={smsCode} onChange={(e) => setSmsCode(e.target.value)} className="h-12 flex-1 rounded-xl" placeholder="请输入验证码" />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 w-28 rounded-xl"
                        disabled={countdown > 0 || sendCode.isPending || !/^1[3-9]\d{9}$/.test(phone)}
                        onClick={() => sendCode.mutate({ phone })}
                      >
                        {countdown > 0 ? `${countdown}s` : sendCode.isPending ? "发送中..." : "获取验证码"}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" disabled={login.isPending || smsLogin.isPending} className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-700">
                {login.isPending || smsLogin.isPending ? "登录中..." : "登录"}
              </Button>

              <label className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(Boolean(v))} className="mt-0.5" />
                <span>已阅读并同意 <span className="text-blue-600">《隐私政策》</span>、<span className="text-blue-600">《用户协议》</span></span>
              </label>
            </form>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-700">
            <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />安全说明</div>
            <p className="mt-1">本系统通过官方 IDaaS 网关直连真实业务系统：密码仅用于当次换取令牌，不做存储；会话令牌经签名后写入 HttpOnly Cookie，服务端不落地。</p>
          </div>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(37,99,235,0.08),rgba(14,165,233,0.16)),radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.28),transparent_30%)]" />
        <div className="relative flex h-full flex-col items-center justify-center px-14 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" /> 你的一站式工作平台
          </div>
          <h2 className="max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-950">
            人，货，场，域，信息，
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">一处搞定</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">直连新零帮真实业务系统：要货、订货、配送、收货、盘点与库存，移动端随时随地处理门店日常经营。</p>
          <div className="mt-10 grid w-full max-w-2xl grid-cols-3 gap-4">
            {["真实数据实时同步", "审核操作二次确认", "移动端优先设计"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/70 bg-white/70 px-4 py-5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur">{item}</div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
