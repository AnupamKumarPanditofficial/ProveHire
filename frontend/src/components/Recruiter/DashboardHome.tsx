import React, { useState } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar,
    AreaChart, Area
} from 'recharts';
import {
    Briefcase, Users, CalendarCheck, FileText, CheckCircle2, XCircle,
    Star, TrendingUp, ChevronsUpDown, Plus, Filter
} from 'lucide-react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';

type SortingState = { id: string; desc: boolean }[];
import useFetch from '../../hooks/useFetch';
import useCountUp from '../../hooks/useCountUp';
import { getDashboardStats, getJobs, getProfile } from '../../services/recruiterApi';
import type { DashboardStats, Job, RecruiterProfile } from '../../services/recruiterApi';
import type { WorkspaceType } from '../../pages/RecruiterDashboard';
import './DashboardHome.css';

const DONUT_COLORS = ['#4f8ef7', '#7c5cf6', '#f59e0b', '#22b866', '#f75f7c'];
const BAR_HIRED = '#22b866';
const BAR_REJECTED = '#f75f7c';

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: number;
    change: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconBg, label, value, change }) => {
    const animated = useCountUp(value);
    const positive = change >= 0;
    return (
        <div className="stat-card">
            <div className="stat-card-top">
                <div className="stat-icon" style={{ background: iconBg }}>{icon}</div>
                <span className={`stat-badge ${positive ? 'positive' : 'negative'}`}>
                    {positive ? '+' : ''}{change}%
                </span>
            </div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{animated.toLocaleString()}</div>
        </div>
    );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCards: React.FC = () => (
    <div className="stat-cards-grid">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
        ))}
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
    onNavigate: (ws: WorkspaceType) => void;
}

