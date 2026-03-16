import { useState, useEffect } from 'react';
import { Search, Building2, Check, Sparkles, MapPin, ExternalLink, Plus } from 'lucide-react';
import { useBooking } from '../../../context/BookingContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Card, CardBody } from '../../../components/Card';
import Button from '../../../components/Button';
import { Input, Textarea } from '../../../components/Input';
import Modal from '../../../components/Modal';
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
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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

  const handleSuggestCompany = async (data) => {
    setSubmittingSuggestion(true);
    try {
      await api.post('/companies/suggest', {
        name: data.companyName,
        website: data.website || '',
        description: data.description,
        city: bookingData.city?.name || 'Unknown',
        domain: bookingData.institution?.department || bookingData.institution?.type || 'Technology',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || ''
      });
      toast.success('Company suggestion sent to admin!');
      setShowSuggestModal(false);
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit suggestion');
    } finally {
      setSubmittingSuggestion(false);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 className="step-title" style={{ margin: 0 }}>Select Companies to Visit</h2>
            <p className="step-description" style={{ margin: '0.5rem 0 0 0' }}>
              Choose the companies/industries you want to visit in {bookingData.city?.name}
            </p>
          </div>
          <Button 
            size="small" 
            icon={Plus} 
            onClick={() => setShowSuggestModal(true)}
            style={{ whiteSpace: 'nowrap' }}
          >
            Suggest Company
          </Button>
        </div>

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div className="multi-select-title">{company.name}</div>
                        <div className="multi-select-subtitle">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Building2 size={12} />
                            {company.industry || company.type || 'Industry'}
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
                        {company.website && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <a 
                              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.35rem',
                                color: 'var(--primary)',
                                textDecoration: 'none',
                                fontSize: '0.85rem',
                                fontWeight: 500
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={12} />
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
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

      <Modal 
        isOpen={showSuggestModal} 
        onClose={() => setShowSuggestModal(false)} 
        title="Suggest a Company"
      >
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Know a company that should be in our list? Share their details with us!
        </p>
        <form onSubmit={handleSubmit(handleSuggestCompany)}>
          <div style={{ marginBottom: '1rem' }}>
            <Input 
              label="Company Name *" 
              error={errors.companyName?.message} 
              {...register('companyName', { required: 'Company name is required' })} 
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <Input 
              label="Website" 
              type="url"
              placeholder="https://example.com"
              {...register('website')} 
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <Textarea 
              label="Description" 
              rows={3}
              placeholder="What does the company do?"
              {...register('description')} 
            />
          </div>
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <Input 
              label="Contact Email" 
              type="email"
              {...register('contactEmail')} 
            />
            <Input 
              label="Contact Phone" 
              {...register('contactPhone')} 
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSuggestModal(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={submittingSuggestion}
            >
              {submittingSuggestion ? 'Sending...' : 'Send Suggestion'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
