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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] overflow-y-auto">
            <div className="min-h-screen p-4">
                <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-2xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Shield className="w-8 h-8" />
                                <div>
                                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                                    <p className="text-sm text-blue-100">Municipal Waste Management System</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border-2 border-yellow-200">
                            <div className="flex items-center gap-3">
                                <Clock className="w-8 h-8 text-yellow-600" />
                                <div>
                                    <div className="text-2xl font-bold text-yellow-900">{stats.pending || 0}</div>
                                    <div className="text-sm text-yellow-700">Pending</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-8 h-8 text-blue-600" />
                                <div>
                                    <div className="text-2xl font-bold text-blue-900">{stats.inProgress || 0}</div>
                                    <div className="text-sm text-blue-700">In Progress</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                                <div>
                                    <div className="text-2xl font-bold text-green-900">{stats.resolved || 0}</div>
                                    <div className="text-sm text-green-700">Resolved</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-8 h-8 text-purple-600" />
                                <div>
                                    <div className="text-2xl font-bold text-purple-900">{stats.total || 0}</div>
                                    <div className="text-sm text-purple-700">Total Reports</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Export */}
                    <div className="px-6 pb-4 flex flex-wrap gap-3 items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                                    }`}
                            >
                                All ({stats.total || 0})
                            </button>
                            <button
                                onClick={() => setFilter('pending')}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700'
                                    }`}
                            >
                                Pending ({stats.pending || 0})
                            </button>
                            <button
                                onClick={() => setFilter('in-progress')}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${filter === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                                    }`}
                            >
                                In Progress ({stats.inProgress || 0})
                            </button>
                            <button
                                onClick={() => setFilter('resolved')}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${filter === 'resolved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'
                                    }`}
                            >
                                Resolved ({stats.resolved || 0})
                            </button>
                        </div>

                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>

                    {/* Reports Table */}
                    <div className="px-6 pb-6">
                        <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
                            {loading ? (
                                <div className="p-12 text-center">
                                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                                    <p className="text-gray-600 mt-4">Loading reports...</p>
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    No reports found for this filter.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Upvotes</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {reports.map((report) => (
                                                <tr key={report.id} className="hover:bg-gray-50 transition">
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-sm text-gray-600">#{report.id}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold text-white ${getTypeColor(report.type)}`}>
                                                            {report.type.replace('-', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1 text-sm text-gray-700">
                                                            <MapPin className="w-3 h-3" />
                                                            {report.location_name}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(report.status)}`}>
                                                            {report.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        👍 {report.upvotes}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {new Date(report.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => setSelectedReport(report)}
                                                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                                                        >
                                                            Manage →
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold">Report #{selectedReport.id}</h2>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Type</label>
                                <div className={`inline-block px-3 py-1 rounded mt-1 text-white ${getTypeColor(selectedReport.type)}`}>
                                    {selectedReport.type.replace('-', ' ')}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-600">Location</label>
                                <p className="text-gray-800">{selectedReport.location_name}</p>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-600">Description</label>
                                <p className="text-gray-800">{selectedReport.description}</p>
                            </div>

                            {selectedReport.image_url && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Photo</label>
                                    <img
                                        src={selectedReport.image_url}
                                        alt="Report"
                                        className="w-full h-64 object-cover rounded-lg mt-2"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Status</label>
                                    <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 border ${getStatusColor(selectedReport.status)}`}>
                                        {selectedReport.status}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Upvotes</label>
                                    <p className="text-gray-800">👍 {selectedReport.upvotes}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-600">Coordinates</label>
                                <p className="text-gray-800 font-mono text-sm">
                                    {selectedReport.latitude}, {selectedReport.longitude}
                                </p>
                            </div>

                            <div className="pt-4 border-t space-y-3">
                                <label className="text-sm font-semibold text-gray-600 block">Update Status</label>

                                {selectedReport.status !== 'in-progress' && (
                                    <button
                                        onClick={() => updateReportStatus(selectedReport.id, 'in-progress')}
                                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                                    >
                                        Mark as In Progress
                                    </button>
                                )}

                                {selectedReport.status !== 'resolved' && (
                                    <button
                                        onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
                                    >
                                        Mark as Resolved ✓
                                    </button>
                                )}

                                {selectedReport.status !== 'pending' && (
                                    <button
                                        onClick={() => updateReportStatus(selectedReport.id, 'pending')}
                                        className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition"
                                    >
                                        Move Back to Pending
                                    </button>
                                )}

                                <button
                                    onClick={() => deleteReport(selectedReport.id)}
                                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
                                >
                                    Delete Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
