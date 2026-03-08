import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { toast } from 'react-toastify';
import {
  getOptimizedReviews,
  deleteReview,
  toggleReviewActive,
  updateReviewStatus
} from '../../../services/ReviewsApi.js';
import './AdminReviews.css';
import DeleteConfirmModal from '../../../utils/DeleteConfirmModal/DeleteConfirmModal.jsx';
import ReviewViewModal from './ReviewViewModal.jsx';
import { useAuth } from "../../../context/AuthContext";

const AdminReviews = () => {
  const { searchQuery, scope } = useOutletContext();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewReview, setViewReview] = useState(null);

  // Get user role
  const getUserRole = () => {
    const role = useAuth().admin?.role;

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.role || user.userRole;
      } catch (e) { }
    }

    return role || 'admin';
  };

  const userRole = getUserRole();
  const isSuperAdmin = userRole === 'superadmin' || userRole === 'SUPERADMIN';

  // Infinite Scroll
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['reviews', searchQuery],
    queryFn: ({ pageParam = 1 }) => {
      return getOptimizedReviews({
        pageParam,
        filters: {
          search: scope === 'reviews' ? searchQuery : '',
          active: 'all'
        }
      });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) return lastPage.page + 1;
      return undefined;
    },
  });

  const allReviews = data?.pages.flatMap((page) => page.data) || [];

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage]);

  // Approve/Reject Status Change
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateReviewStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['reviews']);
      toast.success(`Review ${variables.status === 'approved' ? 'approved' : 'rejected'}`);
      if (viewReview && viewReview._id === variables.id) {
        setViewReview(null); // Close modal on decision
      }
    },
    onError: () => toast.error('Failed to update status')
  });

  // Toggle Active State
  const toggleMutation = useMutation({
    mutationFn: (id) => toggleReviewActive(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['reviews']);
      const isActive = response.data.active;
      toast.success(isActive ? 'Review is now visible on website' : 'Review hidden from website');
    },
    onError: () => toast.error('Failed to toggle active state')
  });

  // Delete Review
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews']);
      toast.success('Review deleted permanently');
      setDeleteConfirm(null);
      setViewReview(null);
    },
    onError: () => toast.error('Failed to delete review')
  });

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  // Helpers
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <svg key={i} width="18" height="18" viewBox="0 0 20 20" fill={i < rating ? '#d4af37' : '#e5e7eb'}>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const getContent = (review) => {
    if (review.translations?.en?.text) return review.translations.en;
    const original = review.originalLanguage || 'en';
    return review.translations?.[original] || {};
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'pending') return <div className="admin-loading">Loading Reviews...</div>;
  if (status === 'error') return <div className="admin-error">Error loading reviews</div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Review Management</h1>
          <p>View and manage customer reviews</p>
        </div>
      </div>

      {allReviews.length === 0 ? (
        <div className="admin-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <h3>No reviews found</h3>
          <p>Waiting for users to submit their feedback.</p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="admin-table-container desktop-only">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '15%', textAlign: 'center' }}>Date & Time</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Rating</th>
                  <th style={{ width: '25%' , textAlign: 'left'}}>Review Text</th>
                  <th style={{ width: '20%', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allReviews.map((review) => {
                  const content = getContent(review);
                  const isApproved = review.status === 'approved';
                  const isPending = review.status === 'pending';

                  return (
                    <tr key={review._id}>
                      {/* Date & Time */}
                      <td className="date-cell">
                        {formatDate(review.createdAt)}
                      </td>

                      {/* Status Column (Moved here) */}
                      <td>
                        {isApproved ? (
                          <button
                            className={`status-toggle ${review.active ? 'status-toggle-active' : 'status-toggle-inactive'}`}
                            onClick={() => toggleMutation.mutate(review._id)}
                            disabled={toggleMutation.isPending}
                          >
                            <span className="toggle-switch-inline">
                              <span className="toggle-dot"></span>
                            </span>
                            <span className="toggle-text">
                              {review.active ? 'Active' : 'Inactive'}
                            </span>
                          </button>
                        ) : (
                          <span className={`badge badge-${review.status}`}>
                            {review.status === 'pending' ? '🟡 Pending' : '🔴 Rejected'}
                          </span>
                        )}
                      </td>

                      {/* Rating */}
                      <td>
                        <div className="stars-container">
                          {renderStars(review.rating)}
                        </div>
                      </td>

                      {/* Review Text Preview */}
                      <td className="review-preview">
                        "{content.text?.substring(0, 100)}{content.text?.length > 100 ? '...' : ''}"
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="action-buttons-centered">
                          {/* Pending Actions: Approve / Reject */}
                          {isPending ? (
                            <>
                              <button
                                className="btn-icon btn-approve"
                                onClick={() => statusMutation.mutate({ id: review._id, status: 'approved' })}
                                title="Approve"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </button>
                              <button
                                className="btn-icon btn-reject"
                                onClick={() => statusMutation.mutate({ id: review._id, status: 'rejected' })}
                                title="Reject"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </>
                          ) : null}

                          {/* Always show View */}
                          <button
                            className="btn-icon btn-view"
                            onClick={() => setViewReview(review)}
                            title="View Details"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>

                          {/* SuperAdmin Delete */}
                          {isSuperAdmin && (
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => setDeleteConfirm({ id: review._id, name: content.author })}
                              title="Delete Permanently"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="mobile-only">
            {allReviews.map((review) => {
              const content = getContent(review);
              const isApproved = review.status === 'approved';

              return (
                <div key={review._id} className="review-card">
                  {/* Date */}
                  <div className="card-header">
                    <span className="date-text">{formatDate(review.createdAt)}</span>
                    <div className="stars-container">
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  {/* Review Text */}
                  <div className="card-text">
                    "{content.text}"
                  </div>

                  {/* Status */}
                  <div className="card-status">
                    {isApproved ? (
                      <button
                        className={`toggle-switch-mobile ${review.active ? 'active' : ''}`}
                        onClick={() => toggleMutation.mutate(review._id)}
                        disabled={toggleMutation.isPending}
                      >
                        <span className="toggle-slider-mobile"></span>
                        <span className="toggle-label-mobile">
                          {review.active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    ) : (
                      <span className={`badge badge-${review.status}`}>
                        {review.status === 'pending' ? '🟡 Pending' : '🔴 Rejected'}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="card-actions">
                    <button
                      className="btn-action btn-view-full"
                      onClick={() => setViewReview(review)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      View Details
                    </button>

                    {isSuperAdmin && (
                      <button
                        className="btn-action btn-delete-full"
                        onClick={() => setDeleteConfirm({ id: review._id, name: content.author })}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite Scroll Trigger */}
          <div ref={ref} className="scroll-trigger">
            {isFetchingNextPage && <div className="loading-more">Loading more...</div>}
          </div>
        </>
      )}

      {/* View Modal */}
      {viewReview && (
        <ReviewViewModal
          review={viewReview}
          onClose={() => setViewReview(null)}
          onToggleActive={(id) => toggleMutation.mutate(id)}
          onStatusChange={(id, status) => statusMutation.mutate({ id, status })} // New Prop
          onDelete={(id, name) => setDeleteConfirm({ id, name })}
          isSuperAdmin={isSuperAdmin}
          isToggling={toggleMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Review Permanently"
        itemName={deleteConfirm?.name}
        itemType="review"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminReviews;