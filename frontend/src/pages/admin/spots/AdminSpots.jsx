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

const spotSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  type: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  description: z.string().optional(),
  timings: z.string().optional(),
  entryFee: z.string().optional().transform((val) => val ? Number(val) : 0),
});

export default function AdminSpots() {
  const [spots, setSpots] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSpot, setEditingSpot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(spotSchema),
  });

  useEffect(() => {
    Promise.all([fetchSpots(), fetchCities()]);
  }, []);

  const fetchSpots = async () => {
    try {
      const { data } = await api.get('/spots');
      setSpots(data.data?.spots || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const { data } = await api.get('/cities');
      setCities(data.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openCreateModal = () => {
    setEditingSpot(null);
    reset({ name: '', type: '', address: '', city: '', description: '', timings: '', entryFee: '' });
    setShowModal(true);
  };

  const openEditModal = (spot) => {
    setEditingSpot(spot);
    reset({
      name: spot.name,
      type: spot.type || '',
      address: spot.address || '',
      city: spot.city?._id || spot.city || '',
      description: spot.description || '',
      timings: spot.timings || '',
      entryFee: spot.entryFee?.toString() || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingSpot) {
        await api.put(`/spots/${editingSpot._id}`, data);
        toast.success('Spot updated');
      } else {
        await api.post('/spots', data);
        toast.success('Spot created');
      }
      setShowModal(false);
      fetchSpots();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSpot = async (id) => {
    if (!confirm('Delete this spot?')) return;
    try {
      await api.delete(`/spots/${id}`);
      toast.success('Spot deleted');
      fetchSpots();
    } catch {
      toast.error('Delete failed');
    }
  };

  const filteredSpots = spots.filter((s) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-spots">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Visiting Spots Management</h1>
        <Button icon={Plus} onClick={openCreateModal}>Add Spot</Button>
      </div>

      <Card>
        <CardHeader>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search spots..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem' }} />
          </div>
        </CardHeader>
        <CardBody>
          {filteredSpots.length === 0 ? (
            <EmptyState title="No spots found" description="Add your first visiting spot" />
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>City</th>
                    <th>Timings</th>
                    <th>Entry Fee</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpots.map((spot) => (
                    <tr key={spot._id}>
                      <td>{spot.name}</td>
                      <td>{spot.type || '-'}</td>
                      <td>{spot.city?.name || '-'}</td>
                      <td>{spot.timings || '-'}</td>
                      <td>{spot.entryFee ? `₹${spot.entryFee}` : 'Free'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button variant="ghost" size="small" onClick={() => openEditModal(spot)}><Edit2 size={16} /></Button>
                          <Button variant="ghost" size="small" onClick={() => deleteSpot(spot._id)} style={{ color: 'var(--error)' }}><Trash2 size={16} /></Button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSpot ? 'Edit Spot' : 'Add Spot'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <Input label="Spot Name" error={errors.name?.message} {...register('name')} />
            <Input label="Type" placeholder="e.g., Temple, Museum" {...register('type')} />
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
          <div className="form-row" style={{ marginTop: '1rem' }}>
            <Input label="Timings" placeholder="e.g., 6AM - 8PM" {...register('timings')} />
            <Input label="Entry Fee (₹)" type="number" {...register('entryFee')} />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Textarea label="Description" rows={2} {...register('description')} />
          </div>
          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingSpot ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
