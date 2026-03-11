import { useState, useEffect } from 'react';
import { Search, Users, Wifi, Snowflake, Tv, Music, Check, IndianRupee } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useBooking } from '../../../context/BookingContext';
import { Card, CardBody } from '../../../components/Card';
import Button from '../../../components/Button';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import api from '../../../services/api';

const amenityIcons = {
  'ac': <Snowflake size={12} />,
  'wifi': <Wifi size={12} />,
  'tv': <Tv size={12} />,
  'music': <Music size={12} />,
};

export default function Step2Bus() {
  const { bookingData, updateBookingData, nextStep, prevStep } = useBooking();
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState(bookingData.bus || null);
  const [startDate, setStartDate] = useState(bookingData.travelDates?.start ? new Date(bookingData.travelDates.start) : null);
  const [endDate, setEndDate] = useState(bookingData.travelDates?.end ? new Date(bookingData.travelDates.end) : null);

  useEffect(() => {
    fetchBuses();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = buses.filter((bus) =>
        bus.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBuses(filtered);
    } else {
      setFilteredBuses(buses);
    }
  }, [searchTerm, buses]);

  const fetchBuses = async () => {
    try {
      const { data } = await api.get('/buses/available');
      setBuses(data.data || []);
      setFilteredBuses(data.data || []);
    } catch (error) {
      console.error('Error fetching buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusSelect = (bus) => {
    setSelectedBus(bus);
  };

  const handleNext = () => {
    if (selectedBus && startDate && endDate) {
      updateBookingData({
        bus: selectedBus,
        travelDates: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });
      nextStep();
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 3); // Minimum 3 days from now

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Card className="step-card">
      <CardBody>
        <h2 className="step-title">Choose Your Bus</h2>
        <p className="step-description">
          Select a bus and pick your travel dates
        </p>

        <div className="date-range-picker" style={{ marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Start Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              minDate={minDate}
              placeholderText="Select start date"
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              End Date
            </label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              minDate={startDate || minDate}
              placeholderText="Select end date"
              dateFormat="dd/MM/yyyy"
            />
          </div>
        </div>

        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search buses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredBuses.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No buses available"
            description="Try a different search term"
          />
        ) : (
          <div className="selection-grid">
            {filteredBuses.map((bus) => (
              <div
                key={bus._id}
                className={`selection-card ${selectedBus?._id === bus._id ? 'selected' : ''}`}
                onClick={() => handleBusSelect(bus)}
              >
                <div className="selection-card-header">
                  <span className="selection-card-title">{bus.busNumber}</span>
                  <div className="selection-card-check">
                    {selectedBus?._id === bus._id && <Check size={14} />}
                  </div>
                </div>
                <div className="selection-card-details">
                  <div className="selection-card-detail">
                    <Users size={14} />
                    <span>{bus.capacity} Seats</span>
                  </div>
                  <div className="selection-card-detail">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {bus.type}
                    </span>
                  </div>
                  {bus.amenities && bus.amenities.length > 0 && (
                    <div className="amenities-list">
                      {bus.amenities.map((amenity, idx) => (
                        <span key={idx} className="amenity-badge">
                          {amenityIcons[amenity.toLowerCase()] || null}
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="selection-card-price">
                    <IndianRupee size={18} style={{ display: 'inline' }} />
                    {bus.pricePerDay?.toLocaleString()}/day
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="step-actions">
          <Button variant="outline" onClick={prevStep}>
            Back
          </Button>
          <div className="step-actions-right">
            <Button
              onClick={handleNext}
              disabled={!selectedBus || !startDate || !endDate}
            >
              Continue
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
