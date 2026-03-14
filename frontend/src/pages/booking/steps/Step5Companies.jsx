import { useState, useEffect } from 'react';
import { Search, Building2, Check, Sparkles, MapPin, ExternalLink } from 'lucide-react';
import { useBooking } from '../../../context/BookingContext';
import { Card, CardBody } from '../../../components/Card';
import Button from '../../../components/Button';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import api from '../../../services/api';

export default function Step5Companies() {
  const { bookingData, updateBookingData, nextStep, prevStep } = useBooking();
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState(bookingData.companies || []);

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = companies.filter((company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
  }, [searchTerm, companies]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/companies/search', {
        domain: bookingData.institution?.department || bookingData.institution?.type || 'Technology',
        city: bookingData.city?.name || 'Chennai'
      });
      setCompanies(data.data?.companies || []);
      setFilteredCompanies(data.data?.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyToggle = (company) => {
    const compId = company.id || company._id;
    const isSelected = selectedCompanies.find((c) => (c.id || c._id) === compId);
    if (isSelected) {
      setSelectedCompanies(selectedCompanies.filter((c) => (c.id || c._id) !== compId));
    } else {
      setSelectedCompanies([...selectedCompanies, company]);
    }
  };

  const handleNext = () => {
    updateBookingData({ companies: selectedCompanies });
    nextStep();
  };

  if (loading) {
    return (
      <Card className="step-card">
        <CardBody style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Sparkles size={40} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
          <h3>Finding the best companies for you...</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Using AI to fetch real {bookingData.institution?.department || 'companies'} in {bookingData.city?.name}
          </p>
          <LoadingSpinner />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="step-card">
      <CardBody>
        <h2 className="step-title">Select Companies to Visit</h2>
        <p className="step-description">
          Choose the companies/industries you want to visit in {bookingData.city?.name}
        </p>

        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search companies by name or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {selectedCompanies.length > 0 && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--primary-light)', borderRadius: '8px' }}>
            <span style={{ fontWeight: 500, color: 'var(--primary)' }}>
              {selectedCompanies.length} {selectedCompanies.length === 1 ? 'company' : 'companies'} selected
            </span>
          </div>
        )}

        {filteredCompanies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No companies found"
            description="Try a different search term or select another city"
          />
        ) : (
          <div className="multi-select-list">
            {filteredCompanies.map((company) => {
              const compId = company.id || company._id;
              const isSelected = selectedCompanies.find((c) => (c.id || c._id) === compId);
              return (
                <div
                  key={compId}
                  className={`multi-select-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCompanyToggle(company)}
                >
                  <div className="multi-select-checkbox">
                    {isSelected && <Check size={14} />}
                  </div>
                  <div className="multi-select-content">
                    <div className="multi-select-title">{company.name}</div>
                    <div className="multi-select-subtitle">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Building2 size={12} />
                        {company.industry || 'Industry'}
                      </span>
                      {company.address && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: '1rem' }}>
                          <MapPin size={12} />
                          {company.address}
                        </span>
                      )}
                    </div>
                    {company.description && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {company.description}
                      </p>
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
            <Button variant="ghost" onClick={() => { updateBookingData({ companies: [] }); nextStep(); }}>
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
