import { 
  MapPin, Bus, Building, Users, Building2, Camera, Utensils, 
  Calendar, Phone, Mail, IndianRupee, Edit2 
} from 'lucide-react';
import { useBooking } from '../../../context/BookingContext';
import { Card, CardBody } from '../../../components/Card';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';

export default function Step8Review() {
  const { bookingData, nextStep, prevStep, setStep } = useBooking();

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateDays = () => {
    if (!bookingData.travelDates?.start || !bookingData.travelDates?.end) return 0;
    const start = new Date(bookingData.travelDates.start);
    const end = new Date(bookingData.travelDates.end);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculateTotal = () => {
    const days = calculateDays();
    const busCost = (bookingData.bus?.pricePerDay || 0) * days;
    return busCost;
  };

  const days = calculateDays();
  const totalAmount = calculateTotal();

  return (
    <Card className="step-card">
      <CardBody>
        <h2 className="step-title">Review Your Booking</h2>
        <p className="step-description">
          Please review all details before proceeding to payment
        </p>

        {/* Trip Details */}
        <div className="review-section">
          <div className="review-section-title">
            <MapPin size={20} color="var(--primary)" />
            Trip Details
            <button 
              onClick={() => setStep(1)} 
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
            >
              <Edit2 size={16} />
            </button>
          </div>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-item-label">Destination</span>
              <span className="review-item-value">{bookingData.city?.name || '-'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Travel Dates</span>
              <span className="review-item-value">
                {formatDate(bookingData.travelDates?.start)} - {formatDate(bookingData.travelDates?.end)}
              </span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Duration</span>
              <span className="review-item-value">{days} {days === 1 ? 'Day' : 'Days'}</span>
            </div>
          </div>
        </div>

        {/* Bus Details */}
        <div className="review-section">
          <div className="review-section-title">
            <Bus size={20} color="var(--primary)" />
            Bus Details
            <button 
              onClick={() => setStep(2)} 
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
            >
              <Edit2 size={16} />
            </button>
          </div>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-item-label">Bus Type</span>
              <span className="review-item-value">{bookingData.bus?.type || '-'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Bus Number</span>
              <span className="review-item-value">{bookingData.bus?.busNumber || '-'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Capacity</span>
              <span className="review-item-value">{bookingData.bus?.capacity || '-'} Seats</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Price Per Day</span>
              <span className="review-item-value">₹{bookingData.bus?.pricePerDay?.toLocaleString() || '-'}</span>
            </div>
          </div>
        </div>

        {/* Institution Details */}
        <div className="review-section">
          <div className="review-section-title">
            <Building size={20} color="var(--primary)" />
            Institution Details
            <button 
              onClick={() => setStep(3)} 
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
            >
              <Edit2 size={16} />
            </button>
          </div>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-item-label">Institution Name</span>
              <span className="review-item-value">{bookingData.institution?.name || '-'}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Type</span>
              <span className="review-item-value" style={{ textTransform: 'capitalize' }}>
                {bookingData.institution?.type?.replace('_', ' ') || '-'}
              </span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Department</span>
              <span className="review-item-value">{bookingData.institution?.department || '-'}</span>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span className="review-item-label">Coordinator</span>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {bookingData.coordinator?.name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                <Phone size={14} />
                {bookingData.coordinator?.phone}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                <Mail size={14} />
                {bookingData.coordinator?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="review-section">
          <div className="review-section-title">
            <Users size={20} color="var(--primary)" />
            Participants
            <button 
              onClick={() => setStep(4)} 
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
            >
              <Edit2 size={16} />
            </button>
          </div>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-item-label">Students</span>
              <span className="review-item-value">{bookingData.participants?.students || 0}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Staff</span>
              <span className="review-item-value">{bookingData.participants?.staff || 0}</span>
            </div>
            <div className="review-item">
              <span className="review-item-label">Total Participants</span>
              <span className="review-item-value">{bookingData.participants?.total || 0}</span>
            </div>
          </div>
        </div>

        {/* Companies */}
        {bookingData.companies && bookingData.companies.length > 0 && (
          <div className="review-section">
            <div className="review-section-title">
              <Building2 size={20} color="var(--primary)" />
              Companies to Visit ({bookingData.companies.length})
            </div>
            <div className="review-list">
              {bookingData.companies.map((company) => (
                <Badge key={company._id} variant="default">
                  {company.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Visiting Spots */}
        {bookingData.visitingSpots && bookingData.visitingSpots.length > 0 && (
          <div className="review-section">
            <div className="review-section-title">
              <Camera size={20} color="var(--primary)" />
              Tourist Spots ({bookingData.visitingSpots.length})
            </div>
            <div className="review-list">
              {bookingData.visitingSpots.map((spot) => (
                <Badge key={spot._id} variant="info">
                  {spot.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Meals */}
        {bookingData.meals && bookingData.meals.length > 0 && (
          <div className="review-section">
            <div className="review-section-title">
              <Utensils size={20} color="var(--primary)" />
              Meal Plans ({bookingData.meals.length})
            </div>
            <div className="review-list">
              {bookingData.meals.map((meal) => (
                <Badge key={meal.id} variant="success">
                  {meal.type} {meal.restaurant && `- ${meal.restaurant}`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="review-total">
          <div>
            <span className="review-total-label">Total Amount</span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              ₹{bookingData.bus?.pricePerDay?.toLocaleString()} × {days} days
            </p>
          </div>
          <span className="review-total-value">
            <IndianRupee size={24} style={{ display: 'inline' }} />
            {totalAmount.toLocaleString()}
          </span>
        </div>

        <div className="step-actions">
          <Button variant="outline" onClick={prevStep}>
            Back
          </Button>
          <div className="step-actions-right">
            <Button onClick={nextStep}>
              Proceed to Payment
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
