import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Trash2, Recycle, Award, X, TrendingUp, CheckCircle, Shield, LogOut, LogIn, Clock, Users } from 'lucide-react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import WasteMap from './components/Map';
import ImageUpload from './components/ImageUpload';
import AdminDashboard from './components/AdminDashboard';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import { useAdmin } from './hooks/useAdmin';

const WasteMapApp = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState('map');
  const [showReportForm, setShowReportForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [reports, setReports] = useState([]);
  const [recyclingCenters, setRecyclingCenters] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [notification, setNotification] = useState(null);
  const [session, setSession] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    type: 'overflowing',
    description: '',
    latitude: null,
    longitude: null,
    location_name: '',
    image_url: null
  });

  // Load data when component mounts
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    loadReports();
    loadRecyclingCenters();
    getUserLocation();

    return () => subscription.unsubscribe();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('waste_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      showNotification('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRecyclingCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('recycling_centers')
        .select('*');

      if (error) throw error;
      setRecyclingCenters(data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng
          }));
        },
        (error) => {
          console.log('Location access denied, using default Delhi coordinates');
          setFormData(prev => ({
            ...prev,
            latitude: 28.6139,
            longitude: 77.2090
          }));
        }
      );
    }
  };

  const handleSubmitReport = async () => {
    if (!formData.description.trim()) {
      showNotification('Please enter a description', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('waste_reports')
        .insert([{
          type: formData.type,
          description: formData.description,
          latitude: formData.latitude || 28.6139,
          longitude: formData.longitude || 77.2090,
          location_name: formData.location_name || 'Unknown Location',
          status: 'pending',
          upvotes: 0,
          image_url: formData.image_url,
          user_id: user?.id || null
        }])
        .select();

      if (error) throw error;

      showNotification('Report submitted successfully! 🎉', 'success');
      setShowReportForm(false);
      setFormData({
        type: 'overflowing',
        description: '',
        latitude: userLocation?.lat || 28.6139,
        longitude: userLocation?.lng || 77.2090,
        location_name: '',
        image_url: null
      });
      loadReports();
      setActiveTab('reports');
    } catch (error) {
      console.error('Error submitting report:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      });
      showNotification('Failed to submit report: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (reportId) => {
    try {
      const report = reports.find(r => r.id === reportId);
      const newUpvotes = report.upvotes + 1;

      const { error } = await supabase
        .from('waste_reports')
        .update({ upvotes: newUpvotes })
        .eq('id', reportId);

      if (error) throw error;

      setReports(reports.map(r =>
        r.id === reportId ? { ...r, upvotes: newUpvotes } : r
      ));

      showNotification('Upvoted! 👍', 'success');
    } catch (error) {
      console.error('Error upvoting:', error);
      showNotification('Failed to upvote', 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredReports = filter === 'all'
    ? reports
    : reports.filter(r => r.type === filter);

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
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'resolved': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTimeAgo = (timestamp) => {
    const hours = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    users: 247
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Auth onAuthSuccess={() => { }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-2xl ${notification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
          notification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
            'bg-gradient-to-r from-blue-500 to-indigo-500'
          } text-white flex items-center gap-3 animate-slide-down border-2 border-white/20 backdrop-blur-sm`}>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-scale-in">
            {notification.type === 'success' && <CheckCircle className="w-6 h-6 animate-bounce" />}
            {notification.type === 'error' && <X className="w-6 h-6 animate-bounce" />}
          </div>
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Enhanced Header with Animated Background */}
      <header className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-2xl overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Header content */}
        <div className="relative container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            {/* Logo with animation */}
            <div className="flex items-center gap-3 animate-slide-down">
              <div className="relative">
                <Recycle className="w-10 h-10 animate-pulse-slow" />
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse-slow"></div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Clean<span className="text-emerald-200">City</span>
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                  Community Waste Mapping Platform
                </p>
              </div>
            </div>

            {/* Action buttons with animations */}
            <div className="flex items-center gap-2 animate-slide-down" style={{ animationDelay: '0.1s' }}>
              <button
                onClick={() => {
                  getUserLocation();
                  setShowReportForm(true);
                }}
                className="group relative bg-white text-green-600 px-4 sm:px-6 py-2.5 rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 flex items-center gap-2 overflow-hidden hover-lift"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Report Issue</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setShowAdminDashboard(true)}
                  className="group relative bg-blue-600 text-white px-3 sm:px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-2xl hover-lift"
                  title="Admin Dashboard"
                >
                  <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="hidden lg:inline">Admin</span>
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/30">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg animate-scale-in">
                      {user.user_metadata?.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold">
                      {user.user_metadata?.username || user.email.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to logout?')) {
                        await signOut();
                        setShowAdminDashboard(false);
                        showNotification('Logged out successfully', 'success');
                      }
                    }}
                    className="group bg-red-500 text-white px-3 sm:px-4 py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-2xl hover-lift"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="group bg-blue-600 text-white px-3 sm:px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-2xl hover-lift"
                >
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400"></div>
      </header>

      {/* Enhanced Stats Bar with Animations */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b shadow-inner">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Reports Card */}
            <div className="group bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 hover-lift border-2 border-transparent hover:border-purple-200 animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                    {stats.total}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Total Reports</div>
                </div>
              </div>
            </div>

            {/* Pending Card */}
            <div className="group bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 hover-lift border-2 border-transparent hover:border-yellow-200 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-white" />
                  {stats.pending > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center pulse-dot">
                      {stats.pending}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800 group-hover:text-yellow-600 transition-colors">
                    {stats.pending}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Pending</div>
                </div>
              </div>
            </div>

            {/* Resolved Card */}
            <div className="group bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 hover-lift border-2 border-transparent hover:border-green-200 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                    {stats.resolved}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Resolved</div>
                </div>
              </div>
            </div>

            {/* Active Users Card */}
            <div className="group bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 hover-lift border-2 border-transparent hover:border-blue-200 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {stats.users}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Active Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('map')}
              className={`relative py-4 px-4 sm:px-6 font-semibold transition-all duration-300 whitespace-nowrap group ${activeTab === 'map'
                ? 'text-green-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className={`w-5 h-5 ${activeTab === 'map' ? 'animate-bounce' : 'group-hover:scale-110'} transition-transform`} />
                <span className="text-sm sm:text-base">Map</span>
              </div>
              {activeTab === 'map' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-full animate-slide-up"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`relative py-4 px-4 sm:px-6 font-semibold transition-all duration-300 whitespace-nowrap group ${activeTab === 'reports'
                ? 'text-green-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <div className="flex items-center gap-2">
                <Trash2 className={`w-5 h-5 ${activeTab === 'reports' ? 'animate-bounce' : 'group-hover:scale-110'} transition-transform`} />
                <span className="text-sm sm:text-base">Reports</span>
                {stats.pending > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                    {stats.pending}
                  </span>
                )}
              </div>
              {activeTab === 'reports' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-full animate-slide-up"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('awareness')}
              className={`relative py-4 px-4 sm:px-6 font-semibold transition-all duration-300 whitespace-nowrap group ${activeTab === 'awareness'
                ? 'text-green-600'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <div className="flex items-center gap-2">
                <Award className={`w-5 h-5 ${activeTab === 'awareness' ? 'animate-bounce' : 'group-hover:scale-110'} transition-transform`} />
                <span className="text-sm sm:text-base">Learn</span>
              </div>
              {activeTab === 'awareness' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-full animate-slide-up"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {/* Main Content with Background Pattern */}
      <main className="relative min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative container mx-auto px-4 py-6">
          {/* Report Form Modal */}
          {showReportForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
              <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Report Waste Issue</h2>
                  <button
                    onClick={() => setShowReportForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Issue Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="overflowing">Overflowing Bin</option>
                      <option value="illegal-dump">Illegal Dumping</option>
                      <option value="litter">Litter Spot</option>
                      <option value="recycling">Recycling Point</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Location Name</label>
                    <input
                      type="text"
                      value={formData.location_name}
                      onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Near Metro Station, Market Area"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows="3"
                      placeholder="Describe the waste issue in detail..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Location</label>
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
                      <MapPin className="w-4 h-4 text-green-600" />
                      {userLocation ? (
                        <span className="text-green-700">✓ Current location detected</span>
                      ) : (
                        <span>Using default location (Delhi)</span>
                      )}
                    </div>
                  </div>

                  <ImageUpload
                    currentImage={formData.image_url}
                    onImageUploaded={(url) => {
                      setFormData({ ...formData, image_url: url });
                    }}
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowReportForm(false)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    disabled={submitting || !formData.description.trim()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                  >
                    {submitting ? (
                      <>
                        <Recycle className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-green-200 rounded-full blur-2xl animate-pulse"></div>
                <Recycle className="w-16 h-16 text-green-600 animate-spin-slow relative z-10" />
              </div>
              <div className="flex gap-1.5 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <p className="text-gray-600 font-medium animate-pulse">Scanning for waste issues...</p>
            </div>
          ) : (
            <>
              {/* Map View */}
              {activeTab === 'map' && (
                <div>
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm transition ${filter === 'all' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300'
                        }`}
                    >
                      All ({reports.length})
                    </button>
                    <button
                      onClick={() => setFilter('overflowing')}
                      className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm transition ${filter === 'overflowing' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
                        }`}
                    >
                      Overflowing
                    </button>
                    <button
                      onClick={() => setFilter('illegal-dump')}
                      className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm transition ${filter === 'illegal-dump' ? 'bg-red-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:border-red-300'
                        }`}
                    >
                      Illegal Dumps
                    </button>
                    <button
                      onClick={() => setFilter('litter')}
                      className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap text-sm transition ${filter === 'litter' ? 'bg-yellow-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:border-yellow-300'
                        }`}
                    >
                      Litter
                    </button>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[500px]">
                    <WasteMap
                      reports={filteredReports}
                      center={userLocation ? [userLocation.lat, userLocation.lng] : undefined}
                    />
                  </div>
                </div>
              )}

              {/* Reports List */}
              {
                activeTab === 'reports' && (
                  <div className="space-y-4">
                    {filteredReports.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No reports yet</h3>
                        <p className="text-gray-500 mb-4">Be the first to report a waste issue in your area!</p>
                        <button onClick={() => {
                          getUserLocation();
                          setShowReportForm(true);
                        }}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                        >
                          Report First Issue
                        </button>
                      </div>
                    ) : (
                      filteredReports.map((report) => (
                        <div key={report.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover-lift border-2 border-transparent hover:border-green-200 animate-slide-up">
                          <div className="flex">
                            <div className={`w-2 ${getTypeColor(report.type)} group-hover:w-3 transition-all duration-300`}></div>
                            <div className="flex-1 p-6">
                              <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h3 className="font-bold text-xl capitalize text-gray-800 group-hover:text-green-700 transition-colors">
                                      {report.type.replace('-', ' ')}
                                    </h3>
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm animate-pulse-slow ${getStatusColor(report.status)}`}>
                                      {report.status.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
                                    <MapPin className="w-4 h-4 text-green-600" />
                                    <span className="font-medium">{report.location_name}</span>
                                  </div>
                                </div>
                                <div className="text-sm font-semibold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
                                  {getTimeAgo(report.created_at)}
                                </div>
                              </div>

                              <p className="text-gray-700 mb-4 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-500">
                                {report.description}
                              </p>

                              {report.image_url && (
                                <div className="mb-6 overflow-hidden rounded-xl border-2 border-gray-100 shadow-inner group/img">
                                  <img
                                    src={report.image_url}
                                    alt="Waste report"
                                    className="w-full h-56 object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                                    onClick={() => window.open(report.image_url, '_blank')}
                                  />
                                </div>
                              )}

                              <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-gray-100">
                                <button
                                  onClick={() => handleUpvote(report.id)}
                                  className="group/btn flex items-center gap-2.5 text-gray-600 hover:text-green-600 transition-all px-4 py-2 rounded-xl hover:bg-green-50 border border-transparent hover:border-green-100"
                                >
                                  <div className="p-1.5 bg-gray-100 group-hover/btn:bg-green-100 rounded-lg transition-colors">
                                    <TrendingUp className="w-4 h-4 group-hover/btn:scale-125 group-hover/btn:-rotate-12 transition-transform" />
                                  </div>
                                  <span className="font-bold">{report.upvotes}</span>
                                  <span className="text-sm font-medium">Community Upvotes</span>
                                </button>
                                <div className="text-xs font-mono text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md">
                                  ID: #{String(report.id || '').substring(0, 8) || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )
              }

              {/* Awareness Tab */}
              {
                activeTab === 'awareness' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Recycle className="w-6 h-6 text-green-600" />
                        Waste Segregation Guide
                      </h3>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">🟢</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">Wet Waste</h4>
                            <p className="text-sm text-gray-600">Food scraps, garden waste, organic material</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">🔵</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">Dry Waste</h4>
                            <p className="text-sm text-gray-600">Paper, plastic, metal, glass - all recyclable items</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">🔴</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">Hazardous Waste</h4>
                            <p className="text-sm text-gray-600">Batteries, electronics, medical waste, chemicals</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md p-6 text-white">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Award className="w-6 h-6" />
                        Community Impact
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur">
                          <div className="text-3xl font-bold">{reports.length}</div>
                          <div className="text-sm">Total Reports Submitted</div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur">
                          <div className="text-3xl font-bold">{stats.resolved}</div>
                          <div className="text-sm">Issues Successfully Resolved</div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur">
                          <div className="text-3xl font-bold">{stats.users}</div>
                          <div className="text-sm">Active Community Members</div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6">
                      <h3 className="text-xl font-bold mb-4">Nearby Recycling Centers</h3>
                      {recyclingCenters.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No recycling centers found</p>
                      ) : (
                        <div className="grid md:grid-cols-3 gap-4">
                          {recyclingCenters.map((center) => (
                            <div key={center.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition">
                              <h4 className="font-semibold text-gray-800 mb-2">{center.name}</h4>
                              <p className="text-sm text-gray-600 mb-2">📍 {center.hours}</p>
                              <p className="text-xs text-gray-500 mb-3">
                                <strong>Accepts:</strong> {center.accepts.join(', ')}
                              </p>
                              <button className="w-full mt-2 text-green-600 text-sm font-semibold hover:bg-green-50 py-2 rounded transition">
                                Get Directions →
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
            </>
          )}
        </div>
      </main>

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            showNotification('Welcome! You are now logged in.', 'success');
          }}
        />
      )}
    </div>
  );
};


export default WasteMapApp;