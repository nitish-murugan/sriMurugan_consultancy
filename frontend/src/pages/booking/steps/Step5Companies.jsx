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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState(bookingData.companies || []);

  useEffect(() => {
    fetchCompanies();
    fetchAISuggestions();
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
    try {
      const { data } = await api.get('/companies', {
        params: { city: bookingData.city?._id },
      });
      setCompanies(data.data?.companies || []);
      setFilteredCompanies(data.data?.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAISuggestions = async () => {
    if (!bookingData.city || !bookingData.institution?.type) return;

    setAiLoading(true);
    try {
      const { data } = await api.post('/companies/ai-suggest', {
        city: bookingData.city.name,
        institutionType: bookingData.institution.type,
        department: bookingData.institution.department,
      });
      setAiSuggestion(data.data?.suggestion || '');
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCompanyToggle = (company) => {
    const isSelected = selectedCompanies.find((c) => c._id === company._id);
    if (isSelected) {
      setSelectedCompanies(selectedCompanies.filter((c) => c._id !== company._id));
    } else {
      setSelectedCompanies([...selectedCompanies, company]);
    }
  };

  const handleNext = () => {
    updateBookingData({ companies: selectedCompanies });
    nextStep();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Card className="step-card">
      <CardBody>
        <h2 className="step-title">Select Companies to Visit</h2>
        <p className="step-description">
          Choose the companies/industries you want to visit in {bookingData.city?.name}
        </p>

        {aiSuggestion && (
          <div className="ai-suggestion-box">
            <div className="ai-suggestion-header">
              <Sparkles size={20} color="var(--primary)" />
              <span>AI Recommendations</span>
            </div>
            <div className="ai-suggestion-content">
              {aiLoading ? 'Getting personalized suggestions...' : aiSuggestion}
            </div>
          </div>
        )}

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
              const isSelected = selectedCompanies.find((c) => c._id === company._id);
              return (
                <div
                  key={company._id}
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
