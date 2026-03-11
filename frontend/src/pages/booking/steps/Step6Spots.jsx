import { useState, useEffect } from 'react';
import { Search, MapPin, Check, Camera, Clock } from 'lucide-react';
import { useBooking } from '../../../context/BookingContext';
import { Card, CardBody } from '../../../components/Card';
import Button from '../../../components/Button';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import api from '../../../services/api';

export default function Step6Spots() {
  const { bookingData, updateBookingData, nextStep, prevStep } = useBooking();
  const [spots, setSpots] = useState([]);
  const [filteredSpots, setFilteredSpots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSpots, setSelectedSpots] = useState(bookingData.visitingSpots || []);

  useEffect(() => {
    fetchSpots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = spots.filter((spot) =>
        spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSpots(filtered);
    } else {
      setFilteredSpots(spots);
    }
  }, [searchTerm, spots]);

  const fetchSpots = async () => {
    try {
      const { data } = await api.get('/spots', {
        params: { city: bookingData.city?._id },
      });
      setSpots(data.data?.spots || []);
      setFilteredSpots(data.data?.spots || []);
    } catch (error) {
      console.error('Error fetching spots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpotToggle = (spot) => {
    const isSelected = selectedSpots.find((s) => s._id === spot._id);
    if (isSelected) {
      setSelectedSpots(selectedSpots.filter((s) => s._id !== spot._id));
    } else {
      setSelectedSpots([...selectedSpots, spot]);
    }
  };

  const handleNext = () => {
    updateBookingData({ visitingSpots: selectedSpots });
    nextStep();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Card className="step-card">
      <CardBody>
        <h2 className="step-title">Select Visiting Spots</h2>
        <p className="step-description">
          Choose tourist spots and places of interest to visit in {bookingData.city?.name}
        </p>

        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search tourist spots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {selectedSpots.length > 0 && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--primary-light)', borderRadius: '8px' }}>
            <span style={{ fontWeight: 500, color: 'var(--primary)' }}>
              {selectedSpots.length} {selectedSpots.length === 1 ? 'spot' : 'spots'} selected
            </span>
          </div>
        )}

        {filteredSpots.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="No spots found"
            description="Try a different search term or select another city"
          />
        ) : (
          <div className="multi-select-list">
            {filteredSpots.map((spot) => {
              const isSelected = selectedSpots.find((s) => s._id === spot._id);
              return (
                <div
                  key={spot._id}
                  className={`multi-select-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSpotToggle(spot)}
                >
                  <div className="multi-select-checkbox">
                    {isSelected && <Check size={14} />}
                  </div>
                  <div className="multi-select-content">
                    <div className="multi-select-title">{spot.name}</div>
                    <div className="multi-select-subtitle">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Camera size={12} />
                        {spot.type || 'Tourist Spot'}
                      </span>
                      {spot.timings && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: '1rem' }}>
                          <Clock size={12} />
                          {spot.timings}
                        </span>
                      )}
                    </div>
                    {spot.address && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={12} />
                        {spot.address}
                      </p>
                    )}
                    {spot.description && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {spot.description}
                      </p>
                    )}
                    {spot.entryFee && (
                      <span style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary)' }}>
                        Entry: ₹{spot.entryFee}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="step-actions">
          <Button variant="outline" onClick={prevStep}>
            Back
          </Button>
          <div className="step-actions-right">
            <Button variant="ghost" onClick={() => { updateBookingData({ visitingSpots: [] }); nextStep(); }}>
              Skip
            </Button>
            <Button onClick={handleNext}>
              Continue
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
