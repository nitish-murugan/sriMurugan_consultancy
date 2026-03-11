import { useState, useEffect } from 'react';
import { Search, Eye, Download, Filter, Check, X } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../../components/Card';
import Button from '../../../components/Button';
import { Select } from '../../../components/Input';
import Modal from '../../../components/Modal';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import api from '../../../services/api';
import '../dashboard/AdminDashboard.css';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [driverDetails, setDriverDetails] = useState({
    name: '',
    phone: '',
    licenseNumber: ''
  });
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/bookings', { params });
      setBookings(data.data?.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId, status, additionalData = {}) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status, ...additionalData });
      fetchBookings();
      setShowAcceptModal(false);
      setShowDeclineModal(false);
      setSelectedBooking(null);
      setDriverDetails({ name: '', phone: '', licenseNumber: '' });
      setDeclineReason('');
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update booking status');
    }
  };

  const handleAccept = (booking) => {
    setSelectedBooking(booking);
    setShowAcceptModal(true);
  };

  const handleDecline = (booking) => {
    setSelectedBooking(booking);
    setShowDeclineModal(true);
  };

  const submitAccept = () => {
    if (!driverDetails.name || !driverDetails.phone || !driverDetails.licenseNumber) {
      alert('Please fill in all driver details');
      return;
    }
    updateStatus(selectedBooking._id, 'accepted', { driverDetails });
  };

  const submitDecline = () => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining');
      return;
    }
    updateStatus(selectedBooking._id, 'declined', { declineReason });
  };

  const filteredBookings = bookings.filter((booking) =>
    booking.user?.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.tripDetails?.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking._id.includes(searchTerm)
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="admin-bookings">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Bookings Management</h1>
      </div>

      <Card>
        <CardHeader>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem 0.625rem 2.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="">All Status</option>
              <option value="pending_review">Pending Review</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </CardHeader>
        <CardBody>
          {filteredBookings.length === 0 ? (
            <EmptyState
              title="No bookings found"
              description="There are no bookings matching your criteria"
            />
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Institution</th>
                    <th>Destination</th>
                    <th>Travel Dates</th>
                    <th>Participants</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td><code>{booking._id.slice(-8)}</code></td>
                      <td>{booking.user?.organization || booking.user?.name || '-'}</td>
                      <td>{booking.tripDetails?.destination || '-'}</td>
                      <td>{formatDate(booking.tripDetails?.startDate)}</td>
                      <td>{booking.groupDetails?.total || 0}</td>
                      <td>₹{booking.payment?.amount?.toLocaleString() || 0}</td>
                      <td>
                        <span className={`status-badge ${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() => { setSelectedBooking(booking); setShowModal(true); }}
                          >
                            <Eye size={16} />
                          </Button>
                          {booking.status === 'pending_review' && (
                            <>
                              <Button
                                variant="ghost"
                                size="small"
                                onClick={() => handleAccept(booking)}
                                style={{ color: 'var(--success)' }}
                                title="Accept Booking"
                              >
                                <Check size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="small"
                                onClick={() => handleDecline(booking)}
                                style={{ color: 'var(--error)' }}
                                title="Decline Booking"
                              >
                                <X size={16} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Booking Details"
      >
        {selectedBooking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <strong>Institution:</strong> {selectedBooking.user?.organization || selectedBooking.user?.name}
            </div>
            <div>
              <strong>Contact:</strong> {selectedBooking.user?.email} {selectedBooking.user?.phone ? `(${selectedBooking.user.phone})` : ''}
            </div>
            <div>
              <strong>Destination:</strong> {selectedBooking.tripDetails?.destination}
            </div>
            <div>
              <strong>Bus:</strong> {selectedBooking.transport?.bus?.busNumber} ({selectedBooking.transport?.bus?.type})
            </div>
            <div>
              <strong>Dates:</strong> {formatDate(selectedBooking.tripDetails?.startDate)} - {formatDate(selectedBooking.tripDetails?.endDate)}
            </div>
            <div>
              <strong>Duration:</strong> {selectedBooking.tripDetails?.duration} days
            </div>
            <div>
              <strong>Participants:</strong> {selectedBooking.groupDetails?.total} ({selectedBooking.groupDetails?.boys} boys, {selectedBooking.groupDetails?.girls} girls, {selectedBooking.groupDetails?.staff} staff)
            </div>
            <div>
              <strong>Accommodation:</strong> {selectedBooking.accommodation?.type} {selectedBooking.accommodation?.guideRequired ? '(Guide Required)' : ''}
            </div>
            <div>
              <strong>Amount:</strong> ₹{selectedBooking.payment?.amount?.toLocaleString()}
            </div>
            <div>
              <strong>Payment:</strong> {selectedBooking.payment?.status || 'Pending'}
            </div>
            <div>
              <strong>Status:</strong> <span className={`status-badge ${selectedBooking.status}`}>{selectedBooking.status}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Accept Booking Modal */}
      <Modal
        isOpen={showAcceptModal}
        onClose={() => {
          setShowAcceptModal(false);
          setSelectedBooking(null);
          setDriverDetails({ name: '', phone: '', licenseNumber: '' });
        }}
        title="Accept Booking - Driver Details"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Please provide driver details to accept this booking
          </p>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
              Driver Name <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              value={driverDetails.name}
              onChange={(e) => setDriverDetails({ ...driverDetails, name: e.target.value })}
              placeholder="Enter driver name"
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.9rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
              Driver Phone <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="tel"
              value={driverDetails.phone}
              onChange={(e) => setDriverDetails({ ...driverDetails, phone: e.target.value })}
              placeholder="Enter phone number"
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.9rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
              License Number <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              value={driverDetails.licenseNumber}
              onChange={(e) => setDriverDetails({ ...driverDetails, licenseNumber: e.target.value })}
              placeholder="Enter license number"
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.9rem',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button
              variant="outline"
              onClick={() => {
                setShowAcceptModal(false);
                setSelectedBooking(null);
                setDriverDetails({ name: '', phone: '', licenseNumber: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={submitAccept}>
              Accept Booking
            </Button>
          </div>
        </div>
      </Modal>

      {/* Decline Booking Modal */}
      <Modal
        isOpen={showDeclineModal}
        onClose={() => {
          setShowDeclineModal(false);
          setSelectedBooking(null);
          setDeclineReason('');
        }}
        title="Decline Booking"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Please provide a reason for declining this booking
          </p>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
              Decline Reason <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Enter reason for declining..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.9rem',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeclineModal(false);
                setSelectedBooking(null);
                setDeclineReason('');
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={submitDecline}>
              Decline Booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