const DashboardHome: React.FC<Props> = ({ onNavigate }) => {
    const { data: dashData, loading: dashLoading, error: dashError } = useFetch(getDashboardStats);
    const { data: jobsData, loading: jobsLoading } = useFetch(() => getJobs({ status: 'Active', limit: 100 }));
    const { data: profile } = useFetch<RecruiterProfile>(getProfile);

    const recruiterName = profile?.fullName || 'Recruiter';

    const stats: DashboardStats = dashData?.stats ?? {
        totalJobPosts: 0, activeJobs: 0, totalApplicants: 0, shortlisted: 0,
        interviewsScheduled: 0, oaSent: 0, totalHired: 0, totalRejected: 0,
    };

    const statCards = [
        { icon: <Briefcase size={18} color="#4f8ef7" />, iconBg: 'rgba(79,142,247,0.12)', label: 'Total Job Posts', value: stats.totalJobPosts, change: 12 },
        { icon: <TrendingUp size={18} color="#7c5cf6" />, iconBg: 'rgba(124,92,246,0.12)', label: 'Active Jobs', value: stats.activeJobs, change: 5 },
        { icon: <Users size={18} color="#f75f7c" />, iconBg: 'rgba(247,95,124,0.12)', label: 'Total Applicants', value: stats.totalApplicants, change: -2 },
        { icon: <Star size={18} color="#f59e0b" />, iconBg: 'rgba(245,158,11,0.12)', label: 'Shortlisted', value: stats.shortlisted, change: 15 },
        { icon: <CalendarCheck size={18} color="#22b866" />, iconBg: 'rgba(34,184,102,0.12)', label: 'Interviews Scheduled', value: stats.interviewsScheduled, change: 8 },
        { icon: <FileText size={18} color="#06b6d4" />, iconBg: 'rgba(6,182,212,0.12)', label: 'OA Sent', value: stats.oaSent, change: 10 },
        { icon: <CheckCircle2 size={18} color="#22b866" />, iconBg: 'rgba(34,184,102,0.12)', label: 'Total Hired', value: stats.totalHired, change: 4 },
        { icon: <XCircle size={18} color="#9ca3af" />, iconBg: 'rgba(156,163,175,0.1)', label: 'Total Rejected', value: stats.totalRejected, change: 2 },
    ];

    // ─── TanStack Table setup ─────────────────────────────────────────────────
    const [sorting, setSorting] = useState<SortingState>([]);

    const columns: ColumnDef<Job>[] = [
        {
            accessorKey: 'title',
            header: 'Job Role',
            cell: ({ getValue }) => (
                <span style={{ fontWeight: 600, color: 'var(--text-primary, #fff)' }}>{String(getValue())}</span>
            ),
        },
        { accessorKey: 'totalApplicants', header: 'Total Applicants' },
        { accessorKey: 'pipeline.shortlisted', header: 'Shortlisted', id: 'shortlisted' },
        { accessorKey: 'pipeline.interview', header: 'Interview', id: 'interview' },
        { accessorKey: 'pipeline.rejected', header: 'Rejected', id: 'rejected' },
        { accessorKey: 'pipeline.hired', header: 'Hired', id: 'hired' },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ getValue }) => {
                const s = String(getValue()).toLowerCase();
                return <span className={`status-badge ${s}`}>{String(getValue())}</span>;
            },
        },
    ];

    const tableData = jobsData?.jobs ?? [];

    const table = useReactTable({
        data: tableData,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    });

    // ─── Chart data ───────────────────────────────────────────────────────────
    const lineData = (dashData?.dailyApplications ?? []).map(d => ({
        date: d.date.slice(5), // MM-DD
        Applications: d.count,
    }));

    const donutData = (dashData?.applicantStatusBreakdown ?? []).filter(d => d.value > 0);
    const barData = dashData?.hiredVsRejected ?? [];

    return (
        <div className="dashboard-home">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-header-left">
                    <h1>Welcome back, {recruiterName} 👋</h1>
                    <p>Here's what's happening with your recruitment funnel today.</p>
                </div>
                <span className="version-badge">V2.4.0</span>
            </div>

            {/* Error */}
            {dashError && (
                <div className="dashboard-error">⚠️ Could not load dashboard data: {dashError}</div>
            )}

            {/* Stat Cards */}
            {dashLoading ? <SkeletonCards /> : (
                <div className="stat-cards-grid">
                    {statCards.map((card, i) => (
                        <StatCard key={i} {...card} />
                    ))}
                </div>
            )}

            {/* Active Jobs Table */}
            <div className="jobs-table-wrapper">
                <div className="jobs-table-toolbar">
                    <div className="jobs-table-toolbar-left">
                        <h3>Active Jobs</h3>
                        <p>Overview of current hiring pipelines</p>
                    </div>
                    <div className="section-actions">
                        <button className="btn-filter">
                            <Filter size={14} /> Filter
                        </button>
                        <button className="btn-post-job" onClick={() => onNavigate('jobs-list')}>
                            <Plus size={14} /> Post New Job
                        </button>
                    </div>
                </div>

                {jobsLoading ? (
                    <div style={{ padding: '2rem' }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8, borderRadius: 8 }} />
                        ))}
                    </div>
                ) : (
                    <>
                        <table className="recruiter-table">
                            <thead>
                                {table.getHeaderGroups().map(hg => (
                                    <tr key={hg.id}>
                                        {hg.headers.map(header => (
                                            <th
                                                key={header.id}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{
                                                    asc: <span className="sort-indicator">▲</span>,
                                                    desc: <span className="sort-indicator">▼</span>,
                                                }[header.column.getIsSorted() as string] ?? (
                                                        <ChevronsUpDown size={12} style={{ marginLeft: 4, opacity: 0.4 }} />
                                                    )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length}>
                                            <div className="table-empty">
                                                No active jobs yet. <button style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => onNavigate('jobs-list')}>Post your first job →</button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    table.getRowModel().rows.map(row => (
                                        <tr key={row.id}>
                                            {row.getVisibleCells().map(cell => (
                                                <td key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="table-pagination">
                            <span>
                                Showing {table.getState().pagination.pageIndex * 10 + 1}–{Math.min((table.getState().pagination.pageIndex + 1) * 10, tableData.length)} of {tableData.length} jobs
                            </span>
                            <div className="pagination-btns">
                                <button className="page-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>← Prev</button>
                                <button className="page-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next →</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                {/* Line Chart */}
                <div className="chart-card">
                    <div className="chart-card-header">
                        <h4>Applications Over Time</h4>
                        <p>Daily application count — last 30 days</p>
                    </div>
                    {lineData.every(d => d.Applications === 0) ? (
                        <div className="chart-empty">📈 No application data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={4} />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ background: '#16181d', border: '1px solid #2a2d35', borderRadius: 8, fontSize: 12 }}
                                    labelStyle={{ color: '#9ca3af' }}
                                    itemStyle={{ color: '#4f8ef7' }}
                                />
                                <Area type="monotone" dataKey="Applications" stroke="#4f8ef7" strokeWidth={2} fill="url(#lineGrad)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Donut Chart */}
                <div className="chart-card">
                    <div className="chart-card-header">
                        <h4>Applicant Status</h4>
                        <p>Breakdown by current stage</p>
                    </div>
                    {donutData.length === 0 ? (
                        <div className="chart-empty">🍩 No applicants yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={donutData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {donutData.map((_, index) => (
                                        <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#16181d', border: '1px solid #2a2d35', borderRadius: 8, fontSize: 12 }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 11, color: '#9ca3af' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Bar Chart */}
                <div className="chart-card">
                    <div className="chart-card-header">
                        <h4>Hired vs Rejected</h4>
                        <p>Per role — last 6 active jobs</p>
                    </div>
                    {barData.length === 0 ? (
                        <div className="chart-empty">📊 No data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="role" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ background: '#16181d', border: '1px solid #2a2d35', borderRadius: 8, fontSize: 12 }}
                                    labelStyle={{ color: '#9ca3af' }}
                                />
                                <Bar dataKey="hired" fill={BAR_HIRED} radius={[4, 4, 0, 0]} maxBarSize={20} />
                                <Bar dataKey="rejected" fill={BAR_REJECTED} radius={[4, 4, 0, 0]} maxBarSize={20} />
                                <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
