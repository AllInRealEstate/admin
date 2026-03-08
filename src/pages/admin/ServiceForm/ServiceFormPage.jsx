import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // <--- React Query
import { toast } from 'react-toastify';
import { 
  getServiceById, 
  createService, 
  updateService 
} from '../../../services/ServicesApi'; // <--- Use our new Service
import ServiceForm from './ServiceForm';
import './ServiceFormPage.css';

const ServiceFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  // ---------------------------
  // 1. FETCH DATA (Optimized)
  // ---------------------------
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => getServiceById(id),
    enabled: isEditMode, // Only fetch if editing
    refetchOnWindowFocus: false,
  });

  // ---------------------------
  // 2. SAVE DATA (Mutation)
  // ---------------------------
  const mutation = useMutation({
    mutationFn: (formData) => {
      // ServicesApi functions already handle headers and FormData
      if (isEditMode) {
        return updateService(id, formData);
      } else {
        return createService(formData);
      }
    },
    onSuccess: () => {
      // ✅ Refresh the main list immediately
      queryClient.invalidateQueries(['services']);
      
      // If editing, also refresh this specific service
      if (isEditMode) {
        queryClient.invalidateQueries(['service', id]);
      }

      toast.success(isEditMode ? 'Service updated successfully!' : 'Service created successfully!');
      navigate('/admin/services');
    },
    onError: (error) => {
      console.error("Save failed:", error);
      toast.error(error.response?.data?.error || 'Failed to save service');
    }
  });

  const handleSubmit = (formData) => {
    mutation.mutate(formData);
  };

  const handleCancel = () => {
    navigate('/admin/services');
  };

  // ---------------------------
  // 3. RENDER
  // ---------------------------
  if (isLoading) {
    return (
      <div className="service-form-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading service data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="service-form-page">
      <div className="form-page-header">
        <button className="back-button" onClick={() => navigate('/admin/services')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
          </svg>
          Back to Services
        </button>

        <div>
          <h1>{isEditMode ? 'Edit Service' : 'Add New Service'}</h1>
          <p>{isEditMode ? 'Update service information' : 'Create a new service offering'}</p>
        </div>
      </div>

      <div className="admin-form-card">
        {/* Key Reset Pattern: Ensures form re-initializes when data arrives */}
        <ServiceForm
          key={isEditMode ? initialData?._id : 'new'}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={mutation.isPending} // Pass loading state
        />
      </div>
    </div>
  );
};

export default ServiceFormPage;