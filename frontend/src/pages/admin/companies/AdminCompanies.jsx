import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader } from '../../../components/Card';
import Button from '../../../components/Button';
import { Input, Textarea, Select } from '../../../components/Input';
import Modal, { ModalFooter } from '../../../components/Modal';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import api from '../../../services/api';
import '../dashboard/AdminDashboard.css';

const companySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  industry: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  description: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
});

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    Promise.all([fetchCompanies(), fetchCities()]);
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get('/companies');
      setCompanies(data.data?.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const { data } = await api.get('/cities');
      setCities(data.data || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const openCreateModal = () => {
    setEditingCompany(null);
    reset({ name: '', industry: '', address: '', city: '', description: '', contactPerson: '', contactPhone: '' });
    setShowModal(true);
  };

  const openEditModal = (company) => {
    setEditingCompany(company);
    reset({
      name: company.name,
      industry: company.industry || '',
      address: company.address || '',
      city: company.city?._id || company.city || '',
      description: company.description || '',
      contactPerson: company.contact?.name || '',
      contactPhone: company.contact?.phone || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        industry: data.industry,
        address: data.address,
        city: data.city,
        description: data.description,
        contact: { name: data.contactPerson, phone: data.contactPhone },
      };

      if (editingCompany) {
        await api.put(`/companies/${editingCompany._id}`, payload);
        toast.success('Company updated');
      } else {
        await api.post('/companies', payload);
        toast.success('Company created');
      }
      setShowModal(false);
      fetchCompanies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCompany = async (id) => {
    if (!confirm('Delete this company?')) return;
    try {
      await api.delete(`/companies/${id}`);
      toast.success('Company deleted');
      fetchCompanies();
    } catch {
      toast.error('Delete failed');
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-companies">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Companies Management</h1>
        <Button icon={Plus} onClick={openCreateModal}>Add Company</Button>
      </div>

      <Card>
        <CardHeader>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search companies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem' }} />
          </div>
        </CardHeader>
        <CardBody>
          {filteredCompanies.length === 0 ? (
            <EmptyState title="No companies found" description="Add your first company" />
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Industry</th>
                    <th>City</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company) => (
                    <tr key={company._id}>
                      <td>{company.name}</td>
                      <td>{company.industry || '-'}</td>
                      <td>{company.city?.name || '-'}</td>
                      <td>{company.contact?.name || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button variant="ghost" size="small" onClick={() => openEditModal(company)}><Edit2 size={16} /></Button>
                          <Button variant="ghost" size="small" onClick={() => deleteCompany(company._id)} style={{ color: 'var(--error)' }}><Trash2 size={16} /></Button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCompany ? 'Edit Company' : 'Add Company'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <Input label="Company Name" error={errors.name?.message} {...register('name')} />
            <Input label="Industry" {...register('industry')} />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Select label="City" error={errors.city?.message} {...register('city')}>
              <option value="">Select city</option>
              {cities.map((city) => <option key={city._id} value={city._id}>{city.name}</option>)}
            </Select>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Input label="Address" {...register('address')} />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Textarea label="Description" rows={2} {...register('description')} />
          </div>
          <div className="form-row" style={{ marginTop: '1rem' }}>
            <Input label="Contact Person" {...register('contactPerson')} />
            <Input label="Contact Phone" {...register('contactPhone')} />
          </div>
          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingCompany ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
