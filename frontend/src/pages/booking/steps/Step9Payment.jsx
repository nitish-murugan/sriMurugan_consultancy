import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, IndianRupee, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBooking } from '../../../context/BookingContext';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardBody } from '../../../components/Card';
import Button from '../../../components/Button';
import api from '../../../services/api';

export default function Step9Payment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookingData, prevStep, resetBooking } = useBooking();
  const [loading, setLoading] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const calculateDays = () => {
    if (!bookingData.travelDates?.start || !bookingData.travelDates?.end) return 0;
    const start = new Date(bookingData.travelDates.start);
    const end = new Date(bookingData.travelDates.end);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateTotal = () => {
    const days = calculateDays();
    return (bookingData.bus?.pricePerDay || 0) * days;
  };

  const totalAmount = calculateTotal();

  const handleSubmitBooking = async () => {
    setLoading(true);

    try {
      console.log('Booking Data:', bookingData);
      
      // Create booking payload
      const bookingPayload = {
        city: bookingData.city,
        bus: bookingData.bus?._id,
        travelDates: bookingData.travelDates,
        institution: bookingData.institution,
        coordinator: bookingData.coordinator,
        participants: bookingData.participants,
        companies: bookingData.companies || [],
        visitingSpots: bookingData.visitingSpots || [],
        meals: bookingData.meals || [],
        specialRequirements: bookingData.specialRequirements,
        totalAmount,
      };

      console.log('Submitting booking:', bookingPayload);

      const { data: bookingResponse } = await api.post('/bookings', bookingPayload);
      const createdBooking = bookingResponse.data;

      console.log('Booking created:', createdBooking);

      setBookingId(createdBooking._id || createdBooking.bookingId);
      setBookingComplete(true);
      toast.success('Booking submitted successfully! Awaiting admin approval.');
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBooking = () => {
    resetBooking();
    navigate('/dashboard');
  };

  if (bookingComplete) {
    return (
      <Card className="step-card">
        <CardBody>
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle size={80} color="var(--success)" style={{ marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Booking Submitted Successfully!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Your booking request has been received and is pending admin approval.
            </p>
            
            <div style={{ 
              background: 'var(--primary-light)', 
              border: '2px dashed var(--primary)', 
              borderRadius: '8px', 
              padding: '1.5rem', 
              margin: '2rem auto',
              maxWidth: '400px'
            }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Acknowledgement Number:
              </p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--primary)', letterSpacing: '1px' }}>
                {bookingId}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--warning)', fontWeight: 600, margin: 0 }}>
                📸 Please take a screenshot of this acknowledgement number for future reference.
              </p>
            </div>

            <div style={{ 
              background: 'rgba(102, 126, 234, 0.1)', 
              border: '1px solid var(--primary)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FileText size={20} color="var(--primary)" />
                <span style={{ fontWeight: 600 }}>Next Steps</span>
              </div>
              <ul style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, paddingLeft: '1.25rem' }}>
                <li>Our admin team will review your booking request</li>
                <li>You will receive a confirmation email once approved</li>
                <li>Invoice will be generated and can be downloaded from your dashboard</li>
                <li>Payment details will be shared after approval</li>
              </ul>
            </div>
            <Button onClick={handleViewBooking}>
              View My Bookings
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="step-card">
      <CardBody>
        <h2 className="step-title">Review & Submit Booking</h2>
        <p className="step-description">
          Review your booking details and submit for approval
        </p>

        <div style={{ 
          background: 'var(--primary-light)', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 500 }}>Estimated Total Amount</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
            <IndianRupee size={20} style={{ display: 'inline' }} />
            {totalAmount.toLocaleString()}
          </span>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Booking Summary</h3>
          <div style={{ 
            background: 'var(--bg-secondary)', 
            padding: '1rem', 
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Destination:</span>
                <span style={{ fontWeight: 500 }}>{bookingData.city?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bus Type:</span>
                <span style={{ fontWeight: 500 }}>{bookingData.bus?.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Duration:</span>
                <span style={{ fontWeight: 500 }}>{calculateDays()} days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Participants:</span>
                <span style={{ fontWeight: 500 }}>{bookingData.participants?.total || 0} people</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Institution:</span>
                <span style={{ fontWeight: 500 }}>{bookingData.institution?.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem', 
          background: 'rgba(255, 193, 7, 0.1)', 
          border: '1px solid var(--warning)',
          borderRadius: '8px',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertCircle size={18} color="var(--warning)" />
            <strong>Important Information</strong>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
            <li>Your booking will be pending until admin approval</li>
            <li>Payment details will be shared after admin approval</li>
            <li>Travel dates are subject to bus availability</li>
            <li>Cancellation policy applies as per terms</li>
          </ul>
        </div>

        <div className="step-actions">
          <Button variant="outline" onClick={prevStep} disabled={loading}>
            Back
          </Button>
          <div className="step-actions-right">
            <Button onClick={handleSubmitBooking} loading={loading}>
              Submit Booking
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
