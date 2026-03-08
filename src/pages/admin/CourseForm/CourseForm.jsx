// src/pages/admin/CourseForm/CourseForm.jsx
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './CourseForm.css';

import { compressImage } from '../../../utils/imageCompressor.js';

const CourseForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [activeTab, setActiveTab] = useState('en');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    translations: {
      en: { title: '', description: '', level: 'Beginner' },
      ar: { title: '', description: '', level: 'مبتدئ' },
      he: { title: '', description: '', level: 'מתחיל' }
    },
    price: null,
    currency: 'ILS',
    duration: '',
    instructor: 'ALL IN Team',
    active: true,
    order: 0,
    image: ''
  });

  // ------------------------------------------------------
  // Prefill form if editing
  // ------------------------------------------------------
  useEffect(() => {
    if (initialData) {
      setFormData({
        translations: initialData.translations,
        price: initialData.price,
        currency: initialData.currency,
        duration: initialData.duration,
        instructor: initialData.instructor,
        active: initialData.active,
        order: initialData.order,
        image: initialData.image
      });

      if (initialData.image) {
        setImagePreview(initialData.image);
      }
    }
  }, [initialData]);

  // ------------------------------------------------------
  // Field Handlers
  // ------------------------------------------------------
  const handleInputChange = (lang, field, value) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: {
          ...prev.translations[lang],
          [field]: value
        }
      }
    }));
  };

  /*
  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }

      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };
  */

  // ✅ UPDATED: Handle Image Selection with Compression
  const handleFileSelect = async (e) => { // Mark async
    const file = e.target.files[0];

    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      try {
        // 1. Compress the file instantly
        const compressedFile = await compressImage(file);

        // 2. Store the SMALL file for upload
        setImageFile(compressedFile);

        // 3. Generate preview from the compressed file
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(compressedFile);

      } catch (error) {
        console.error("Compression error:", error);
        toast.error("Failed to process image");
      }
    }
  };

  // ✅ UPDATED: Drag & Drop Handler
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      // Create a fake event to reuse the logic above
      const fakeEvent = { target: { files: [file] } };
      handleFileSelect(fakeEvent);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /*
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = { target: { files: [file] } };
      handleFileSelect(fakeEvent);
    }
  };
  */

  // ------------------------------------------------------
  // Submit Handler (same structure as Services)
  // ------------------------------------------------------
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    const langs = ['en', 'ar', 'he'];
    for (const lang of langs) {
      if (!formData.translations[lang].title || !formData.translations[lang].description) {
        toast.error(`Please fill all required fields for ${lang.toUpperCase()}`);
        setActiveTab(lang);
        return;
      }
    }

    if (!formData.duration) {
      toast.error('Duration is required');
      return;
    }

    // Prepare FormData
    const data = new FormData();

    data.append('translations', JSON.stringify(formData.translations));

    // Only append price if > 0
    if (formData.price && Number(formData.price) > 0) {
      data.append('price', Number(formData.price));
    }

    data.append('currency', formData.currency);
    data.append('duration', formData.duration);
    data.append('instructor', formData.instructor);
    data.append('active', formData.active);
    data.append('order', formData.order);

    if (imageFile) {
      data.append('imageFile', imageFile);
    } else if (formData.image) {
      data.append('image', formData.image);
    }

    // Submit to parent (React Query)
    onSubmit(data);
  };

  // ------------------------------------------------------
  // JSX
  // ------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="modal-form">

      {/* Language Tabs */}
      <div className="tabs">
        {['en', 'ar', 'he'].map((lang) => (
          <button
            key={lang}
            type="button"
            className={`tab ${activeTab === lang ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(lang)}
          >
            {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : 'עברית'} *
          </button>
        ))}
      </div>

      {/* Language Fields */}
      <div className="tab-content">
        <p className="form-note-required">* All languages are required</p>

        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            value={formData.translations[activeTab].title}
            onChange={(e) => handleInputChange(activeTab, 'title', e.target.value)}
            required
            dir={activeTab === 'en' ? 'ltr' : 'rtl'}
          />
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            rows="4"
            value={formData.translations[activeTab].description}
            onChange={(e) => handleInputChange(activeTab, 'description', e.target.value)}
            required
            dir={activeTab === 'en' ? 'ltr' : 'rtl'}
          />
        </div>

        <div className="form-group">
          <label>Level *</label>
          <input
            type="text"
            value={formData.translations[activeTab].level}
            onChange={(e) => handleInputChange(activeTab, 'level', e.target.value)}
            dir={activeTab === 'en' ? 'ltr' : 'rtl'}
          />
        </div>
      </div>

      {/* Course Settings */}
      <div className="form-section">
        <h3>Course Details</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Price (Optional)</label>
            <input
              type="number"
              min="0"
              value={formData.price || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: e.target.value === '' ? null : Number(e.target.value)
                })
              }
              placeholder="Leave empty for free"
            />
          </div>

          <div className="form-group">
            <label>Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              <option value="ILS">ILS (₪)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Duration *</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Instructor</label>
            <input
              type="text"
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Display Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              Active Course
            </label>
          </div>
        </div>
      </div>

      {/* Image Upload */}
      <div className="form-section">
        <h3>Thumbnail Image</h3>

        <div className="form-group">
          {imagePreview ? (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview-large" />

              <button
                type="button"
                className="btn-remove-image"
                onClick={handleRemoveImage}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="image-drop-zone" onDragOver={handleDragOver} onDrop={handleDrop}>
              <p>Drag & drop image or select below</p>
              <label className="btn-upload">
                Choose File
                <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="btn-spinner"></div> Saving...
            </>
          ) : (
            initialData ? 'Update Course' : 'Create Course'
          )}
        </button>
      </div>
    </form>
  );
};

export default CourseForm;
