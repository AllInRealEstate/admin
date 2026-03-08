// src/pages/admin/AdminProjects/AdminProjects.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { toast } from 'react-toastify';
import {
  getOptimizedProjects,
  toggleProjectFeatured,
  deleteProject
} from '../../../services/ProjectsApi'; // <--- NEW SERVICE
import './AdminProjects.css';
import DeleteConfirmModal from '../../../utils/DeleteConfirmModal/DeleteConfirmModal';


const AdminProjects = () => {
  const { searchQuery, scope } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ---------------------------
  // 1. INFINITE SCROLL SETUP
  // ---------------------------
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useInfiniteQuery({
    queryKey: ['projects', searchQuery], // Refetch when search changes
    queryFn: ({ pageParam = 1 }) => {
      return getOptimizedProjects({
        pageParam,
        filters: {
          search: scope === 'projects' ? searchQuery : '',
          lang: 'en' // Default to English for Admin
        }
      });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    },
  });

  // Flatten pages into one list
  const allProjects = data?.pages.flatMap((page) => page.data) || [];

  // Auto-scroll trigger
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage]);

  // ---------------------------
  // 2. MUTATIONS
  // ---------------------------
  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, currentStatus }) => toggleProjectFeatured(id, currentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast.success('Featured status updated');
    },
    onError: () => toast.error('Failed to update featured status')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast.success('Project deleted successfully');
      setDeleteConfirm(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete project')
  });

  // ---------------------------
  // 3. HELPERS
  // ---------------------------
  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  // Helper to safely get nested translation data
  const getLoc = (project, field) => {
    return project.translations?.en?.[field] || "N/A";
  };

  // ---------------------------
  // 4. RENDER
  // ---------------------------
  if (status === 'pending') {
    return <div className="admin-page"><div className="admin-loading">Loading projects...</div></div>;
  }

  if (status === 'error') {
    return <div className="admin-page"><div className="admin-error">Error loading projects</div></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Projects</h1>
          <p>Manage your real estate projects</p>
          {searchQuery && scope === 'projects' && (
            <p className="search-results-count">
              Showing results for "{searchQuery}"
            </p>
          )}
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/admin/projects/new')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
          Add Project
        </button>
      </div>

      {allProjects.length === 0 ? (
        <div className="admin-empty">
          <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor" opacity="0.3">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
          </svg>
          <h3>{searchQuery ? 'No projects match your search' : 'No projects yet'}</h3>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="admin-table-container desktop-only">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allProjects.map((project) => (
                  <tr key={project._id}>
                    <td>
                      {project.mainImage ? (
                        <img
                          src={project.mainImage}
                          alt={getLoc(project, 'title')}
                          className="table-image"
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </td>
                    <td className="font-semibold">
                      {getLoc(project, 'title')}
                      {project.badge && (
                        <span className={`badge-sample ${project.badge}`}>
                          {project.badge}
                        </span>
                      )}
                    </td>
                    <td>{getLoc(project, 'location')}</td>
                    <td>
                      {project.price && project.price > 0
                        ? `${project.currency || 'ILS'} ${Number(project.price).toLocaleString()}`
                        : '--'}
                    </td>
                    <td>
                      <span className={`badge badge-${project.type}`}>
                        {project.type === 'forSale' && 'For Sale'}
                        {project.type === 'forRent' && 'For Rent'}
                        {project.type === 'sold' && 'Sold'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${project.status}`}>
                        {project.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-icon"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onClick={() => toggleFeaturedMutation.mutate({
                          id: project._id,
                          currentStatus: project.featured
                        })}
                        disabled={toggleFeaturedMutation.isPending}
                      >
                        {project.featured ? (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="#D4AF37" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        ) : (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        )}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => navigate(`/admin/projects/${project._id}/edit`)}
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => setDeleteConfirm({ id: project._id, name: getLoc(project, 'title') })}
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="cards-grid mobile-only">
            {allProjects.map((project) => (
              <div key={project._id} className="project-card">
                <div className="card-image">
                  {project.mainImage ? (
                    <img src={project.mainImage} alt={getLoc(project, 'title')} />
                  ) : (
                    <div className="no-image-placeholder">No Image</div>
                  )}
                  {project.badge && (
                    <span className={`project-badge badge-${project.badge}`}>
                      {project.badge}
                    </span>
                  )}
                  {project.featured && (
                    <span className="featured-badge">⭐ Featured</span>
                  )}
                </div>

                <div className="card-content">
                  <h3 className="card-title">{getLoc(project, 'title')}</h3>
                  <p className="card-location">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                    {getLoc(project, 'location')}
                  </p>

                  {project.price && (
                    <p className="card-price">
                      {project.currency || 'ILS'} {Number(project.price).toLocaleString()}
                    </p>
                  )}

                  <div className="card-badges">
                    <span className={`badge badge-${project.type}`}>
                      {project.type === 'forSale' ? 'For Sale' : project.type === 'forRent' ? 'For Rent' : 'Sold'}
                    </span>
                    <span className={`badge badge-${project.status}`}>
                      {project.status}
                    </span>
                  </div>
                </div>

                <div className="mobile-card-actions-grid">
                  <button
                    className="mobile-action-btn-edit"
                    onClick={() => navigate(`/admin/projects/${project._id}/edit`)}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>

                  <button
                    className="mobile-action-btn-delete"
                    /* FIX: Use setDeleteConfirm like the desktop view */
                    onClick={() => setDeleteConfirm({
                      id: project._id,
                      name: getLoc(project, 'title')
                    })}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll Trigger */}
          <div ref={ref} className="scroll-trigger" style={{ height: '20px', display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            {isFetchingNextPage && (
              <div className="spinner-small" style={{ width: '24px', height: '24px', border: '3px solid #f3f3f3', borderTop: '3px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            )}
          </div>
        </>
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        itemName={deleteConfirm?.name}
        itemType="project"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminProjects;