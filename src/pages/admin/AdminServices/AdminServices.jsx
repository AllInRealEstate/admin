import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { toast } from 'react-toastify';
import { getOptimizedServices, deleteService } from '../../../services/ServicesApi.js';
import './AdminServices.css';
import DeleteConfirmModal from '../../../utils/DeleteConfirmModal/DeleteConfirmModal.jsx';

const AdminServices = () => {
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
  } = useInfiniteQuery({
    queryKey: ['services', searchQuery], // Refetch when search changes
    queryFn: ({ pageParam = 1 }) => {
      return getOptimizedServices({
        pageParam,
        filters: {
          search: scope === 'services' ? searchQuery : '',
          lang: 'en' // Default to English for Admin view
        }
      });
    },
    getNextPageParam: (lastPage) => {
      // Check if there is a next page based on backend response
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    },
  });

  // Flatten the pages into a single list
  const allServices = data?.pages.flatMap((page) => page.data) || [];

  // Trigger next page load when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage]);

  // ---------------------------
  // 2. MUTATIONS (Delete)
  // ---------------------------
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['services']); // Refresh list
      toast.success('Service deleted successfully');
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete service')
  });

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  // Helper to safely get nested translation data
  const getLoc = (service, field) => {
    return service.translations?.en?.[field] || "N/A";
  };

  // ---------------------------
  // 3. RENDER
  // ---------------------------
  if (status === 'pending') {
    return <div className="admin-page"><div className="admin-loading">Loading services...</div></div>;
  }

  if (status === 'error') {
    return <div className="admin-page"><div className="admin-error">Error loading services</div></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Services</h1>
          <p>Manage your service offerings</p>
          {searchQuery && scope === 'services' && (
            <p className="search-results-count">
              Showing {allServices.length} results
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={() => navigate('/admin/services/new')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
          Add Service
        </button>
      </div>

      {allServices.length === 0 ? (
        <div className="admin-empty">
          <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor" opacity="0.3">
            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" />
          </svg>
          <h3>{searchQuery ? 'No services match your search' : 'No services yet'}</h3>
          <p>{searchQuery ? 'Try adjusting your search query' : 'Create your first service offering'}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="admin-table-container desktop-only">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Icon</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allServices.map((service) => (
                  <tr key={service._id}>
                    <td>#{service.order}</td>
                    <td>
                      <img
                        src={service.icon}
                        alt={getLoc(service, 'title')}
                        className="table-image"
                      />
                    </td>
                    <td className="font-semibold">{getLoc(service, 'title')}</td>
                    <td style={{ maxWidth: '300px' }}>
                      {getLoc(service, 'description')?.substring(0, 60)}...
                    </td>
                    <td>
                      <span className={`badge badge-${service.active ? 'active' : 'inactive'}`}>
                        {service.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => navigate(`/admin/services/${service._id}/edit`)}
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => setDeleteConfirm({ id: service._id, name: getLoc(service, 'title') })}
                          title="Delete"
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
            {allServices.map((service) => (
              <div key={service._id} className="service-card">
                <div className="card-header">
                  <div className="service-icon">
                    <img src={service.icon} alt={getLoc(service, 'title')} />
                  </div>
                  <div className="service-order">#{service.order}</div>
                </div>

                <div className="card-content">
                  <h3 className="card-title">{getLoc(service, 'title')}</h3>
                  <p className="card-description">{getLoc(service, 'description')}</p>

                  <div className="card-status">
                    <span className={`badge badge-${service.active ? 'active' : 'inactive'}`}>
                      {service.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="mobile-card-actions-grid">
                  <button
                    className="mobile-action-btn-edit"
                    onClick={() => navigate(`/admin/services/${service._id}/edit`)}
                    title="Edit"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>

                  <button
                    className="mobile-action-btn-delete"
                    onClick={() =>
                      setDeleteConfirm({
                        id: service._id,
                        name: getLoc(service, 'title')
                      })
                    }
                    title="Delete"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Service"
        itemName={deleteConfirm?.name}
        itemType="Service"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminServices;