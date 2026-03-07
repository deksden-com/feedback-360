import type * as React from "react";

import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full border bg-muted/60 text-sm font-semibold text-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    />
  );
}

const AvatarLabel = AvatarFallback;

export { Avatar, AvatarFallback, AvatarLabel };
