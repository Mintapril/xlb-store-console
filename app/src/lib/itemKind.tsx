import { Scale, Combine, Layers, Package } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 商品类别识别（原版字段）：
 * - weigh=true → 散称（称重，可能有制单组合）
 * - item_type=MAKEBILL → 制单组合（散称按组合制单）
 * - item_type=MULTIPLESPEC/MAINSPEC → 定量多规格（不同销售规格）
 * - 其他 → 定量标品
 */
export type ItemKind = "weigh" | "makebill" | "multispec" | "standard";

export function kindOf(item: { weigh?: boolean | null; item_type?: string | null }): ItemKind {
  if (item.weigh) return "weigh";
  const t = item.item_type;
  if (t === "MAKEBILL") return "makebill";
  if (t === "MULTIPLESPEC" || t === "MAINSPEC") return "multispec";
  return "standard";
}

const KIND_META: Record<ItemKind, { label: string; cls: string; Icon: typeof Scale }> = {
  weigh: { label: "散称", cls: "border-emerald-300 text-emerald-600", Icon: Scale },
  makebill: { label: "制单组合", cls: "border-violet-300 text-violet-600", Icon: Combine },
  multispec: { label: "多规格", cls: "border-sky-300 text-sky-600", Icon: Layers },
  standard: { label: "定量", cls: "border-slate-200 text-slate-400", Icon: Package },
};

export function ItemKindBadge({ item, hideStandard = true, className }: { item: { weigh?: boolean | null; item_type?: string | null }; hideStandard?: boolean; className?: string }) {
  const kind = kindOf(item);
  if (kind === "standard" && hideStandard) return null;
  const { label, cls, Icon } = KIND_META[kind];
  return (
    <span className={cn("inline-flex h-4 shrink-0 items-center gap-0.5 rounded border px-1 text-[9px] leading-none", cls, className)}>
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
