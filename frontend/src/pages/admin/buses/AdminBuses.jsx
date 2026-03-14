import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Plus, Edit2, Trash2, Upload, X, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardBody, CardHeader } from '../../../components/Card';
import Button from '../../../components/Button';
import { Input, Textarea, Select } from '../../../components/Input';
import Modal, { ModalFooter } from '../../../components/Modal';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyState from '../../../components/EmptyState';
import api from '../../../services/api';
import '../dashboard/AdminDashboard.css';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const busSchema = z.object({
  busNumber: z.string().min(2, 'Bus number is required'),
  type: z.string().min(1, 'Bus type is required'),
  capacity: z.string().transform(Number).pipe(z.number().min(1, 'Capacity required')),
  pricePerDay: z.string().transform(Number).pipe(z.number().min(1, 'Price required')),
  amenities: z.string().optional(),
});

export default function AdminBuses() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(busSchema),
  });

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const { data } = await api.get('/buses');
      setBuses(data.data?.buses || []);
    } catch (error) {
      console.error('Error fetching buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBus(null);
    setSelectedImage(null);
    setImagePreview(null);
    reset({ busNumber: '', type: '', capacity: '', pricePerDay: '', amenities: '' });
    setShowModal(true);
  };

  const openEditModal = (bus) => {
    setEditingBus(bus);
    setSelectedImage(null);
    setImagePreview(bus.imagePath ? `${BACKEND_URL}${bus.imagePath}` : null);
    reset({
      busNumber: bus.busNumber,
      type: bus.type,
      capacity: bus.capacity?.toString(),
      pricePerDay: bus.pricePerDay?.toString(),
      amenities: bus.amenities?.join(', ') || '',
    });
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('busNumber', data.busNumber);
      formData.append('type', data.type);
      formData.append('capacity', data.capacity);
      formData.append('pricePerDay', data.pricePerDay);
      formData.append('amenities', JSON.stringify(data.amenities ? data.amenities.split(',').map(a => a.trim()) : []));
      formData.append('isAC', data.type?.toLowerCase().includes('ac') && !data.type?.toLowerCase().includes('non-ac'));
      formData.append('permitValidity', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString());

      if (selectedImage) {
        formData.append('busImage', selectedImage);
      }

      if (editingBus) {
        await api.put(`/buses/${editingBus._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Bus updated successfully');
      } else {
        await api.post('/buses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Bus created successfully');
      }
      setShowModal(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchBuses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBus = async (id) => {
    if (!confirm('Are you sure you want to delete this bus?')) return;
    try {
      await api.delete(`/buses/${id}`);
      toast.success('Bus deleted');
      fetchBuses();
    } catch {
      toast.error('Delete failed');
    }
  };

  const filteredBuses = buses.filter((bus) =>
    bus.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-buses">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Buses Management</h1>
        <Button icon={Plus} onClick={openCreateModal}>Add Bus</Button>
      </div>

      <Card>
        <CardHeader>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search buses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>
        </CardHeader>
        <CardBody>
          {filteredBuses.length === 0 ? (
            <EmptyState title="No buses found" description="Add your first bus to get started" />
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bus Number</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Price/Day</th>
                    <th>Image</th>
                    <th>Amenities</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuses.map((bus) => (
                    <tr key={bus._id}>
                      <td><code>{bus.busNumber}</code></td>
                      <td>{bus.type}</td>
                      <td>{bus.capacity} seats</td>
                      <td>₹{bus.pricePerDay?.toLocaleString()}</td>
                      <td>
                        {bus.imagePath ? (
                          <a
                            href={`${BACKEND_URL}${bus.imagePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--primary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Image size={14} />
                            View
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No image</span>
                        )}
                      </td>
                      <td>{bus.amenities?.join(', ') || '-'}</td>
                      <td><span className={`status-badge ${bus.status || 'active'}`}>{bus.status || 'active'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button variant="ghost" size="small" onClick={() => openEditModal(bus)}><Edit2 size={16} /></Button>
                          <Button variant="ghost" size="small" onClick={() => deleteBus(bus._id)} style={{ color: 'var(--error)' }}><Trash2 size={16} /></Button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingBus ? 'Edit Bus' : 'Add Bus'}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <Input label="Bus Number" error={errors.busNumber?.message} {...register('busNumber')} />
            <Select label="Bus Type" error={errors.type?.message} {...register('type')}>
              <option value="">Select Type</option>
              <option value="AC Sleeper">AC Sleeper</option>
              <option value="Non-AC Sleeper">Non-AC Sleeper</option>
              <option value="AC Seater">AC Seater</option>
              <option value="Non-AC Seater">Non-AC Seater</option>
              <option value="Luxury Coach">Luxury Coach</option>
              <option value="Mini Bus">Mini Bus</option>
              <option value="Tempo Traveller">Tempo Traveller</option>
            </Select>
          </div>
          <div className="form-row" style={{ marginTop: '1rem' }}>
            <Input label="Capacity" type="number" error={errors.capacity?.message} {...register('capacity')} />
            <Input label="Price Per Day (₹)" type="number" error={errors.pricePerDay?.message} {...register('pricePerDay')} />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Input label="Amenities (comma separated)" placeholder="WiFi, TV, Charging Points" {...register('amenities')} />
          </div>

          {/* Bus Image Upload */}
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              Bus Image
            </label>
            {imagePreview ? (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.75rem' }}>
                <img
                  src={imagePreview}
                  alt="Bus preview"
                  style={{
                    width: '100%',
                    maxHeight: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : null}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '1.25rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
                background: 'var(--bg-secondary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <Upload size={24} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {imagePreview ? 'Click to change image' : 'Click to upload bus image'}
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                JPG, PNG up to 5MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </div>

          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingBus ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
