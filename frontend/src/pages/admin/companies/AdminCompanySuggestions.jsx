import { useState, useEffect } from 'react';
import { Search, Check, X, ExternalLink, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader } from '../../../components/Card';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import api from '../../../services/api';
import '../dashboard/AdminDashboard.css';

export default function AdminCompanySuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, [filterStatus]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/companies/suggestions', {
        params: { status: filterStatus }
      });
      setSuggestions(data.data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await api.post(`/companies/suggestions/${id}/approve`);
      toast.success('Company suggestion approved!');
      fetchSuggestions();
      setShowDetailModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/companies/suggestions/${id}/reject`, {
        reason: rejectionReason
      });
      toast.success('Company suggestion rejected');
      setRejectionReason('');
      setShowRejectModal(false);
      fetchSuggestions();
      setShowDetailModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSuggestions = suggestions.filter((s) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fff3cd', color: '#856404' },
      approved: { bg: '#d4edda', color: '#155724' },
      rejected: { bg: '#f8d7da', color: '#721c24' }
    };
    const style = styles[status] || styles.pending;
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '0.35rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 500,
          backgroundColor: style.bg,
          color: style.color
        }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-suggestions">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Company Suggestions</h1>
      </div>

      <Card>
        <CardHeader>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by name, domain, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem' }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '0.625rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem' }}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="">All</option>
            </select>
          </div>
        </CardHeader>
        <CardBody>
          {filteredSuggestions.length === 0 ? (
            <EmptyState title="No suggestions found" description="No company suggestions match your filters" />
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Domain</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuggestions.map((suggestion) => (
                    <tr key={suggestion._id}>
                      <td>{suggestion.name}</td>
                      <td>{suggestion.domain || '-'}</td>
                      <td>{suggestion.city || '-'}</td>
                      <td>{getStatusBadge(suggestion.status)}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(suggestion.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => {
                            setSelectedSuggestion(suggestion);
                            setShowDetailModal(true);
                          }}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedSuggestion(null);
          setRejectionReason('');
          setShowRejectModal(false);
        }}
        title={selectedSuggestion?.name}
      >
        {selectedSuggestion && (
          <div>
            {!showRejectModal ? (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Domain</h4>
                    <p style={{ margin: 0, fontWeight: 500 }}>{selectedSuggestion.domain || 'Not specified'}</p>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>City</h4>
                    <p style={{ margin: 0, fontWeight: 500 }}>{selectedSuggestion.city || 'Not specified'}</p>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</h4>
                    <div>{getStatusBadge(selectedSuggestion.status)}</div>
                  </div>
                  {selectedSuggestion.description && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Description</h4>
                      <p style={{ margin: 0, lineHeight: 1.5 }}>{selectedSuggestion.description}</p>
                    </div>
                  )}
                  {selectedSuggestion.website && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Website</h4>
                      <a
                        href={selectedSuggestion.website.startsWith('http') ? selectedSuggestion.website : `https://${selectedSuggestion.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <ExternalLink size={14} />
                        {selectedSuggestion.website}
                      </a>
                    </div>
                  )}
                  {selectedSuggestion.contactEmail && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Contact Email</h4>
                      <a href={`mailto:${selectedSuggestion.contactEmail}`} style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Mail size={14} />
                        {selectedSuggestion.contactEmail}
                      </a>
                    </div>
                  )}
                  {selectedSuggestion.contactPhone && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Contact Phone</h4>
                      <a href={`tel:${selectedSuggestion.contactPhone}`} style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={14} />
                        {selectedSuggestion.contactPhone}
                      </a>
                    </div>
                  )}
                  {selectedSuggestion.rejectionReason && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f8d7da', borderRadius: '6px', borderLeft: '4px solid #721c24' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#721c24', fontSize: '0.85rem', textTransform: 'uppercase' }}>Rejection Reason</h4>
                      <p style={{ margin: 0, color: '#721c24' }}>{selectedSuggestion.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {selectedSuggestion.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      style={{ color: 'var(--error)' }}
                    >
                      <X size={16} />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedSuggestion._id)}
                      disabled={actionLoading}
                    >
                      <Check size={16} />
                      Approve & Add
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Rejection Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this company suggestion is being rejected..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                    }}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedSuggestion._id)}
                    disabled={actionLoading}
                    style={{ backgroundColor: 'var(--error)' }}
                  >
                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
