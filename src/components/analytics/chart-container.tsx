"use client";

import { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number | string;
}

export function ChartContainer({ title, subtitle, children, height = 300 }: ChartContainerProps) {
  return (
    <Card className="border-gray-200 shadow-sm overflow-hidden sm:rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-black text-gray-900">{title}</CardTitle>
        {subtitle && <p className="text-sm text-gray-400 font-medium">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children as any}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
