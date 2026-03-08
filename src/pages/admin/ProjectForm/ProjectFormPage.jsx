import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // <--- 1. React Query
import { toast } from 'react-toastify';
import {
  getProjectById,
  createProject,
  updateProject
} from '../../../services/ProjectsApi';
import UniversalForm from './ProjectForm';
import './ProjectFormPage.css';

const ProjectFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  // ---------------------------
  // 1. FETCH DATA 
  // ---------------------------

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id), // <--- Cleaner
    enabled: isEditMode,
    refetchOnWindowFocus: false,
  });

  // ---------------------------
  // 2. SAVE DATA (Mutation)
  // ---------------------------
  const mutation = useMutation({
    mutationFn: (formData) => {
      if (isEditMode) {
        return updateProject(id, formData); // <--- Cleaner
      } else {
        return createProject(formData);     // <--- Cleaner
      }
    },
    onSuccess: () => {
      // ✅ CRITICAL: Invalidate the 'projects' list so the Admin Dashboard updates
      queryClient.invalidateQueries(['projects']);

      // Also invalidate this specific project's cache
      if (isEditMode) {
        queryClient.invalidateQueries(['project', id]);
      }

      toast.success(isEditMode ? 'Project updated successfully!' : 'Project created successfully!');
      navigate('/admin/projects');
    },
    onError: (error) => {
      console.error("Save failed:", error);
      toast.error(error.response?.data?.error || 'Failed to save project');
    }
  });

  const handleSubmit = (formData) => {
    mutation.mutate(formData);
  };

  const handleCancel = () => {
    navigate('/admin/projects');
  };

  // ---------------------------
  // 3. RENDER
  // ---------------------------
  if (isLoading) {
    return (
      <div className="project-form-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading project data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-form-page">
      <button className="back-button" onClick={handleCancel}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
        </svg>
        Back to Projects
      </button>

      <div className="form-page-header">
        <h1>{isEditMode ? 'Edit Project' : 'Add New Project'}</h1>
        <p className="form-subtitle">
          {isEditMode
            ? 'Update project details and images'
            : 'Create a new real estate project'
          }
        </p>
      </div>

      <div className="admin-form-card">
        {/* ✅ OPTIMIZATION: The "key" prop forces the component to re-mount 
            when data is ready. This prevents bugs where the form loads empty.
        */}
        <UniversalForm
          key={isEditMode ? projectData?._id : 'new'}
          type="project"
          mode={isEditMode ? 'update' : 'create'}
          initialData={projectData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={mutation.isPending} // Pass loading state down
        />
      </div>
    </div>
  );
};

export default ProjectFormPage;