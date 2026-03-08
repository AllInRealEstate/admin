// src/pages/admin/CourseForm/CourseFormPage.jsx
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  getCourseById,
  createCourse,
  updateCourse
} from '../../../services/CoursesApi';
import CourseForm from './CourseForm';
import './CourseFormPage.css';

const CourseFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  // ----------------------------------------
  // 1. LOAD COURSE IF IN EDIT MODE
  // ----------------------------------------
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => getCourseById(id),
    enabled: isEditMode,
    refetchOnWindowFocus: false,
  });

  // ----------------------------------------
  // 2. CREATE / UPDATE MUTATION
  // ----------------------------------------
  const mutation = useMutation({
    mutationFn: (formData) =>
      isEditMode
        ? updateCourse(id, formData)
        : createCourse(formData),

    onSuccess: () => {
      toast.success(isEditMode ? "Course updated" : "Course created");

      queryClient.invalidateQueries(['courses']);
      if (isEditMode) queryClient.invalidateQueries(['course', id]);

      navigate('/admin/courses');
    },

    onError: (err) => {
      console.error("❌ Error saving course:", err);
      toast.error(err.response?.data?.error || "Failed to save course");
    }
  });

  const handleSubmit = (formData) => {
    mutation.mutate(formData);
  };

  const handleCancel = () => {
    navigate('/admin/courses');
  };

  // ----------------------------------------
  // 3. LOADING STATE
  // ----------------------------------------
  if (isLoading) {
    return <div className="admin-loading">Loading...</div>;
  }

  // ----------------------------------------
  // 4. RENDER PAGE
  // ----------------------------------------
  return (
    <div className="course-form-page">
      <button
        className="back-button"
        onClick={() => navigate('/admin/courses')}
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
          />
        </svg>
        Back to Courses
      </button>

      <div className="form-page-header">
        <h1>{isEditMode ? 'Edit Course' : 'Add New Course'}</h1>
        <p className="form-subtitle">
          {isEditMode ? 'Update course details' : 'Create a new educational course'}
        </p>
      </div>

      <div className="admin-form-card">
        <CourseForm
          key={isEditMode ? initialData?._id : 'new-course'}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={mutation.isPending}
        />
      </div>
    </div>
  );
};

export default CourseFormPage;
