import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useSocket } from '../../../hooks/useSocket';

import {
  getOptimizedAdmins,
  deleteAdminUser,
  updateAdminUser,
  getOnlineUsers
} from '../../../services/AdminUsersApi';

import { useAuth } from '../../../context/AuthContext';
import './AdminManagement.css';

const AdminUsers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { admin: currentAdmin } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { searchQuery, scope } = useOutletContext();

  // Infinite Scroll Trigger
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    triggerOnce: false
  });

  // -------------------------
  //  REAL-TIME ONLINE USERS (Socket Presence)
  // -------------------------
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());

  // -------------------------
  //  REAL-TIME ONLINE USERS (HARDENED)
  // -------------------------
  const lastOnlineUpdateRef = useRef(0);

  useSocket('online_users_update', (payload) => {
    // Defensive guards
    if (!payload || !Array.isArray(payload.users)) return;

    // Prevent flicker from stale reconnect events
    const now = Date.now();
    if (now - lastOnlineUpdateRef.current < 500) return;
    lastOnlineUpdateRef.current = now;

    // Normalize IDs as strings
    const ids = new Set(
      payload.users
        .map((u) => u?.userId)
        .filter(Boolean)
        .map((id) => String(id))
    );

    // Do not wipe state unless backend explicitly sends empty list
    setOnlineUserIds((prev) => {
      if (ids.size === 0 && prev.size > 0) return prev;
      return ids;
    });
  });

  //  seed initial online list (superadmin only)
  useEffect(() => {
    const isSuperadmin = currentAdmin?.role === 'superadmin';
    if (!isSuperadmin) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await getOnlineUsers();
        if (cancelled) return;

        const ids = new Set((data?.users || []).map((u) => String(u.userId)));
        setOnlineUserIds(ids);
      } catch {
        // silent fail: page still works via socket updates
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentAdmin?.role]);


  //  TRUE online = socket presence only
  const isSocketOnline = (user) => {
    if (!user || !user._id) return false;
    return onlineUserIds.has(String(user._id));
  };

  //  Optional fallback: user was active recently (NOT real-time online)
  const isRecentlyActive = (user) => {
    if (!user?.lastActive) return false;
    const date = new Date(user.lastActive);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    return diffInSeconds < 300; // 5 minutes
  };


  const formatLastActive = (lastActive) => {
    if (!lastActive) return 'Never';

    const date = new Date(lastActive);
    if (Number.isNaN(date.getTime())) return 'Never';

    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;

    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };


  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Avatar Renderer
  const renderAvatar = (user) => {
    if (user.workerProfile?.image) {
      return (
        <img
          src={user.workerProfile.image}
          alt={user.firstName}
          className="avatar-image"
        />
      );
    }
    return getInitials(user.firstName, user.lastName);
  };

  // --- 2. DATA FETCHING ---
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['adminUsers', searchQuery],
    queryFn: ({ pageParam = 1 }) =>
      getOptimizedAdmins({
        pageParam,
        search: scope === 'users' ? searchQuery : ''
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.totalPages) return undefined;
      const nextPage = lastPage.page + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
    staleTime: 0, 
    refetchOnMount: 'always'
  });

  const users = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items || []);
  }, [data]);

  // Handle Load More
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Show Error Toast
  useEffect(() => {
    if (isError && error) {
      toast.error(error.message || 'Failed to load users');
    }
  }, [isError, error]);

  // --- 3. MUTATIONS ---

  // Suspend/Unsuspend Mutation
  const suspendMutation = useMutation({
    mutationFn: ({ id, isSuspended }) => updateAdminUser(id, { isSuspended }),
    onMutate: async ({ id, isSuspended }) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: ['adminUsers', searchQuery] });
      const previousData = queryClient.getQueryData(['adminUsers', searchQuery]);

      queryClient.setQueryData(['adminUsers', searchQuery], (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            items: page.items.map(user =>
              user._id === id ? { ...user, isSuspended } : user
            )
          }))
        };
      });
      return { previousData };
    },
    onSuccess: (_, variables) => {
      const status = variables.isSuspended ? 'suspended' : 'activated';
      toast.success(`User has been ${status}`);
      queryClient.invalidateQueries({ queryKey: ['adminUsers', searchQuery] });
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['adminUsers', searchQuery], context.previousData);
      toast.error('Failed to update status');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminUser(id),
    onSuccess: () => {
      toast.success('Admin user deleted successfully');
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['adminUsers', searchQuery] });
    },
    onError: (error) => toast.error(error.message || 'Failed to delete user')
  });

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm._id);
    }
  };

  const hasUsers = users && users.length > 0;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Security & Team</h1>
          <p>Monitor team activity and manage access</p>
        </div>

        <button className="btn-primary" onClick={() => navigate('/admin/users/new')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
          Add Admin
        </button>
      </div>

      {isLoading ? (
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Loading security data...</p>
        </div>
      ) : !hasUsers ? (
        <div className="admin-empty">
          <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor" opacity="0.3">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <h3>No Admin Users Found</h3>
          <p>Get started by creating your first admin user</p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="admin-table-container desktop-only">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Profile</th>
                  <th style={{ width: '12%' }}>Role</th>
                  <th style={{ width: '15%' }}>Account</th>
                  <th style={{ width: '20%' }}>Availability</th>
                  <th style={{ width: '28%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isMe = (currentAdmin?._id || currentAdmin?.id) === user._id;

                  const isSuspended = user.isSuspended;

                  const isOnline = isSocketOnline(user);
                  const recentlyActive = isRecentlyActive(user);

                  return (
                    <tr key={user._id} className={isSuspended ? 'row-suspended' : ''}>
                      {/* Profile & Avatar */}
                      <td>
                        <div className="user-name">
                          <div className={`user-avatar ${isOnline ? 'avatar-online' : 'avatar-offline'}`}>
                            {renderAvatar(user)}
                            <span className="avatar-status-dot"></span>
                          </div>
                          <div>
                            <div className="name-primary">
                              {user.firstName} {user.lastName}
                            </div>
                            {isMe && <span className="current-user-badge">You</span>}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td>
                        <span className={`badge ${user.role === 'superadmin' ? 'badge-superadmin' : 'badge-admin'}`}>
                          {user.role === 'superadmin' ? '⭐ Super' : 'Admin'}
                        </span>
                      </td>

                      {/* Account Status (Kill Switch) */}
                      <td>
                        <span className={`status-pill ${isSuspended ? 'status-suspended' : 'status-active'}`}>
                          {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                        </span>
                      </td>

                      {/* Availability (Pulse) */}
                      <td>
                        <div className="availability-cell">
                          {isOnline ? (
                            <span className="text-online">
                              <span className="dot-pulse"></span> Online
                            </span>
                          ) : recentlyActive ? (
                            <span className="text-warn">
                              Recently Active <span className="text-muted">({formatLastActive(user.lastActive)})</span>
                            </span>
                          ) : (
                            <span className="text-offline">
                              Offline <span className="text-muted">({formatLastActive(user.lastActive)})</span>
                            </span>
                          )}
                        </div>
                      </td>


                      {/* Actions */}
                      <td>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>

                          {/* Suspend Toggle (Disabled for self) */}
                          {!isMe && (
                            <button
                              className={`btn-icon ${isSuspended ? 'btn-unsuspend' : 'btn-suspend'}`}
                              onClick={() => suspendMutation.mutate({ id: user._id, isSuspended: !isSuspended })}
                              title={isSuspended ? "Unsuspend Account" : "Suspend Account"}
                              disabled={suspendMutation.isPending}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                                <line x1="12" y1="2" x2="12" y2="12"></line>
                              </svg>
                            </button>
                          )}

                          {/* View Details (Eye) */}
                          <button
                            className="btn-icon btn-view"
                            onClick={() => navigate(`/admin/users/edit/${user._id}`)}
                            title="View Details"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>

                          {/* Delete */}
                          {!isMe && (
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => setDeleteConfirm(user)}
                              title="Delete User"
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

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef} className="scroll-trigger">
              {isFetchingNextPage && 'Loading more users...'}
            </div>
          </div>

          {/* MOBILE CARDS */}
          <div className="cards-grid mobile-only">
            {users.map((user) => {
              const isMe = (currentAdmin?._id || currentAdmin?.id) === user._id;


              const isOnline = isSocketOnline(user);
              const recentlyActive = isRecentlyActive(user);

              return (
                <div key={user._id} className={`admin-card ${user.isSuspended ? 'card-suspended' : ''}`}>
                  <div className="card-header">
                    <div className="user-name">
                      <div className={`user-avatar ${isOnline ? 'avatar-online' : 'avatar-offline'}`}>
                        {renderAvatar(user)}
                        <span className="avatar-status-dot"></span>
                      </div>
                    </div>
                    <span className={`status-pill ${user.isSuspended ? 'status-suspended' : 'status-active'}`}>
                      {user.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                    </span>
                  </div>

                  <div className="card-content">
                    <div className="card-title">
                      {user.firstName} {user.lastName}
                      {isMe && <span className="current-user-badge">You</span>}
                      <span className="role-text-small">{user.role}</span>
                    </div>
                    <div className="card-info-item">
                      {isOnline ? (
                        <span className="text-online">
                          <span className="dot-pulse"></span> Online Now
                        </span>
                      ) : recentlyActive ? (
                        <span className="text-warn">
                          Recently Active ({formatLastActive(user.lastActive)})
                        </span>
                      ) : (
                        <span className="text-offline">
                          Offline ({formatLastActive(user.lastActive)})
                        </span>
                      )}
                    </div>

                    <div className="card-info-item" style={{ marginTop: '0.5rem' }}>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      {user.email}
                    </div>
                  </div>

                  <div className="mobile-card-actions-grid">
                    <button className="mobile-action-btn-edit" onClick={() => navigate(`/admin/users/edit/${user._id}`)}>
                      View / Edit
                    </button>

                    {!isMe && (
                      <>
                        <button
                          className={user.isSuspended ? "mobile-action-btn-success" : "mobile-action-btn-suspend"}
                          onClick={() => suspendMutation.mutate({ id: user._id, isSuspended: !user.isSuspended })}
                          disabled={suspendMutation.isPending}
                        >
                          {user.isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                        <button className="mobile-action-btn-delete" onClick={() => setDeleteConfirm(user)}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef} className="scroll-trigger">
              {isFetchingNextPage && 'Loading...'}
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">
                <svg width="48" height="48" viewBox="0 0 20 20" fill="#f59e0b">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                </svg>
              </div>
              <p>
                Are you sure you want to delete <strong>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong>?
              </p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;