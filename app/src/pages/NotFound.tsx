import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { defaultPath } from "@/lib/registry";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl border bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">404</div>
        <h1 className="text-xl font-semibold text-slate-900">页面不存在或没有权限</h1>
        <p className="mt-2 text-sm text-slate-500">请从左侧菜单进入已开放的业务页面。</p>
        <Button asChild className="mt-6 rounded-xl">
          <Link to={defaultPath}>返回工作台</Link>
        </Button>
      </div>
    </div>
  );
}
