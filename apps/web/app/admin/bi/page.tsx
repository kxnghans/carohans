"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icons } from '../../lib/icons';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, LabelList, Sector, Rectangle
} from 'recharts';
import { useAppStore } from '../../context/AppContext';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency, calculateMetrics } from '../../utils/helpers';

// --- REUSABLE DROPDOWN SLICER COMPONENT ---
const FilterDropdown = ({ label, options, selected, onToggle, allLabel = "All Statuses" }: { 
  label: string, options: string[], selected: string[], onToggle: (val: string) => void, allLabel?: string 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { ChevronDown, Check } = Icons;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const displayText = selected.includes('All') ? 'All' : `${selected.length} Selected`;

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-[180px] relative" ref={dropdownRef}>
      <span className="text-theme-caption font-bold text-muted uppercase tracking-widest ml-1">{label}</span>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[38px] px-4 bg-surface border rounded-xl flex items-center justify-between transition-all text-theme-caption font-black uppercase tracking-tight shadow-sm active:scale-[0.98] ${isOpen ? 'border-primary ring-4 ring-primary/5' : 'border-border hover:border-muted'}`}
      >
        <span className={selected.includes('All') ? 'text-muted' : 'text-primary'}>{displayText}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-[65px] left-0 right-0 bg-surface border border-border rounded-2xl shadow-2xl z-50 p-2 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-200 min-w-[200px]">
          <div className="flex justify-between items-center px-2 py-1.5 border-b border-border/50 mb-1">
            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Select {label}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-[10px] font-black text-primary hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-all active:scale-95 border border-primary/20"
            >
              Done
            </button>
          </div>
          <button 
            onClick={() => onToggle('All')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-background transition-colors group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selected.includes('All') ? 'bg-primary border-primary shadow-sm' : 'bg-background border-border group-hover:border-primary/50'}`}>
                {selected.includes('All') && <Check className="w-3 h-3 text-primary-text" />}
              </div>
              <span className={`text-theme-caption font-bold uppercase tracking-tight ${selected.includes('All') ? 'text-primary' : 'text-muted'}`}>All</span>
            </div>
          </button>
          <div className="h-px bg-border mx-2 my-1"></div>
          <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-0.5 px-0.5">
            {options.map(opt => (
              <button 
                key={opt}
                onClick={() => onToggle(opt)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-background transition-colors group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selected.includes(opt) ? 'bg-primary border-primary shadow-sm' : 'bg-background border-border group-hover:border-primary/50'}`}>
                    {selected.includes(opt) && <Check className="w-3 h-3 text-primary-text" />}
                  </div>
                  <span className={`text-theme-caption font-bold uppercase tracking-tight ${selected.includes(opt) ? 'text-primary' : 'text-muted'}`}>{opt}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminBIPage() {
  const { clients, orders, inventory } = useAppStore();
  const { Users, TrendingUp, Activity, Filter, ChevronRight, Sparkles, Cash, Zap, BarChart: BarIcon, Package, ChevronDown, Calendar } = Icons;

  // Filters State
  const [timeRange, setTimeRange] = useState('All Time');
  const [categoryFilter, setCategoryFilter] = useState<string[]>(['All']);
  const [statusFilter, setStatusFilter] = useState<string[]>(['All']);
  const [volumeRange, setVolumeRange] = useState('12');
  
  // New BI Filters
  const [returnStatusFilter, setReturnStatusFilter] = useState<string[]>(['All']);
  const [integrityFilter, setIntegrityFilter] = useState<string[]>(['All']);
  const [usageType, setUsageType] = useState<'Categories' | 'Items'>('Categories');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const resetFilters = () => {
    setTimeRange('All Time');
    setCategoryFilter(['All']);
    setStatusFilter(['All']);
    setReturnStatusFilter(['All']);
    setIntegrityFilter(['All']);
  };

  // --- CORE FILTERING LOGIC ---

  // 1. Filter orders based on Status and Return Status
  const baseFilteredOrders = useMemo(() => {
      let result = orders;
      if (!statusFilter.includes('All')) {
          result = result.filter(o => statusFilter.includes(o.status));
      }
      if (!returnStatusFilter.includes('All')) {
          result = result.filter(o => o.returnStatus && returnStatusFilter.includes(o.returnStatus));
      }
      return result;
  }, [orders, statusFilter, returnStatusFilter]);

  // 2. Deep Filter: Filter data by Category and Item Integrity
  const categoryFilteredData = useMemo(() => {
      let result = baseFilteredOrders;
      
      // Category Filter (Multi-select)
      if (!categoryFilter.includes('All')) {
          result = result.map(order => {
              const filteredItems = order.items.filter(item => {
                  const invItem = inventory.find(i => i.id === item.itemId);
                  return invItem && categoryFilter.includes(invItem.category);
              });
              if (filteredItems.length === 0) return null;
              return { ...order, items: filteredItems };
          }).filter(Boolean) as typeof orders;
      }

      // Integrity Filter (Multi-select)
      if (!integrityFilter.includes('All')) {
          result = result.filter(o => o.itemIntegrity && integrityFilter.includes(o.itemIntegrity));
      }

      return result;
  }, [baseFilteredOrders, categoryFilter, inventory, integrityFilter]);

  const toggleFilter = (current: string[], value: string, setter: (val: string[]) => void) => {
      if (value === 'All') {
          setter(['All']);
          return;
      }
      let next = current.filter(v => v !== 'All');
      if (next.includes(value)) {
          next = next.filter(v => v !== value);
          if (next.length === 0) next = ['All'];
      } else {
          next.push(value);
      }
      setter(next);
  };

  // 3. Re-calculate metrics for StatCards
  const localMetrics = useMemo(() => calculateMetrics(categoryFilteredData), [categoryFilteredData]);

  // 4. Monthly Trends
  const financialTrends = useMemo(() => {
    const months: Record<string, { revenue: number; orders: number; monthIndex: number }> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    categoryFilteredData.forEach(order => {
        const date = new Date(order.startDate);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().substr(2,2)}`;
        if (!months[monthKey]) months[monthKey] = { revenue: 0, orders: 0, monthIndex: date.getTime() };
        months[monthKey].revenue += Number(order.totalAmount);
        months[monthKey].orders += 1;
    });

    return Object.entries(months)
        .map(([key, val]) => ({ month: key, revenue: val.revenue, orders: val.orders, sort: val.monthIndex }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ month, revenue, orders }) => ({ month, revenue, orders }));
  }, [categoryFilteredData]);

  // 5. Return Status Portfolio
  const returnStatusData = useMemo(() => {
      const statusMap: Record<string, number> = { 'Early': 0, 'On Time': 0, 'Late': 0 };
      // Include both Completed and Settlement orders as they both represent returned equipment
      const returnedOrders = orders.filter(o => ['Completed', 'Settlement'].includes(o.status) && o.returnStatus);
      
      returnedOrders.forEach(o => {
          const status = o.returnStatus || 'Unknown';
          if (statusMap[status] !== undefined) {
            statusMap[status] = (statusMap[status] || 0) + 1;
          }
      });

      const colors: Record<string, string> = {
          'Early': 'var(--color-accent-primary)',
          'On Time': 'var(--color-success)',
          'Late': 'var(--color-error)'
      };

      return Object.entries(statusMap)
        .filter(([_, value]) => value > 0) // Only show statuses that have data
        .map(([name, value]) => ({
          name,
          value,
          color: colors[name] || 'var(--color-muted)'
      }));
  }, [orders]);

  // 6. Usage Ranking (Dynamic Toggle)
  const usageRankingData = useMemo(() => {
      if (usageType === 'Categories') {
          const catMap: Record<string, number> = {};
          categoryFilteredData.forEach(order => {
              order.items.forEach(item => {
                  const invItem = inventory.find(i => i.id === item.itemId);
                  if (invItem) {
                      catMap[invItem.category] = (catMap[invItem.category] || 0) + 1; // Frequency
                  }
              });
          });
          return Object.entries(catMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
      } else {
          const itemMap: Record<string, number> = {};
          categoryFilteredData.forEach(order => {
              order.items.forEach(item => {
                  const invItem = inventory.find(i => i.id === item.itemId);
                  if (invItem) {
                      itemMap[invItem.name] = (itemMap[invItem.name] || 0) + 1; // Frequency
                  }
              });
          });
          return Object.entries(itemMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
      }
  }, [categoryFilteredData, inventory, usageType]);

  // Simplified for insights
  const categoryFilteredOrders = categoryFilteredData;

  // 7. Inventory Performance (Kept for Insights)
  const inventoryPerformanceData = useMemo(() => {
      const itemMap: Record<string, number> = {};
      categoryFilteredOrders.forEach(order => {
          order.items.forEach(item => {
              const invItem = inventory.find(i => i.id === item.itemId);
              if (invItem) {
                  itemMap[invItem.name] = (itemMap[invItem.name] || 0) + Number(item.qty);
              }
          });
      });
      return Object.entries(itemMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
  }, [categoryFilteredData, inventory]);

  // 7. Insight Engine
  const deepInsights = useMemo(() => {
      const insights: any[] = [];
      const peakMonth = [...financialTrends].sort((a, b) => b.revenue - a.revenue)[0];
      if (peakMonth) {
          insights.push({
              title: "Volume Peak",
              desc: `${peakMonth.month} recorded the highest ${categoryFilter.includes('All') ? 'overall' : categoryFilter.join(', ')} volume with ${peakMonth.orders} bookings.`,
              icon: TrendingUp, 
              color: "text-success", 
              bg: "bg-success/10"
          });
      }
      
      // Calculate top client on the fly for insights
      const clientMap: Record<string, number> = {};
      categoryFilteredData.forEach(o => {
          clientMap[o.clientName] = (clientMap[o.clientName] || 0) + Number(o.totalAmount);
      });
      const topClientEntry = Object.entries(clientMap).sort((a, b) => b[1] - a[1])[0];

      if (topClientEntry) {
          insights.push({
              title: "Core Advocate",
              desc: `${topClientEntry[0]} is your lead client for this segment, contributing ${((topClientEntry[1] / (localMetrics.totalRevenue || 1)) * 100).toFixed(0)}% of segment revenue.`,
              icon: Users, 
              color: "text-secondary", 
              bg: "bg-secondary/10"
          });
      }
      const topItem = inventoryPerformanceData[0];
      if (topItem) {
          insights.push({
              title: "High Demand",
              desc: `"${topItem.name}" has the highest turnover rate in this selection. Consider scaling this specific asset.`,
              icon: Zap, 
              color: "text-warning", 
              bg: "bg-warning/10"
          });
      }
      return insights;
  }, [financialTrends, inventoryPerformanceData, categoryFilter, localMetrics, categoryFilteredData]);

  const filteredTrends = useMemo(() => {
    const data = financialTrends.length > 0 ? financialTrends : [];
    switch(timeRange) {
      case '7D': return data.slice(-1);
      case '30D': return data.slice(-2);
      case '90D': return data.slice(-4);
      case '1Y': return data.slice(-12);
      default: return data;
    }
  }, [timeRange, financialTrends]);

  const volumeTrends = useMemo(() => {
      const data = financialTrends.length > 0 ? financialTrends : [];
      
      // Convert global timeRange to an approximate month count for comparison
      const timeRangeToMonths: Record<string, number> = {
        '7D': 1,
        '30D': 2,
        '90D': 4,
        '1Y': 12,
        'All Time': Infinity
      };

      const globalLimit = timeRangeToMonths[timeRange] || Infinity;
      const localLimit = volumeRange === 'All' ? Infinity : parseInt(volumeRange);

      // Apply the smallest limit
      const finalLimit = Math.min(globalLimit, localLimit);

      if (finalLimit === Infinity) return data;
      return data.slice(-finalLimit);
  }, [timeRange, volumeRange, financialTrends]);

  const [activeIndex, setActiveIndex] = useState(-1);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 8}
          outerRadius={outerRadius + 10}
          fill={fill}
          fillOpacity={0.3}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const color = payload[0].color || payload[0].payload?.color || 'var(--color-primary)';
      return (
        <div 
          className="bg-surface p-4 border-2 shadow-2xl rounded-2xl transition-all duration-300"
          style={{ borderColor: color }}
        >
          <p className="text-muted font-black uppercase mb-2 tracking-widest text-[10px] opacity-60">{label || payload[0].name}</p>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
            <p className="text-foreground font-black text-theme-header tracking-tighter">
                {typeof payload[0].value === 'number' && payload[0].value >= 100 ? formatCurrency(payload[0].value) : payload[0].value}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const RenderCustomLabel = (props: any) => {
    const { x, y, value } = props;
    const formattedValue = value >= 1000 ? `¢${(value / 1000).toFixed(0)}k` : `¢${value}`;
    return (
      <g>
        <rect x={x - 20} y={y - 25} width={40} height={18} rx={4} fill="var(--color-surface)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" className="stroke-border stroke-[0.5px]" />
        <text x={x} y={y - 12} fill="var(--color-chart-label)" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 600 }}>
          {formattedValue}
        </text>
      </g>
    );
  };

  const RenderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: any) => {
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    
    // Position start of line slightly outside the outer radius
    const sx = cx + (outerRadius + 2) * cos;
    const sy = cy + (outerRadius + 2) * sin;
    
    // Middle point for the "elbow"
    const mx = cx + (outerRadius + 15) * cos;
    const my = cy + (outerRadius + 15) * sin;
    
    // End point extending horizontally
    const ex = mx + (cos >= 0 ? 1 : -1) * 15;
    const ey = my;
    
    const textAnchor = cos >= 0 ? 'start' : 'end';
    const sliceColor = payload?.color || "var(--color-chart-label)";
    const textValue = `${((percent || 0) * 100).toFixed(0)}%`;

    return (
      <g>
        {/* Connector Line with higher contrast */}
        <path 
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} 
          stroke={sliceColor} 
          fill="none" 
          strokeOpacity={0.8}
          strokeWidth={1.5}
        />
        {/* Small dot anchor at the start of the line (on the slice edge) */}
        <circle cx={sx} cy={sy} r={2} fill={sliceColor} />
        
        {/* The Data Label positioned relative to the horizontal line end */}
        <text 
          x={ex + (cos >= 0 ? 1 : -1) * 6} 
          y={ey} 
          dy={4}
          textAnchor={textAnchor} 
          fill={sliceColor} 
          style={{ 
            fontSize: '11px', 
            fontWeight: 700,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
          }}
        >
          {textValue}
        </text>
      </g>
    );
  };

  const [rotatedInsights, setRotatedInsights] = useState<any[]>([]);

  // 7. Insight Engine
  const allPotentialInsights = useMemo(() => {
      const insights: any[] = [];
      const peakMonth = [...financialTrends].sort((a, b) => b.revenue - a.revenue)[0];
      if (peakMonth) {
          insights.push({
              title: "Volume Peak",
              desc: `${peakMonth.month} recorded the highest ${categoryFilter.includes('All') ? 'overall' : categoryFilter.join(', ')} volume with ${peakMonth.orders} bookings.`,
              icon: Icons.TrendingUp, 
              color: "text-success", 
              bg: "bg-success/10"
          });
      }
      
      const clientMap: Record<string, number> = {};
      categoryFilteredData.forEach(o => {
          clientMap[o.clientName] = (clientMap[o.clientName] || 0) + Number(o.totalAmount);
      });
      const topClientEntry = Object.entries(clientMap).sort((a, b) => b[1] - a[1])[0];

      if (topClientEntry) {
          insights.push({
              title: "Core Advocate",
              desc: `${topClientEntry[0]} is your lead client for this segment, contributing ${((topClientEntry[1] / (localMetrics.totalRevenue || 1)) * 100).toFixed(0)}% of segment revenue.`,
              icon: Icons.Users, 
              color: "text-secondary", 
              bg: "bg-secondary/10"
          });
      }
      const topItem = inventoryPerformanceData[0];
      if (topItem) {
          insights.push({
              title: "High Demand",
              desc: `"${topItem.name}" has the highest turnover rate in this selection. Consider scaling this specific asset.`,
              icon: Icons.Zap, 
              color: "text-warning", 
              bg: "bg-warning/10"
          });
      }

      // Add dynamic general insights
      if (localMetrics.avgDuration > 5) {
          insights.push({
              title: "Extended Rentals",
              desc: "Average rental duration is currently high. Consider offering loyalty discounts for long-term contracts.",
              icon: Icons.Calendar,
              color: "text-secondary",
              bg: "bg-secondary/10"
          });
      }

      if (localMetrics.onTimeReturnRate < 80) {
          insights.push({
              title: "Audit Alert",
              desc: "On-time returns are below threshold. Review late penalty settings to encourage timely equipment recovery.",
              icon: Icons.AlertCircle,
              color: "text-error",
              bg: "bg-error/10"
          });
      }

      if (orders.filter(o => o.status === 'Pending').length > 5) {
          insights.push({
              title: "Backlog Notice",
              desc: "Large volume of pending orders detected. Rapid processing will improve inventory liquidity.",
              icon: Icons.ClipboardList,
              color: "text-warning",
              bg: "bg-warning/10"
          });
      }

      return insights;
  }, [financialTrends, inventoryPerformanceData, categoryFilter, localMetrics, categoryFilteredData, orders]);

  useEffect(() => {
    const shuffle = () => {
        const shuffled = [...allPotentialInsights].sort(() => 0.5 - Math.random());
        setRotatedInsights(shuffled.slice(0, 3));
    };
    
    shuffle();
    const interval = setInterval(shuffle, 60000); // Rotate every minute
    return () => clearInterval(interval);
  }, [allPotentialInsights]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted text-theme-caption uppercase tracking-widest mb-1">
             <span>Analytics</span>
             <ChevronRight className="w-3 h-3" />
             <span className="text-primary">Insights</span>
          </div>
          <h1 className="text-theme-header text-foreground tracking-tight">Insights</h1>
          <p className="text-muted text-theme-body">Real-time performance metrics and strategic outlook.</p>
        </div>
        <button onClick={() => window.location.reload()} className="p-2 hover:bg-background rounded-lg transition-colors text-muted"><Icons.MoreHorizontal className="w-5 h-5" /></button>
      </div>

      {/* STRATEGIC SLICERS */}
      <Card className="bg-surface border-border p-5 shadow-sm overflow-visible relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
        <div className="flex flex-wrap lg:flex-nowrap items-end gap-6 w-full">
          
          {/* Time Range */}
          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
             <span className="text-theme-caption text-muted uppercase tracking-widest ml-1">Time Range</span>
             <div className="flex p-1 bg-background rounded-xl h-[38px] items-center w-full">
               {['7D', '30D', '90D', '1Y', 'All'].map(range => (
                 <button key={range} onClick={() => setTimeRange(range === 'All' ? 'All Time' : range)} className={`flex-1 h-full rounded-lg text-theme-caption transition-all ${timeRange === (range === 'All' ? 'All Time' : range) ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-foreground'}`}>{range}</button>
               ))}
             </div>
          </div>

          <FilterDropdown 
            label="Status Filter" 
            options={['Pending', 'Approved', 'Active', 'Late', 'Settlement', 'Completed']} 
            selected={statusFilter} 
            onToggle={(val) => toggleFilter(statusFilter, val, setStatusFilter)} 
          />

          <FilterDropdown 
            label="Return Status" 
            options={['Early', 'On Time', 'Late']} 
            selected={returnStatusFilter} 
            onToggle={(val) => toggleFilter(returnStatusFilter, val, setReturnStatusFilter)} 
          />

          <FilterDropdown 
            label="Item Integrity" 
            options={['Good', 'Damaged', 'Lost']} 
            selected={integrityFilter} 
            onToggle={(val) => toggleFilter(integrityFilter, val, setIntegrityFilter)} 
          />

          {/* Reset Action */}
          <div className="flex-none">
            <button 
              onClick={resetFilters}
              className="h-[38px] px-6 bg-primary dark:bg-primary text-primary-text rounded-xl text-theme-caption font-black uppercase tracking-widest hover:bg-primary dark:hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 dark:shadow-none active:scale-[0.98] whitespace-nowrap"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </Card>

      {/* KPI CARDS */}
      <div className="flex flex-wrap gap-6">
        <div className="flex-1 min-w-[160px] max-w-[calc(50%-12px)] lg:max-w-none">
          <StatCard 
            title="Business Revenue" 
            value={formatCurrency(localMetrics.totalRevenue)} 
            subtext={`${categoryFilter} Contribution`} 
            trend={localMetrics.revenueGrowth} 
            trendLabel="30 Days"
            color="primary" 
            icon={Cash} 
          />
        </div>
        <div className="flex-1 min-w-[160px] max-w-[calc(50%-12px)] lg:max-w-none">
          <StatCard title="Avg. Ticket" value={formatCurrency(Math.floor(localMetrics.avgOrderValue))} subtext="Value per booking" color="secondary" icon={Icons.CreditCard} />
        </div>
        <div className="flex-1 min-w-[160px] max-w-[calc(50%-12px)] lg:max-w-none">
          <StatCard title="Total Clients" value={clients.length.toString()} subtext="Registered accounts" color="primary" icon={Users} />
        </div>
        <div className="flex-1 min-w-[160px] max-w-[calc(50%-12px)] lg:max-w-none">
          <StatCard title="Avg. Duration" value={`${Math.round(localMetrics.avgDuration || 0)} Days`} subtext="Per rental contract" color="success" icon={Calendar} />
        </div>
      </div>
      
      {/* MAIN CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-surface">
          <h3 className="text-theme-title font-bold text-foreground mb-1">Growth Dynamics</h3>
          <p className="text-theme-body text-muted mb-8">Monthly revenue performance and financial trajectory.</p>
          <div className="h-[320px] w-full min-h-[320px] outline-none" style={{ width: '100%', height: 320 }}>
            {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredTrends} margin={{ top: 25, right: 30, left: 0, bottom: 0 }}>
                <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.15} /><stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 13, fontWeight: 500 }} dy={12} />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'var(--color-muted)', fontSize: 13, fontWeight: 500 }} 
                          tickFormatter={(v) => v >= 1000000 ? `¢${(v / 1000000).toFixed(1)}M` : `¢${v / 1000}k`} 
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="revenue" stroke="var(--color-secondary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)">
                            <LabelList dataKey="revenue" content={<RenderCustomLabel />} />
                        </Area>
              </AreaChart>
            </ResponsiveContainer>
            ) : <div className="w-full h-full bg-background animate-pulse rounded-xl"></div>}
          </div>
        </Card>

        <Card className="border-border bg-surface">
           <div className="flex justify-between items-start mb-8">
             <div>
                <h3 className="text-theme-title font-bold text-foreground mb-1">Operational Volume</h3>
                <p className="text-theme-body text-muted">
                  Monthly historical booking frequency.
                </p>
             </div>
             <select value={volumeRange} onChange={(e) => setVolumeRange(e.target.value)} className="bg-background border border-border text-muted text-theme-caption font-black uppercase tracking-wider rounded-lg px-3 py-1.5 outline-none focus:border-primary transition-all cursor-pointer">
                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(m => <option key={m} value={m.toString()}>{m} Months</option>)}
                <option value="All">All Time</option>
             </select>
          </div>
          <div className="h-[320px] w-full min-h-[320px] outline-none" style={{ width: '100%', height: 320 }}>
            {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 13, fontWeight: 500 }} dy={12} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-muted)', fontSize: 13, fontWeight: 500 }}
                  label={{ value: 'Bookings', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle', fill: 'var(--color-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' } }}
                />
                <RechartsTooltip 
                    content={<CustomTooltip />} 
                    cursor={{ fill: 'var(--color-secondary)', fillOpacity: 0.05 }}
                />
                <Bar 
                    dataKey="orders" 
                    fill="var(--color-primary)" 
                    radius={[4, 4, 0, 0]} 
                    barSize={30}
                    activeBar={<Rectangle stroke="var(--color-primary)" strokeWidth={1} fillOpacity={0.8} />}
                >
                    <LabelList dataKey="orders" position="top" style={{ fill: 'var(--color-muted)', fontSize: '12px', fontWeight: 500 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            ) : <div className="w-full h-full bg-background animate-pulse rounded-xl"></div>}
          </div>
        </Card>
      </div>

      {/* BOTTOM VISUALS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border bg-surface flex flex-col">
          <h3 className="text-theme-title font-bold text-foreground mb-1">Return Performance</h3>
          <p className="text-theme-body text-muted mb-6">Order distribution by return condition</p>
          <div className="h-[260px] w-full relative min-h-[260px] outline-none" style={{ width: '100%', height: 260 }}>
            {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie 
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={returnStatusData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={85} 
                        paddingAngle={5} 
                        dataKey="value" 
                        stroke="var(--color-surface)"
                        strokeWidth={2}
                        label={RenderPieLabel}
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(-1)}
                    >
                        {returnStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-muted)' }} />
                </PieChart>
            </ResponsiveContainer>
            ) : <div className="w-full h-full bg-background animate-pulse rounded-xl"></div>}
          </div>
        </Card>

        <Card className="border-border bg-surface flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-theme-title font-bold text-foreground mb-1">Top {usageType}</h3>
                <p className="text-theme-body text-muted">Ranking by frequency</p>
            </div>
            <div className="flex items-center p-1 bg-background rounded-xl border border-border shadow-sm">
                <button 
                    onClick={() => setUsageType('Categories')}
                    className={`p-2 rounded-lg transition-all ${usageType === 'Categories' ? 'bg-secondary text-primary-text shadow-md' : 'text-muted hover:text-foreground'}`}
                    title="View Top Categories"
                >
                    <BarIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setUsageType('Items')}
                    className={`p-2 rounded-lg transition-all ${usageType === 'Items' ? 'bg-secondary text-primary-text shadow-md' : 'text-muted hover:text-foreground'}`}
                    title="View Top Items"
                >
                    <Package className="w-4 h-4" />
                </button>
            </div>
          </div>
          <div className="h-[260px] w-full relative min-h-[260px] outline-none" style={{ width: '100%', height: 260 }}>
            {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={usageRankingData} margin={{ left: 30, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 11, fontWeight: 500 }} />
                    <RechartsTooltip 
                        content={<CustomTooltip />} 
                        cursor={{ fill: 'var(--color-secondary)', fillOpacity: 0.05 }} 
                    />
                    <Bar 
                        dataKey="value" 
                        fill="var(--color-secondary)" 
                        radius={[0, 4, 4, 0]} 
                        barSize={22}
                        activeBar={<Rectangle stroke="var(--color-secondary)" strokeWidth={1} fillOpacity={0.8} />}
                    >
                        <LabelList dataKey="value" position="right" style={{ fill: 'var(--color-muted)', fontSize: '11px', fontWeight: 500 }} offset={10} />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            ) : <div className="w-full h-full bg-background animate-pulse rounded-xl"></div>}
          </div>
        </Card>
        
        <Card className="border-border bg-surface flex flex-col overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-theme-title font-bold text-foreground mb-1">System Insights</h3>
                    <p className="text-theme-body text-muted">Automated performance highlights</p>
                </div>
                <div className="p-2 bg-secondary/10 border border-secondary/20 rounded-xl text-secondary shadow-sm">
                    <Icons.Sparkles className="w-5 h-5" />
                </div>
            </div>

            <div className="flex-1 space-y-1">
                {rotatedInsights.length > 0 ? rotatedInsights.map((fact, idx) => (
                    <div key={idx} className="p-3 bg-transparent dark:bg-background/50 hover:bg-background/50 dark:hover:bg-background rounded-2xl border border-transparent dark:border-border transition-all group cursor-default">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className={`p-1.5 rounded-lg ${fact.bg}`}>
                                <fact.icon className={`w-4 h-4 ${fact.color}`} />
                            </div>
                            <p className={`text-theme-subtitle font-bold ${fact.color} tracking-tight`}>{fact.title}</p>
                        </div>
                        <p className="text-theme-body text-muted leading-relaxed font-medium group-hover:text-foreground transition-colors">{fact.desc}</p>
                    </div>
                )) : <div className="text-center py-12 text-muted italic text-theme-body">No significant data patterns found for this segment.</div>}
            </div>
        </Card>
      </div>
    </div>
  );
}
