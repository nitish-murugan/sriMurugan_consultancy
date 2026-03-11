import { useState, useEffect } from 'react';
import { Search, MapPin, Check } from 'lucide-react';
import { useBooking } from '../../../context/BookingContext';
import { Card, CardBody } from '../../../components/Card';
import Button from '../../../components/Button';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import api from '../../../services/api';

export default function Step1City() {
  const { bookingData, updateBookingData, nextStep } = useBooking();
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(bookingData.city || null);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = cities.filter((city) =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(cities);
    }
  }, [searchTerm, cities]);

  const fetchCities = async () => {
    try {
      const { data } = await api.get('/cities');
      setCities(data.data);
      setFilteredCities(data.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
  };

  const handleNext = () => {
    if (selectedCity) {
      updateBookingData({ city: selectedCity });
      nextStep();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Card className="step-card">
      <CardBody>
        <h2 className="step-title">Select Your Destination City</h2>
        <p className="step-description">
          Choose the city where you want to conduct your industrial visit
        </p>

        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredCities.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No cities found"
            description="Try a different search term"
          />
        ) : (
          <div className="selection-grid">
            {filteredCities.map((city) => (
              <div
                key={city._id}
                className={`selection-card ${selectedCity?._id === city._id ? 'selected' : ''}`}
                onClick={() => handleCitySelect(city)}
              >
                <div className="selection-card-header">
                  <span className="selection-card-title">{city.name}</span>
                  <div className="selection-card-check">
                    {selectedCity?._id === city._id && <Check size={14} />}
                  </div>
                </div>
                <div className="selection-card-details">
                  <div className="selection-card-detail">
                    <MapPin size={14} />
                    <span>{city.state}</span>
                  </div>
                  {city.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {city.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="step-actions">
          <div></div>
          <div className="step-actions-right">
            <Button
              onClick={handleNext}
              disabled={!selectedCity}
            >
              Continue
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
