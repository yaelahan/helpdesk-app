import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

/** F3 tabular-spec-sheet archetype: hairline rows, tabular numerics, no card chrome. */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-[var(--radius-md)] border border-rule">
      <table className="w-full min-w-[36rem] border-collapse text-sm tabular-nums">
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-rule bg-paper-2">{children}</thead>;
}

export function TableHeadCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "mono-label px-4 py-3 text-left font-medium text-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TableRow({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-rule last:border-b-0 transition-colors duration-[var(--dur-fast)] hover:bg-paper-2",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3 align-middle text-ink-2", className)}>{children}</td>;
}
