import { useState, useEffect } from 'react';
import {
  Calendar,
  Bus,
  Building2,
  MapPin,
  IndianRupee,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardBody, CardHeader } from '../../../components/Card';
import LoadingSpinner from '../../../components/LoadingSpinner';
import api from '../../../services/api';
import './AdminDashboard.css';

const COLORS = ['#667eea', '#28a745', '#ffc107', '#dc3545'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data.data.stats);
      setRecentBookings(data.data.recentBookings || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const bookingStatusData = [
    { name: 'Pending', value: stats?.bookingsByStatus?.pending || 0 },
    { name: 'Confirmed', value: stats?.bookingsByStatus?.confirmed || 0 },
    { name: 'Completed', value: stats?.bookingsByStatus?.completed || 0 },
    { name: 'Cancelled', value: stats?.bookingsByStatus?.cancelled || 0 },
  ];

  const monthlyData = stats?.monthlyBookings || [];

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="stats-grid">
        <Card className="stat-card">
          <CardBody>
            <div className="stat-icon bookings">
              <Calendar size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats?.totalBookings || 0}</span>
              <span className="stat-label">Total Bookings</span>
            </div>
          </CardBody>
        </Card>

        <Card className="stat-card">
          <CardBody>
            <div className="stat-icon revenue">
              <IndianRupee size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-number">
                ₹{(stats?.totalRevenue || 0).toLocaleString()}
              </span>
              <span className="stat-label">Total Revenue</span>
            </div>
          </CardBody>
        </Card>

        <Card className="stat-card">
          <CardBody>
            <div className="stat-icon buses">
              <Bus size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats?.totalBuses || 0}</span>
              <span className="stat-label">Active Buses</span>
            </div>
          </CardBody>
        </Card>

        <Card className="stat-card">
          <CardBody>
            <div className="stat-icon users">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats?.totalUsers || 0}</span>
              <span className="stat-label">Registered Users</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <Card className="chart-card">
          <CardHeader>
            <h3>Monthly Bookings</h3>
          </CardHeader>
          <CardBody>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#667eea" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card className="chart-card pie-chart">
          <CardHeader>
            <h3>Booking Status</h3>
          </CardHeader>
          <CardBody>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={bookingStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {bookingStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <h3>Recent Bookings</h3>
        </CardHeader>
        <CardBody>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Institution</th>
                  <th>Destination</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                      No bookings yet
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <code>{booking._id.slice(-8)}</code>
                      </td>
                      <td>{booking.user?.organization || booking.user?.name || '-'}</td>
                      <td>{booking.tripDetails?.destination || '-'}</td>
                      <td>
                        {booking.tripDetails?.startDate
                          ? new Date(booking.tripDetails.startDate).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>₹{booking.payment?.amount?.toLocaleString() || 0}</td>
                      <td>
                        <span className={`status-badge ${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
