import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { 
  getTestimonialById, 
  createTestimonial, 
  updateTestimonial 
} from '../../../services/ReviewsApi.js';
import TestimonialForm from './TestimonialForm.jsx';
import './TestimonialFormPage.css';

const TestimonialFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  // 1. Fetch Data
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['testimonial', id],
    queryFn: () => getTestimonialById(id),
    enabled: isEditMode,
    refetchOnWindowFocus: false,
  });

  // 2. Save Data
  const mutation = useMutation({
    mutationFn: (formData) => {
      if (isEditMode) {
        return updateTestimonial(id, formData);
      } else {
        return createTestimonial(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['testimonials']); // Refresh list
      if (isEditMode) queryClient.invalidateQueries(['testimonial', id]);
      
      toast.success(isEditMode ? 'Testimonial updated!' : 'Testimonial created!');
      navigate('/admin/testimonials');
    },
    onError: (error) => {
      console.error("Save failed:", error);
      toast.error('Failed to save testimonial');
    }
  });

  const handleSubmit = (formData) => {
    mutation.mutate(formData);
  };

  const handleCancel = () => {
    navigate('/admin/testimonials');
  };

  if (isLoading) {
    return (
      <div className="testimonial-form-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="testimonial-form-page">
      <div className="form-page-header">
        <button className="back-button" onClick={() => navigate('/admin/testimonials')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
          </svg>
          Back to Reviews
        </button>
        <div>
          <h1>{isEditMode ? 'Edit Review' : 'Add New Review'}</h1>
          <p>{isEditMode ? 'Update customer testimonial' : 'Create a new customer review'}</p>
        </div>
      </div>

      <div className="admin-form-card">
        <TestimonialForm
          key={isEditMode ? initialData?._id : 'new'}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={mutation.isPending}
        />
      </div>
    </div>
  );
};

export default TestimonialFormPage;