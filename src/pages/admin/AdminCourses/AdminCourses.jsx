// src/pages/admin/AdminCourses/AdminCourses.jsx
import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { toast } from 'react-toastify';
import { getOptimizedCourses, deleteCourse } from '../../../services/CoursesApi.js';
import './AdminCourses.css';
import DeleteConfirmModal from '../../../utils/DeleteConfirmModal/DeleteConfirmModal.jsx';

const AdminCourses = () => {
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
    status
  } = useInfiniteQuery({
    queryKey: ['courses', searchQuery],
    queryFn: ({ pageParam = 1 }) =>
      getOptimizedCourses({
        pageParam,
        filters: {
          search: scope === 'courses' ? searchQuery : '',
          lang: 'en',
          active: 'all',
          limit: 10
        }
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    }
  });

  // Flatten all pages
  const allCourses = data?.pages.flatMap((page) => page.data) || [];
  const totalCourses = data?.pages?.[0]?.total ?? allCourses.length;

  // Trigger next page when scroll reaches sentinel
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // ---------------------------
  // 2. DELETE MUTATION
  // ---------------------------
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      toast.success('Course deleted successfully!');
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error('Failed to delete course');
    }
  });

  const handleDeleteConfirm = () => {
    if (deleteConfirm?.id) {
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  // ---------------------------
  // 3. RENDER STATES
  // ---------------------------
  if (status === 'pending') {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading courses...</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="admin-page">
        <div className="admin-error">Error loading courses</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Courses</h1>
          <p>Manage your educational courses</p>
          {searchQuery && scope === 'courses' && (
            <p className="search-results-count">
              Found {allCourses.length} of {totalCourses} courses
            </p>
          )}
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/admin/courses/new')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
            />
          </svg>
          Add Course
        </button>
      </div>

      {allCourses.length === 0 ? (
        <div className="admin-empty">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.3"
          >
            <path d="M22 10v6M2 10v6M12 2l8.5 5-8.5 5-8.5-5L12 2z" />
            <path d="M2 10l10 5 10-5" />
            <path d="M12 22V17" />
          </svg>
          <h3>{searchQuery ? 'No courses match your search' : 'No courses yet'}</h3>
          <p>{searchQuery ? 'Try adjusting your search query' : 'Create your first course'}</p>
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
                  <th>Instructor</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allCourses.map((course) => (
                  <tr key={course._id}>
                    <td>
                      {course.image ? (
                        <img
                          src={course.image}
                          alt={course.title}
                          className="table-image"
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </td>
                    <td className="font-semibold">{course.title}</td>
                    <td>{course.instructor}</td>
                    <td>{course.duration}</td>
                    <td>
                      {course.price && course.price > 0 && (
                        <span className="course-price-badge">
                          {`${course.currency} ${Number(
                            course.price
                          ).toLocaleString()}`}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${course.active ? 'active' : 'inactive'
                          }`}
                      >
                        {course.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() =>
                            navigate(`/admin/courses/${course._id}/edit`)
                          }
                          title="Edit"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() =>
                            setDeleteConfirm({
                              id: course._id,
                              name: course.title
                            })
                          }
                          title="Delete"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            />
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
            {allCourses.map((course) => (
              <div key={course._id} className="course-card">
                <div className="card-image">
                  {course.image ? (
                    <img src={course.image} alt={course.title} />
                  ) : (
                    <div className="no-image-placeholder">No Image</div>
                  )}
                  <span className="course-price-badge">
                    {course.price > 0
                      ? `${course.currency} ${Number(
                        course.price
                      ).toLocaleString()}`
                      : 'Free'}
                  </span>
                </div>

                <div className="card-content">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <h3 className="card-title">{course.title}</h3>
                    <span
                      className={`badge badge-${course.active ? 'active' : 'inactive'
                        }`}
                    >
                      {course.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="card-instructor">By {course.instructor}</p>

                  <div className="card-details">
                    <div className="detail-item">
                      <span className="detail-label">Duration</span>
                      <span className="detail-value">{course.duration}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Level</span>
                      <span className="detail-value">{course.level}</span>
                    </div>
                  </div>
                </div>

                <div className="mobile-card-actions-grid">
                  <button
                    className="mobile-action-btn-edit"
                    onClick={() => navigate(`/admin/courses/${course._id}/edit`)}
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
                        id: course._id,
                        name: course.title
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
          <div
            ref={ref}
            className="scroll-trigger"
            style={{
              height: '20px',
              display: 'flex',
              justifyContent: 'center',
              marginTop: '20px'
            }}
          >
            {isFetchingNextPage && (
              <div
                className="spinner-small"
                style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid #f3f3f3',
                  borderTop: '3px solid #3498db',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              ></div>
            )}
          </div>
        </>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Course"
        itemName={deleteConfirm?.name}
        itemType="course"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminCourses;
