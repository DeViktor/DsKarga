import * as React from "react";

export const Slot = React.forwardRef<any, { children: React.ReactElement } & Record<string, any>>(
  ({ children, ...props }, ref) => {
    return React.cloneElement(children, { ...props, ref });
  }
);
Slot.displayName = "Slot";
