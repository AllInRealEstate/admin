import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { 
  getReviewById, 
  createReview, 
  updateReview 
} from '../../../services/ReviewsApi.js';
import ReviewsForm from './ReviewsForm.jsx';
import './ReviewsFormPage.css';

const ReviewsFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  // 1. Fetch Data
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['review', id], // ✅ Changed to 'review'
    queryFn: () => getReviewById(id),
    enabled: isEditMode,
    refetchOnWindowFocus: false,
  });

  // 2. Save Data
  const mutation = useMutation({
    mutationFn: (formData) => {
      if (isEditMode) {
        return updateReview(id, formData);
      } else {
        return createReview(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews']); // Refresh list
      if (isEditMode) queryClient.invalidateQueries(['review', id]);
      
      toast.success(isEditMode ? 'Review updated!' : 'Review created!');
      navigate('/admin/reviews');
    },
    onError: (error) => {
      console.error("Save failed:", error);
      toast.error('Failed to save review');
    }
  });

  const handleSubmit = (formData) => {
    mutation.mutate(formData);
  };

  const handleCancel = () => {
    navigate('/admin/reviews');
  };

  if (isLoading) {
    return (
      <div className="review-form-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-form-page">
      <div className="form-page-header">
        <button className="back-button" onClick={() => navigate('/admin/reviews')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
          </svg>
          Back to Reviews
        </button>
        <div>
          <h1>{isEditMode ? 'Edit Review' : 'Add New Review'}</h1>
          <p>{isEditMode ? 'Update customer review' : 'Create a new customer review'}</p>
        </div>
      </div>

      <div className="admin-form-card">
        <ReviewsForm
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

export default ReviewsFormPage;