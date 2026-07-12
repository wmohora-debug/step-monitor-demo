"use client";

import React, { useMemo } from "react";
import { cn } from "../../core/utils/cn";

export type ChartType = "line" | "bar" | "pie" | "area" | "donut";

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DashboardChartProps {
  type: ChartType;
  data: ChartDataPoint[];
  title: string;
  className?: string;
  height?: number;
  color?: string;
}

export function DashboardChart({
  type,
  data = [],
  title,
  className,
  height = 200,
  color = "currentColor",
}: DashboardChartProps) {
  const values = useMemo(() => data.map((d) => d.value), [data]);
  const maxValue = useMemo(() => Math.max(...values, 1), [values]);
  
  // 1. Calculations for Line & Area Charts
  const pathData = useMemo((): { x: number; y: number }[] => {
    if (data.length === 0) return [];
    const width = 500;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    return data.map((d, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - (d.value / maxValue) * chartHeight;
      return { x, y };
    });
  }, [data, height, maxValue]);

  const linePath = useMemo(() => {
    if (pathData.length === 0) return "";
    return pathData.reduce((acc: string, point: { x: number; y: number }, index: number) => {
      return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, "");
  }, [pathData]);

  const areaPath = useMemo(() => {
    if (pathData.length === 0) return "";
    const padding = 40;
    const chartHeight = height - padding * 2;
    const firstPoint = pathData[0];
    const lastPoint = pathData[pathData.length - 1];
    
    return `${linePath} L ${lastPoint.x} ${padding + chartHeight} L ${firstPoint.x} ${padding + chartHeight} Z`;
  }, [pathData, linePath, height]);

  // 2. Calculations for Pie & Donut Charts
  const pieSegments = useMemo(() => {
    const total = values.reduce((acc, val) => acc + val, 0);
    if (total === 0) return [];
    
    let accumulatedAngle = 0;
    return data.map((d) => {
      const percentage = d.value / total;
      const angle = percentage * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;
      return {
        label: d.label,
        value: d.value,
        percentage,
        startAngle,
        angle,
      };
    });
  }, [data, values]);

  // Render Line Chart
  const renderLine = () => {
    const padding = 40;
    return (
      <svg viewBox={`0 0 500 ${height}`} className="w-full h-full">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {Array.from({ length: 4 }).map((_, idx) => {
          const yPos = padding + (idx / 3) * (height - padding * 2);
          return (
            <line
              key={idx}
              x1={padding}
              y1={yPos}
              x2={500 - padding}
              y2={yPos}
              className="stroke-border/40 stroke-1"
              strokeDasharray="4 4"
            />
          );
        })}
        {/* Y Axis Values */}
        <text x={10} y={padding + 5} className="fill-muted-foreground text-[10px] font-semibold">
          {Math.round(maxValue)}
        </text>
        <text x={10} y={height - padding + 5} className="fill-muted-foreground text-[10px] font-semibold">
          0
        </text>

        {/* Chart Line */}
        <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" className="animate-draw-line" />
        
        {/* Points */}
        {pathData.map((point: { x: number; y: number }, idx: number) => (
          <circle
            key={idx}
            cx={point.x}
            cy={point.y}
            r="4"
            className="fill-card stroke-primary stroke-2 hover:r-6 hover:fill-primary transition-all cursor-pointer"
          />
        ))}
      </svg>
    );
  };

  // Render Area Chart
  const renderArea = () => {
    const padding = 40;
    return (
      <svg viewBox={`0 0 500 ${height}`} className="w-full h-full">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {Array.from({ length: 4 }).map((_, idx) => {
          const yPos = padding + (idx / 3) * (height - padding * 2);
          return (
            <line
              key={idx}
              x1={padding}
              y1={yPos}
              x2={500 - padding}
              y2={yPos}
              className="stroke-border/40 stroke-1"
              strokeDasharray="4 4"
            />
          );
        })}
        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />
        {/* Line stroke */}
        <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  };

  // Render Bar Chart
  const renderBar = () => {
    const padding = 40;
    const chartWidth = 500 - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = (chartWidth / data.length) * 0.6;
    const spacing = (chartWidth / data.length) * 0.4;

    return (
      <svg viewBox={`0 0 500 ${height}`} className="w-full h-full">
        {/* Horizontal grid lines */}
        {Array.from({ length: 4 }).map((_, idx) => {
          const yPos = padding + (idx / 3) * (chartHeight);
          return (
            <line
              key={idx}
              x1={padding}
              y1={yPos}
              x2={500 - padding}
              y2={yPos}
              className="stroke-border/30 stroke-1"
            />
          );
        })}

        {/* Bars */}
        {data.map((d, index) => {
          const x = padding + index * (barWidth + spacing) + spacing / 2;
          const barHeight = (d.value / maxValue) * chartHeight;
          const y = padding + chartHeight - barHeight;

          return (
            <g key={index} className="group cursor-pointer">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                className="fill-primary/80 group-hover:fill-primary transition-colors duration-200"
              />
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {d.value}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - padding + 16}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px] font-semibold"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Render Pie/Donut Chart
  const renderDonutOrPie = (isDonut: boolean) => {
    const radius = 70;
    const cx = 150;
    const cy = 100;
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-full w-full">
        <svg viewBox="0 0 300 200" className="w-48 h-48">
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {pieSegments.map((seg, idx) => {
              const radStart = (seg.startAngle * Math.PI) / 180;
              const radEnd = ((seg.startAngle + seg.angle) * Math.PI) / 180;
              
              const x1 = cx + radius * Math.cos(radStart);
              const y1 = cy + radius * Math.sin(radStart);
              const x2 = cx + radius * Math.cos(radEnd);
              const y2 = cy + radius * Math.sin(radEnd);
              
              const largeArcFlag = seg.angle > 180 ? 1 : 0;
              const pathDataStr = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              // Generate colors
              const colors = [
                "var(--color-primary)",
                "color-mix(in srgb, var(--color-primary) 70%, white)",
                "color-mix(in srgb, var(--color-primary) 40%, white)",
                "color-mix(in srgb, var(--color-primary) 20%, white)",
              ];
              const fillColor = colors[idx % colors.length];

              return (
                <path
                  key={idx}
                  d={pathDataStr}
                  fill={fillColor}
                  className="stroke-card stroke-2 hover:opacity-90 transition-opacity cursor-pointer"
                />
              );
            })}
            
            {/* Center cutout for Donut */}
            {isDonut && (
              <circle cx={cx} cy={cy} r={radius * 0.6} className="fill-card" />
            )}
          </g>
        </svg>

        {/* Legend */}
        <div className="flex flex-col gap-2">
          {pieSegments.map((seg, idx) => {
            const colors = [
              "bg-primary",
              "bg-primary/70",
              "bg-primary/40",
              "bg-primary/20",
            ];
            const bgClass = colors[idx % colors.length];

            return (
              <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold">
                <span className={cn("h-3 w-3 rounded-full shrink-0", bgClass)} />
                <span className="text-muted-foreground">{seg.label}:</span>
                <strong className="text-foreground">{seg.value} ({(seg.percentage * 100).toFixed(0)}%)</strong>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm space-y-4", className)}>
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{title}</h4>
      <div style={{ height }} className="relative flex items-center justify-center">
        {data.length === 0 ? (
          <div className="text-xs font-medium text-muted-foreground">No data points available</div>
        ) : (
          <>
            {type === "line" && renderLine()}
            {type === "area" && renderArea()}
            {type === "bar" && renderBar()}
            {type === "pie" && renderDonutOrPie(false)}
            {type === "donut" && renderDonutOrPie(true)}
          </>
        )}
      </div>
    </div>
  );
}
