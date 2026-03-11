import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader } from '../../../components/Card';
import Button from '../../../components/Button';
import { Input, Textarea } from '../../../components/Input';
import Modal, { ModalFooter } from '../../../components/Modal';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import api from '../../../services/api';
import '../dashboard/AdminDashboard.css';

const citySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  state: z.string().min(2, 'State is required'),
  description: z.string().optional(),
});

export default function AdminCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(citySchema),
  });

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const { data } = await api.get('/cities');
      setCities(data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCity(null);
    reset({ name: '', state: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (city) => {
    setEditingCity(city);
    reset({
      name: city.name,
      state: city.state || '',
      description: city.description || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingCity) {
        await api.put(`/cities/${editingCity._id}`, data);
        toast.success('City updated');
      } else {
        await api.post('/cities', data);
        toast.success('City created');
      }
      setShowModal(false);
      fetchCities();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCity = async (id) => {
    if (!confirm('Delete this city?')) return;
    try {
      await api.delete(`/cities/${id}`);
      toast.success('City deleted');
      fetchCities();
    } catch {
      toast.error('Delete failed');
    }
  };

  const filteredCities = cities.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-cities">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Cities Management</h1>
        <Button icon={Plus} onClick={openCreateModal}>Add City</Button>
      </div>

      <Card>
        <CardHeader>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search cities..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem' }} />
          </div>
        </CardHeader>
        <CardBody>
          {filteredCities.length === 0 ? (
            <EmptyState title="No cities found" description="Add your first city" />
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>State</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCities.map((city) => (
                    <tr key={city._id}>
                      <td>{city.name}</td>
                      <td>{city.state}</td>
                      <td>{city.description ? city.description.slice(0, 50) + '...' : '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button variant="ghost" size="small" onClick={() => openEditModal(city)}><Edit2 size={16} /></Button>
                          <Button variant="ghost" size="small" onClick={() => deleteCity(city._id)} style={{ color: 'var(--error)' }}><Trash2 size={16} /></Button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCity ? 'Edit City' : 'Add City'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <Input label="City Name" error={errors.name?.message} {...register('name')} />
            <Input label="State" error={errors.state?.message} {...register('state')} />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Textarea label="Description" rows={3} {...register('description')} />
          </div>
          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingCity ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
