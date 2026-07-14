'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { useNotifications } from '@/context/NotificationContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  FileCheck2,
  Users2,
  Clock,
  Loader2,
  TrendingUp
} from 'lucide-react';

export default function ReportsPage() {
  const { addToast } = useNotifications();

  // Data states
  const [productivity, setProductivity] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.reports.getProductivity();
      setProductivity(data);
    } catch (err) {
      console.error('Failed to load productivity metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const url = api.reports.getExportUrl(format);
      // Trigger native browser download link
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `productivity_report.${format === 'pdf' ? 'txt' : format === 'excel' ? 'xls' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast(`Productivity ${format.toUpperCase()} report download started`, 'success');
    } catch (err) {
      addToast('Export failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Format Recharts data
  const statusData = productivity?.statusCounts?.map((s: any) => ({
    status: s.status,
    count: s.count
  })) || [];

  const COLORS = ['#6366f1', '#f59e0b', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-500" />
            <span>Productivity Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Export database timesheets and audit employee progress.</p>
        </div>

        {/* Export Buttons bar */}
        <div className="flex items-center gap-2 flex-wrap select-none">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1 bg-card border border-card-border hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>
          
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1 bg-card border border-card-border hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <FileSpreadsheet size={13} className="text-emerald-500" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition"
          >
            <FileText size={13} />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Grid of chart & details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Status completion ratio bar graph */}
        <div className="lg:col-span-2 p-5 bg-card border border-card-border rounded-2xl flex flex-col h-80 text-left">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-indigo-500" />
            <span>Tasks Counts by Status Lane</span>
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="status" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Workspace Totals summary card */}
        <div className="p-5 bg-card border border-card-border rounded-2xl space-y-4 text-left select-none">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metrics Highlights</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-indigo-950 flex items-center justify-center text-indigo-400 shrink-0">
                <FileCheck2 size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Completed Tasks</span>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {productivity?.userProductivity?.reduce((acc: number, u: any) => acc + (u.completedTasks || 0), 0) || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-emerald-950 flex items-center justify-center text-emerald-400 shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Billable Time Tracked</span>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {productivity?.userProductivity?.reduce((acc: number, u: any) => acc + (u.totalActualHours || 0), 0).toFixed(1) || 0} hrs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff performance tablesheet */}
      <div className="p-5 bg-card border border-card-border rounded-2xl text-left">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Users2 size={14} className="text-indigo-500" />
          <span>Staff Workspace Performance Timesheet</span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/30 text-slate-400 border-b border-card-border uppercase font-bold text-[9px] tracking-wider select-none">
                <th className="p-3">Staff Name</th>
                <th className="p-3">Permission Role</th>
                <th className="p-3">Total Tasks Logged</th>
                <th className="p-3">Completed Tasks</th>
                <th className="p-3">Completion Ratio</th>
                <th className="p-3">Logged Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {productivity?.userProductivity?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-405">No staff records logged.</td>
                </tr>
              ) : (
                productivity?.userProductivity?.map((staff: any, idx: number) => {
                  const percent = staff.totalTasks > 0 ? Math.round((staff.completedTasks / staff.totalTasks) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition">
                      <td className="p-3 font-semibold text-foreground">{staff.assignedUser?.name || 'Unknown Staff'}</td>
                      <td className="p-3 text-slate-400">{staff.assignedUser?.role || 'Employee'}</td>
                      <td className="p-3 text-slate-400">{staff.totalTasks}</td>
                      <td className="p-3 text-slate-400">{staff.completedTasks}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden select-none">
                            <div className="bg-indigo-500 h-full" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="font-semibold text-[10px] text-slate-400">{percent}%</span>
                        </div>
                      </td>
                      <td className="p-3 font-bold text-foreground">{(staff.totalActualHours || 0).toFixed(2)} hrs</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
