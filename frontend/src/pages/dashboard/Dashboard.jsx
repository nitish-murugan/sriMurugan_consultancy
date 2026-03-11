import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Bus,
  Clock,
  Download,
  Eye,
  Plus,
  IndianRupee,
  Users,
  Building,
  Utensils,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody, CardHeader } from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import api from '../../services/api';
import './Dashboard.css';

const statusVariants = {
  pending_review: 'warning',
  accepted: 'success',
  declined: 'danger',
  cancelled: 'danger',
  completed: 'info',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings/my-bookings');
      const bookingsList = data.data?.bookings || [];
      setBookings(bookingsList);

      // Calculate stats
      const now = new Date();
      const upcoming = bookingsList.filter(
        (b) => new Date(b.tripDetails?.startDate) > now && b.status !== 'cancelled'
      ).length;
      const completed = bookingsList.filter((b) => b.status === 'completed').length;

      setStats({
        total: bookingsList.length,
        upcoming,
        completed,
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const downloadInvoice = async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/invoice`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Welcome, {user?.name?.split(' ')[0]}!</h1>
            <p>Manage your industrial visit bookings</p>
          </div>
          <Link to="/booking">
            <Button icon={Plus}>New Booking</Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <Card className="stat-card">
            <CardBody>
              <div className="stat-icon total">
                <Calendar size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.total}</span>
                <span className="stat-label">Total Bookings</span>
              </div>
            </CardBody>
          </Card>
          <Card className="stat-card">
            <CardBody>
              <div className="stat-icon upcoming">
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.upcoming}</span>
                <span className="stat-label">Upcoming Trips</span>
              </div>
            </CardBody>
          </Card>
          <Card className="stat-card">
            <CardBody>
              <div className="stat-icon completed">
                <MapPin size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <h2>Your Bookings</h2>
          </CardHeader>
          <CardBody>
            {bookings.length === 0 ? (
              <EmptyState
                icon={Bus}
                title="No bookings yet"
                description="Start planning your industrial visit today!"
                action={
                  <Link to="/booking">
                    <Button icon={Plus}>Create Booking</Button>
                  </Link>
                }
              />
            ) : (
              <div className="bookings-list">
                {bookings.map((booking) => (
                  <div key={booking._id} className="booking-card">
                    <div className="booking-main">
                      <div className="booking-destination">
                        <MapPin size={20} color="var(--primary)" />
                        <div>
                          <h3>{booking.tripDetails?.destination || 'Unknown City'}</h3>
                          <span className="booking-dates">
                            {formatDate(booking.tripDetails?.startDate)} - {formatDate(booking.tripDetails?.endDate)}
                          </span>
                        </div>
                      </div>
                      <Badge variant={statusVariants[booking.status] || 'default'}>
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="booking-details">
                      <div className="booking-detail">
                        <Bus size={16} />
                        <span>{booking.transport?.bus?.type || 'Bus'} ({booking.transport?.bus?.busNumber || '-'})</span>
                      </div>
                      <div className="booking-detail">
                        <span>{booking.groupDetails?.total || 0} Participants</span>
                      </div>
                      <div className="booking-detail">
                        <IndianRupee size={14} />
                        <span>{booking.payment?.amount?.toLocaleString() || 0}</span>
                      </div>
                    </div>

                    <div className="booking-actions">
                      <Button
                        variant="ghost"
                        size="small"
                        icon={Eye}
                        onClick={() => handleViewDetails(booking)}
                      >
                        View Details
                      </Button>
                      {(booking.status === 'accepted' || booking.status === 'completed') && (
                        <Button
                          variant="outline"
                          size="small"
                          icon={Download}
                          onClick={() => downloadInvoice(booking._id)}
                        >
                          Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Booking Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Booking Details"
          size="large"
        >
          {selectedBooking && (
            <div style={{ padding: '1rem' }}>
              {/* Status Badge */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0 }}>Booking ID: {selectedBooking.bookingId || selectedBooking._id}</h3>
                <Badge variant={statusVariants[selectedBooking.status] || 'default'}>
                  {selectedBooking.status}
                </Badge>
              </div>

              {/* Trip Details */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <MapPin size={18} /> Trip Details
                </h4>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div>
                      <strong>Destination:</strong> {selectedBooking.tripDetails?.destination}
                    </div>
                    <div>
                      <strong>Duration:</strong> {selectedBooking.tripDetails?.duration} days
                    </div>
                    <div>
                      <strong>Start Date:</strong> {formatDate(selectedBooking.tripDetails?.startDate)}
                    </div>
                    <div>
                      <strong>End Date:</strong> {formatDate(selectedBooking.tripDetails?.endDate)}
                    </div>
                    <div>
                      <strong>Departure City:</strong> {selectedBooking.tripDetails?.departureCity}
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Details */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Users size={18} /> Group Details
                </h4>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div>
                      <strong>Boys:</strong> {selectedBooking.groupDetails?.boys}
                    </div>
                    <div>
                      <strong>Girls:</strong> {selectedBooking.groupDetails?.girls}
                    </div>
                    <div>
                      <strong>Staff:</strong> {selectedBooking.groupDetails?.staff}
                    </div>
                    <div>
                      <strong>Total:</strong> {selectedBooking.groupDetails?.total}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transport Details */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Bus size={18} /> Transport Details
                </h4>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div>
                      <strong>Bus Type:</strong> {selectedBooking.transport?.busType}
                    </div>
                    <div>
                      <strong>Bus Number:</strong> {selectedBooking.transport?.bus?.busNumber}
                    </div>
                    <div>
                      <strong>Capacity:</strong> {selectedBooking.transport?.bus?.capacity} seats
                    </div>
                  </div>
                </div>
              </div>

              {/* Accommodation */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Building size={18} /> Accommodation & Guide
                </h4>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div>
                      <strong>Type:</strong> {selectedBooking.accommodation?.type}
                    </div>
                    <div>
                      <strong>Guide Required:</strong> {selectedBooking.accommodation?.guideRequired ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Visit */}
              {selectedBooking.companyVisit?.selectedCompany && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem' }}>Company Visit</h4>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Company:</strong> {selectedBooking.companyVisit.selectedCompany.name}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Domain:</strong> {selectedBooking.companyVisit.domain}
                      </div>
                      {selectedBooking.companyVisit.selectedCompany.address && (
                        <div>
                          <strong>Address:</strong> {selectedBooking.companyVisit.selectedCompany.address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Visiting Spots */}
              {selectedBooking.visitingSpots && selectedBooking.visitingSpots.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem' }}>Visiting Spots ({selectedBooking.visitingSpots.length})</h4>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                      {selectedBooking.visitingSpots.map((spot, idx) => (
                        <li key={idx}>{spot.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Food Arrangement */}
              {selectedBooking.foodArrangement?.required && selectedBooking.foodArrangement?.selectedRestaurants?.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Utensils size={18} /> Food Arrangement
                  </h4>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                      {selectedBooking.foodArrangement.selectedRestaurants.map((restaurant, idx) => (
                        <li key={idx}>
                          {restaurant.name} - {restaurant.cuisine}
                          {restaurant.address && ` (${restaurant.address})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <IndianRupee size={18} /> Payment Details
                </h4>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div>
                      <strong>Amount:</strong> ₹{selectedBooking.payment?.amount?.toLocaleString()}
                    </div>
                    <div>
                      <strong>Status:</strong> {selectedBooking.payment?.status}
                    </div>
                    {selectedBooking.payment?.paidAt && (
                      <div>
                        <strong>Paid At:</strong> {formatDate(selectedBooking.payment.paidAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Driver Details (if accepted) */}
              {selectedBooking.status === 'accepted' && selectedBooking.driverDetails && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem' }}>Driver Details</h4>
                  <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                      <div>
                        <strong>Name:</strong> {selectedBooking.driverDetails.name}
                      </div>
                      <div>
                        <strong>Phone:</strong> {selectedBooking.driverDetails.phone}
                      </div>
                      <div>
                        <strong>License Number:</strong> {selectedBooking.driverDetails.licenseNumber}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Decline Reason */}
              {selectedBooking.status === 'declined' && selectedBooking.declineReason && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem' }}>Decline Reason</h4>
                  <div style={{ background: 'rgba(220, 53, 69, 0.1)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                    {selectedBooking.declineReason}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
