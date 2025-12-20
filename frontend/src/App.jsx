import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Trash2, Recycle, Award, X, Loader, TrendingUp, CheckCircle, Shield } from 'lucide-react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import WasteMap from './components/Map';
import ImageUpload from './components/ImageUpload';
import AdminDashboard from './components/AdminDashboard';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import { LogOut, LogIn } from 'lucide-react';
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
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          } text-white flex items-center gap-2 animate-bounce`}>
          {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* Header - Clean & Modern */}
      <header className="bg-white text-gray-800 shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab('map')}>
              <div className="bg-green-100 p-2 rounded-xl group-hover:bg-green-200 transition-colors">
                <Recycle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">CleanCity</h1>
                <p className="text-xs text-green-600 font-medium">Waste Mapping Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  getUserLocation();
                  setShowReportForm(true);
                }}
                className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-full font-semibold hover:bg-green-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-md"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Report Issue</span>
              </button>

              {/* Admin Dashboard Button - Only for Admin Users */}
              {isAdmin && (
                <button
                  onClick={() => setShowAdminDashboard(true)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
                  title="Admin Dashboard"
                >
                  <Shield className="w-6 h-6" />
                </button>
              )}

              <div className="w-px h-8 bg-gray-200 mx-1"></div>

              {/* Login/Logout Buttons */}
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2 p-1 pr-3 bg-gray-50 rounded-full border border-gray-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {user.user_metadata?.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {user.user_metadata?.username || user.email.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to logout?')) {
                        await signOut();
                        setShowAdminDashboard(false);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 font-semibold hover:text-green-600 hover:bg-green-50 rounded-full transition-all"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Reports</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs sm:text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-xs sm:text-sm text-gray-600">Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.users}</div>
              <div className="text-xs sm:text-sm text-gray-600">Active Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 sm:gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('map')}
              className={`py-4 px-3 font-semibold border-b-2 transition whitespace-nowrap ${activeTab === 'map'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <MapPin className="w-5 h-5 inline mr-1" />
              Map
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-3 font-semibold border-b-2 transition whitespace-nowrap ${activeTab === 'reports'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <Trash2 className="w-5 h-5 inline mr-1" />
              Reports
            </button>
            <button
              onClick={() => setActiveTab('awareness')}
              className={`py-4 px-3 font-semibold border-b-2 transition whitespace-nowrap ${activeTab === 'awareness'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <Award className="w-5 h-5 inline mr-1" />
              Learn
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
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
                      <Loader className="w-4 h-4 animate-spin" />
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

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-12 h-12 text-green-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading reports...</p>
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
                      <div key={report.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                        <div className="flex">
                          <div className={`w-2 ${getTypeColor(report.type)}`}></div>
                          <div className="flex-1 p-6">
                            <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h3 className="font-bold text-lg capitalize text-gray-800">
                                    {report.type.replace('-', ' ')}
                                  </h3>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                                    {report.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{report.location_name}</span>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {getTimeAgo(report.created_at)}
                              </div>
                            </div>

                            <p className="text-gray-700 mb-4">{report.description}</p>

                            {report.image_url && (
                              <div className="mb-4">
                                <img
                                  src={report.image_url}
                                  alt="Waste report"
                                  className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                                  onClick={() => window.open(report.image_url, '_blank')}
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-between flex-wrap gap-4">
                              <button
                                onClick={() => handleUpvote(report.id)}
                                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition px-3 py-2 rounded-lg hover:bg-green-50"
                              >
                                <TrendingUp className="w-5 h-5" />
                                <span className="font-semibold">{report.upvotes}</span>
                                <span className="text-sm">upvotes</span>
                              </button>
                              <div className="text-sm text-gray-500">
                                ID: #{report.id}
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