import React, { useState, useMemo } from 'react';
import {
    useReactTable, getCoreRowModel, getSortedRowModel,
    getPaginationRowModel, flexRender,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';

type SortingState = { id: string; desc: boolean }[];
import { Search, Filter, Plus, Grid, List, ChevronRight, Trash2, ChevronsUpDown } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { getJobs, deleteJob } from '../services/recruiterApi';
import type { Job } from '../services/recruiterApi';
import JobCard from '../components/jobs/JobCard';
import AIHealthCard from '../components/jobs/AIHealthCard';
import type { WorkspaceType } from './RecruiterDashboard';
import './JobListingsPage.css';

interface Props { onNavigate: (ws: WorkspaceType) => void; }

const STATUS_FILTERS = ['All', 'Active', 'Closed', 'Draft'];

const JobListingsPage: React.FC<Props> = ({ onNavigate }) => {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [filterOpen, setFilterOpen] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([]);

    const { data, loading, error, refetch } = useFetch(() => getJobs({ limit: 200 }));
    const jobs: Job[] = data?.jobs ?? [];

    // Client-side filter
    const filtered = useMemo(() => {
        return jobs.filter(j => {
            const matchStatus = statusFilter === 'All' || j.status === statusFilter;
            const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) ||
                j.department.toLowerCase().includes(search.toLowerCase()) ||
                j.location.toLowerCase().includes(search.toLowerCase());
            return matchStatus && matchSearch;
        });
    }, [jobs, search, statusFilter]);

    // TanStack table for list view
    const columns: ColumnDef<Job>[] = [
        { accessorKey: 'title', header: 'Role', cell: ({ getValue }) => <strong style={{ color: 'var(--text-primary)' }}>{String(getValue())}</strong> },
        { accessorKey: 'department', header: 'Department' },
        { accessorKey: 'location', header: 'Location' },
        {
            accessorKey: 'postedAt', header: 'Posted', id: 'postedAt', cell: ({ getValue }) => {
                const v = getValue() as string | null;
                if (!v) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
                const days = Math.floor((Date.now() - new Date(v).getTime()) / 86400000);
                return `${days}d ago`;
            }
        },
        { accessorKey: 'totalApplicants', header: 'Applicants' },
        {
            accessorKey: 'status', header: 'Status', cell: ({ getValue }) => {
                const s = String(getValue()).toLowerCase();
                return <span className={`job-status-badge ${s}`}>{String(getValue())}</span>;
            }
        },
        {
            id: 'actions', header: 'Actions', enableSorting: false, cell: ({ row }) => (
                <div>
                    <button className="action-btn" title="View Details" onClick={() => { }}>View</button>
                    <button className="action-btn danger" title="Delete" onClick={async () => {
                        if (window.confirm(`Delete "${row.original.title}"?`)) {
                            await deleteJob(row.original._id);
                            refetch();
                        }
                    }}>
                        <Trash2 size={12} />
                    </button>
                </div>
            )
        },
    ];

    const table = useReactTable({
        data: filtered,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    });

    return (
        <div className="jobs-page">
            {/* Topbar */}
            <div className="jobs-topbar">
                <div className="jobs-breadcrumb">
                    <span>Recruiter Portal</span>
                    <ChevronRight size={13} />
                    <span className="current">Active Job Posts</span>
                </div>
                <div className="jobs-topbar-right">
                    <div className="search-bar">
                        <Search size={14} color="var(--text-muted)" />
                        <input
                            placeholder="Search jobs..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary" onClick={() => onNavigate('jobs-new')}>
                        <Plus size={14} /> Post New Job
                    </button>
                </div>
            </div>

            <div className="jobs-page-inner">
                {/* Title row */}
                <div className="jobs-title-row">
                    <div>
                        <h1>Active Job Posts</h1>
                        <p>Manage and track your current openings across all departments.</p>
                    </div>
                    <div className="jobs-title-controls">
                        {/* View toggle */}
                        <div className="view-toggle">
                            <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>
                                <Grid size={13} style={{ marginRight: 4 }} /> Grid
                            </button>
                            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
                                <List size={13} style={{ marginRight: 4 }} /> List
                            </button>
                        </div>

                        {/* Filter */}
                        <div className="filter-wrapper">
                            <button className="btn-filter-outline" onClick={() => setFilterOpen(p => !p)}>
                                <Filter size={13} /> Filter
                            </button>
                            {filterOpen && (
                                <div className="filter-dropdown">
                                    <div className="filter-label">Status</div>
                                    {STATUS_FILTERS.map(s => (
                                        <button
                                            key={s}
                                            className={`filter-option${statusFilter === s ? ' active' : ''}`}
                                            onClick={() => { setStatusFilter(s); setFilterOpen(false); }}
                                        >{s}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && <div className="jobs-error">⚠️ {error}</div>}

                {/* Loading */}
                {loading ? (
                    <div className="jobs-grid">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 280, borderRadius: 16 }} />
                        ))}
                    </div>
                ) : filtered.length === 0 && !error ? (
                    <div className="jobs-empty-state">
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
                        <h3>No jobs found</h3>
                        <p style={{ marginBottom: '1.25rem' }}>
                            {search || statusFilter !== 'All'
                                ? 'Try adjusting your search or filter.'
                                : 'You haven\'t posted any jobs yet.'}
                        </p>
                        <button className="btn-primary" style={{ margin: '0 auto' }} onClick={() => onNavigate('jobs-new')}>
                            <Plus size={14} /> Post Your First Job
                        </button>
                    </div>
                ) : view === 'grid' ? (
                    // ─── Grid View ────────────────────────────────────────────────
                    <div className="jobs-grid">
                        {filtered.map(job => (
                            <JobCard key={job._id} job={job} onViewDetails={() => { }} />
                        ))}
                        {/* "Post a new role" dashed card */}
                        <div className="job-card-new" onClick={() => onNavigate('jobs-new')}>
                            <div className="job-card-new-icon">+</div>
                            <span>Post a New Role</span>
                        </div>
                    </div>
                ) : (
                    // ─── List View (TanStack Table) ───────────────────────────────
                    <div className="jobs-list-wrapper">
                        <table className="jobs-list-table">
                            <thead>
                                {table.getHeaderGroups().map(hg => (
                                    <tr key={hg.id}>
                                        {hg.headers.map(h => (
                                            <th key={h.id} onClick={h.column.getToggleSortingHandler()}>
                                                {flexRender(h.column.columnDef.header, h.getContext())}
                                                {{ asc: ' ▲', desc: ' ▼' }[h.column.getIsSorted() as string] ?? (
                                                    h.column.getCanSort() ? <ChevronsUpDown size={10} style={{ marginLeft: 4, opacity: 0.4, display: 'inline' }} /> : null
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Pagination */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.1rem', borderTop: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <span>
                                {table.getState().pagination.pageIndex * 10 + 1}–{Math.min((table.getState().pagination.pageIndex + 1) * 10, filtered.length)} of {filtered.length}
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 6, padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                                    onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>← Prev
                                </button>
                                <button
                                    style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 6, padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                                    onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom AI Health + Quick Breakdown (real job data) */}
                {!loading && jobs.length > 0 && (
                    <AIHealthCard jobs={jobs} />
                )}
            </div>
        </div>
    );
};

export default JobListingsPage;
