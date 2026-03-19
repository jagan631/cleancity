import React, { useState, useEffect } from 'react';
import {
    Shield,
    CheckCircle,
    Clock,
    AlertTriangle,
    TrendingUp,
    Users,
    MapPin,
    Calendar,
    Filter,
    Download,
    X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminDashboard({ onClose }) {
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        loadReports();
        loadStats();
    }, [filter]);

    const loadReports = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('waste_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const { data, error } = await supabase
                .from('waste_reports')
                .select('status, type');

            if (error) throw error;

            const stats = {
                total: data.length,
                pending: data.filter(r => r.status === 'pending').length,
                inProgress: data.filter(r => r.status === 'in-progress').length,
                resolved: data.filter(r => r.status === 'resolved').length,
                byType: {
                    overflowing: data.filter(r => r.type === 'overflowing').length,
                    'illegal-dump': data.filter(r => r.type === 'illegal-dump').length,
                    litter: data.filter(r => r.type === 'litter').length,
                    recycling: data.filter(r => r.type === 'recycling').length
                }
            };

            setStats(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const updateReportStatus = async (reportId, newStatus) => {
        try {
            const updates = {
                status: newStatus
            };

            if (newStatus === 'resolved') {
                updates.resolved_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('waste_reports')
                .update(updates)
                .eq('id', reportId);

            if (error) throw error;

            alert(`Report #${reportId} status updated to: ${newStatus}`);
            loadReports();
            loadStats();
            setSelectedReport(null);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const deleteReport = async (reportId) => {
        if (!confirm('Are you sure you want to delete this report?')) return;

        try {
            const { error } = await supabase
                .from('waste_reports')
                .delete()
                .eq('id', reportId);

            if (error) throw error;

            alert('Report deleted successfully');
            loadReports();
            loadStats();
            setSelectedReport(null);
        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Failed to delete report');
        }
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Type', 'Status', 'Location', 'Description', 'Upvotes', 'Created At'];
        const rows = reports.map(r => [
            r.id,
            r.type,
            r.status,
            r.location_name,
            r.description,
            r.upvotes,
            new Date(r.created_at).toLocaleDateString()
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `waste-reports-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const getTypeColor = (type) => {
        const colors = {
            'overflowing': 'bg-orange-500',
            'illegal-dump': 'bg-red-500',
            'litter': 'bg-yellow-500',
            'recycling': 'bg-green-500'
        };
        return colors[type] || 'bg-gray-500';
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
            'resolved': 'bg-green-100 text-green-800 border-green-300'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] overflow-y-auto animate-fade-in">
            <div className="min-h-screen p-4 flex items-center justify-center">
                <div className="max-w-7xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-white/20">
                    {/* Enhanced Header with Animated Background */}
                    <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white p-6 sm:p-8 overflow-hidden">
                        {/* Animated background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-float"></div>
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
                        </div>

                        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4 animate-slide-down">
                                <div className="relative flex-shrink-0">
                                    <Shield className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse-slow" />
                                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse-slow"></div>
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">Admin Dashboard</h1>
                                    <p className="text-blue-100 text-xs sm:text-sm font-medium opacity-90">Municipal Waste Management Command Center</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="absolute top-0 right-0 sm:relative sm:top-auto sm:right-auto group bg-white/10 hover:bg-white/20 p-2 sm:p-2.5 rounded-xl transition-all duration-300 hover:rotate-90"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {/* Enhanced Stats Cards with staggered animations */}
                    <div className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 bg-gray-50/50">
                        <div className="group bg-white rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover-lift border-2 border-transparent hover:border-yellow-200 animate-slide-up">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-bold text-gray-800 group-hover:text-yellow-600 transition-colors">{stats.pending || 0}</div>
                                    <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Pending</div>
                                </div>
                            </div>
                        </div>

                        <div className="group bg-white rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover-lift border-2 border-transparent hover:border-blue-200 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{stats.inProgress || 0}</div>
                                    <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">In Progress</div>
                                </div>
                            </div>
                        </div>

                        <div className="group bg-white rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover-lift border-2 border-transparent hover:border-green-200 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">{stats.resolved || 0}</div>
                                    <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Resolved</div>
                                </div>
                            </div>
                        </div>

                        <div className="group bg-white rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover-lift border-2 border-transparent hover:border-purple-200 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">{stats.total || 0}</div>
                                    <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Total Reports</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and List Section */}
                    <div className="p-4 sm:p-8">
                        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-6">
                            <div className="flex bg-gray-100 p-1 rounded-2xl gap-1 overflow-x-auto scrollbar-hide">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${filter === 'all' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    All ({stats.total || 0})
                                </button>
                                <button
                                    onClick={() => setFilter('pending')}
                                    className={`px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${filter === 'pending' ? 'bg-white text-yellow-600 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Pending ({stats.pending || 0})
                                </button>
                                <button
                                    onClick={() => setFilter('in-progress')}
                                    className={`px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${filter === 'in-progress' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Progress ({stats.inProgress || 0})
                                </button>
                                <button
                                    onClick={() => setFilter('resolved')}
                                    className={`px-4 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${filter === 'resolved' ? 'bg-white text-green-600 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Resolved ({stats.resolved || 0})
                                </button>
                            </div>

                            <button
                                onClick={exportToCSV}
                                className="group flex items-center justify-center gap-2.5 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all hover-lift text-sm"
                            >
                                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                Export Reports
                            </button>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-inner">
                            {loading ? (
                                <div className="p-12 sm:p-20 text-center animate-fade-in">
                                    <div className="relative inline-block mb-4">
                                        <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl animate-pulse"></div>
                                        <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 animate-spin-slow relative z-10" />
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-600 font-bold animate-pulse">Synchronizing database...</p>
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="p-8 sm:p-12 text-center text-gray-500 animate-fade-in">
                                    No reports found for this filter.
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">ID</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Location</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Upvotes</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {reports.map((report, index) => (
                                                    <tr
                                                        key={report.id}
                                                        className="group hover:bg-blue-50/30 transition-all duration-300 hover-lift animate-slide-up"
                                                        style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <span className="font-mono text-xs font-bold text-gray-400 group-hover:text-blue-500 transition-colors">#{String(report.id || '').substring(0, 8)}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold text-white shadow-sm ${getTypeColor(report.type)}`}>
                                                                {report.type.replace('-', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                                <MapPin className="w-4 h-4 text-blue-500" />
                                                                {report.location_name}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusColor(report.status)} shadow-sm`}>
                                                                {report.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-1.5 font-bold text-gray-700">
                                                                <span className="text-blue-500 text-lg">👍</span>
                                                                {report.upvotes}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-semibold text-gray-500">
                                                            {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => setSelectedReport(report)}
                                                                className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-sm transition-all duration-300"
                                                            >
                                                                Manage →
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden divide-y divide-gray-100">
                                        {reports.map((report, index) => (
                                            <div
                                                key={report.id}
                                                className="p-4 sm:p-6 hover:bg-gray-50 transition-colors animate-slide-up"
                                                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="font-mono text-[10px] font-bold text-gray-400">#{String(report.id || '').substring(0, 8)}</span>
                                                        <span className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm ${getTypeColor(report.type)}`}>
                                                            {report.type.replace('-', ' ').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 font-bold text-gray-700">
                                                        <span className="text-blue-500">👍</span>
                                                        <span className="text-sm">{report.upvotes}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-start gap-2 text-sm font-medium text-gray-700">
                                                        <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                        <span className="line-clamp-1">{report.location_name}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border-2 ${getStatusColor(report.status)}`}>
                                                            {report.status.toUpperCase()}
                                                        </span>
                                                        <span className="text-xs font-semibold text-gray-500">
                                                            {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>

                                                    <button
                                                        onClick={() => setSelectedReport(report)}
                                                        className="w-full mt-2 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-sm transition-all duration-300"
                                                    >
                                                        Manage Report →
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[3000] p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="flex justify-between items-start mb-6 sticky top-0 bg-white z-10 py-2 border-b">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate pr-4">Report Details</h2>
                                <p className="text-xs font-mono text-gray-400 font-bold mt-1">ID: #{selectedReport.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Issue Type</label>
                                        <div className={`w-fit px-3 py-1.5 rounded-lg mt-1.5 text-xs font-bold text-white shadow-sm ${getTypeColor(selectedReport.type)}`}>
                                            {selectedReport.type.replace('-', ' ').toUpperCase()}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Current Status</label>
                                        <div className={`w-fit px-4 py-1.5 rounded-full text-xs font-bold mt-1.5 border-2 ${getStatusColor(selectedReport.status)} shadow-sm`}>
                                            {selectedReport.status.toUpperCase()}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Community Support</label>
                                        <div className="flex items-center gap-2 mt-1.5 font-bold text-gray-800">
                                            <span className="text-xl">👍</span>
                                            <span>{selectedReport.upvotes} Upvotes</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Location</label>
                                        <div className="flex items-start gap-2 mt-1.5 text-sm font-medium text-gray-700">
                                            <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                            <span>{selectedReport.location_name}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Coordinates</label>
                                        <p className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit mt-1.5">
                                            {Number(selectedReport.latitude).toFixed(6)}, {Number(selectedReport.longitude).toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Description</label>
                                <p className="text-gray-700 mt-2 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    {selectedReport.description}
                                </p>
                            </div>

                            {selectedReport.image_url && (
                                <div className="border-t pt-6">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Attached Photo</label>
                                    <div className="mt-3 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-lg group">
                                        <img
                                            src={selectedReport.image_url}
                                            alt="Report Evidence"
                                            className="w-full h-auto max-h-[400px] object-cover hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 border-t space-y-3">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 block">Action Command Center</label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {selectedReport.status !== 'in-progress' && (
                                        <button
                                            onClick={() => updateReportStatus(selectedReport.id, 'in-progress')}
                                            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all hover-lift"
                                        >
                                            Mark In Progress
                                        </button>
                                    )}

                                    {selectedReport.status !== 'resolved' && (
                                        <button
                                            onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                                            className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-all hover-lift"
                                        >
                                            Mark Resolved ✓
                                        </button>
                                    )}

                                    {selectedReport.status !== 'pending' && (
                                        <button
                                            onClick={() => updateReportStatus(selectedReport.id, 'pending')}
                                            className="px-6 py-3 bg-yellow-500 text-white rounded-xl font-bold text-sm hover:bg-yellow-600 transition-all hover-lift"
                                        >
                                            Back to Pending
                                        </button>
                                    )}

                                    <button
                                        onClick={() => deleteReport(selectedReport.id)}
                                        className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all hover-lift sm:col-span-2"
                                    >
                                        Delete Forever
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
