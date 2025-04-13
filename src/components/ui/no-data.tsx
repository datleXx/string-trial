"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { Card, CardContent } from "./card";

interface NoDataProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export function NoData({
  title = "No data available",
  message = "There are no items to display at this time.",
  icon,
  className,
  ...props
}: NoDataProps) {
  return (
    <Card className={cn("w-full", className)} {...props}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {icon && <div className="text-muted-foreground mb-4 text-4xl">{icon}</div>}
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{message}</p>
      </CardContent>
    </Card>
  );
}