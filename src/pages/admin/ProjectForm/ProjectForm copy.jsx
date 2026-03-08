// src/components/  Form.jsx
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './ProjectForm.css';

const UniversalForm = ({
  type,           // 'project', 'service', or 'testimonial'
  mode,           // 'create' or 'update'
  initialData,    // for update mode
  onSubmit,       // callback function
  onCancel        // callback function
}) => {
  const [activeTab, setActiveTab] = useState('en');
  const [uploadingImages, setUploadingImages] = useState(false);

  // Initial form data based on type
  const getInitialFormData = () => {
    if (type === 'project') {
      return {
        translations: {
          en: { title: '', location: '', shortDesc: '', fullDesc: '', features: [] },
          ar: { title: '', location: '', shortDesc: '', fullDesc: '', features: [] },
          he: { title: '', location: '', shortDesc: '', fullDesc: '', features: [] }
        },
        price: '',
        currency: 'ILS',
        bedrooms: '',
        bathrooms: '',
        area: '',
        areaUnit: 'sqm',
        type: 'forSale',
        status: 'active',
        featured: false,
        badge: null,
        images: [],
        mainImage: ''
      };
    }
    // Will add service and testimonial later
    return {};
  };

  const [formData, setFormData] = useState(getInitialFormData());

  // Pre-fill form data when in update mode
  useEffect(() => {
    if (mode === 'update' && initialData) {
      if (type === 'project') {
        // Check if data has translations object or is flat
        const hasTranslations = initialData.translations &&
          initialData.translations.en &&
          initialData.translations.ar &&
          initialData.translations.he;

        if (hasTranslations) {
          // Data already has translations structure
          setFormData({
            translations: initialData.translations,
            price: initialData.price || '',
            currency: initialData.currency || 'ILS',
            bedrooms: initialData.bedrooms || '',
            bathrooms: initialData.bathrooms || '',
            area: initialData.area || '',
            areaUnit: initialData.areaUnit || 'sqm',
            type: initialData.type || 'forSale',
            status: initialData.status || 'active',
            featured: initialData?.featured ?? false,
            badge: initialData.badge || null,
            images: initialData.images || [],
            mainImage: initialData.mainImage || ''
          });
        } else {
          // Data is flat - convert to translations structure
          setFormData({
            translations: {
              en: {
                title: initialData.title || '',
                location: initialData.location || '',
                shortDesc: initialData.shortDesc || '',
                fullDesc: initialData.fullDesc || '',
                features: initialData.features || []
              },
              ar: {
                title: initialData.titleAr || '',
                location: initialData.locationAr || '',
                shortDesc: initialData.shortDescAr || '',
                fullDesc: initialData.fullDescAr || '',
                features: initialData.featuresAr || []
              },
              he: {
                title: initialData.titleHe || '',
                location: initialData.locationHe || '',
                shortDesc: initialData.shortDescHe || '',
                fullDesc: initialData.fullDescHe || '',
                features: initialData.featuresHe || []
              }
            },
            price: initialData.price || '',
            currency: initialData.currency || 'ILS',
            bedrooms: initialData.bedrooms || '',
            bathrooms: initialData.bathrooms || '',
            area: initialData.area || '',
            areaUnit: initialData.areaUnit || 'sqm',
            type: initialData.type || 'forSale',
            status: initialData.status || 'active',
            featured: initialData.featured || false,
            badge: initialData.badge || null,
            images: initialData.images || [],
            mainImage: initialData.mainImage || ''
          });
        }
      }
    } else {
      setFormData(getInitialFormData());
    }
  }, [mode, initialData, type]);

  // ========== PROJECT HANDLERS ==========
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

  const handleFeatureChange = (lang, index, value) => {
    const newFeatures = [...formData.translations[lang].features];
    newFeatures[index] = value;
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: {
          ...prev.translations[lang],
          features: newFeatures
        }
      }
    }));
  };

  const handleAddFeature = (lang) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: {
          ...prev.translations[lang],
          features: [...prev.translations[lang].features, '']
        }
      }
    }));
  };

  const handleRemoveFeature = (lang, index) => {
    const newFeatures = formData.translations[lang].features.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: {
          ...prev.translations[lang],
          features: newFeatures
        }
      }
    }));
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleAddImage = () => {
    setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (file, isMain = false) => {
    try {
      setUploadingImages(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;

        if (isMain) {
          setFormData(prev => ({ ...prev, mainImage: imageUrl }));
          toast.success('Main image uploaded!');
        } else {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, imageUrl]
          }));
          toast.success('Image uploaded!');
        }
      };
      reader.readAsDataURL(file);

    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, isMain = false) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      handleImageUpload(imageFiles[0], isMain);
    }
  };

  // ========== SUBMIT HANDLER ==========
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation for PROJECT
    if (type === 'project') {
      const languages = ['en', 'ar', 'he'];
      for (const lang of languages) {
        if (!formData.translations[lang].title || !formData.translations[lang].location) {
          toast.error(`Please fill in all required fields for ${lang.toUpperCase()}`);
          return;
        }
      }

      const submitData = {
        ...formData,
        price: Number(formData.price),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        area: Number(formData.area)
      };

      onSubmit(submitData);
    }
  };

  // ========== RENDER PROJECT FORM ==========
  const renderProjectForm = () => (
    <>
      {/* Language Tabs */}
      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'en' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('en')}
        >
          English *
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'ar' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('ar')}
        >
          العربية *
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'he' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('he')}
        >
          עברית *
        </button>
      </div>

      {/* Translation Fields */}
      <div className="tab-content">
        <p className="form-note-required">
          * All three languages are required
        </p>

        <div className="form-row">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.translations[activeTab].title}
              onChange={(e) => handleInputChange(activeTab, 'title', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Location *</label>
            <input
              type="text"
              value={formData.translations[activeTab].location}
              onChange={(e) => handleInputChange(activeTab, 'location', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Short Description *</label>
          <input
            type="text"
            value={formData.translations[activeTab].shortDesc}
            onChange={(e) => handleInputChange(activeTab, 'shortDesc', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Full Description</label>
          <textarea
            rows="4"
            value={formData.translations[activeTab].fullDesc}
            onChange={(e) => handleInputChange(activeTab, 'fullDesc', e.target.value)}
          />
        </div>

        {/* Features */}
        <div className="form-group">
          <label>Features</label>
          {formData.translations[activeTab].features.map((feature, index) => (
            <div key={index} className="input-group">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureChange(activeTab, index, e.target.value)}
                placeholder={`Feature ${index + 1}`}
              />
              <button
                type="button"
                className="btn-remove"
                onClick={() => handleRemoveFeature(activeTab, index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn-add"
            onClick={() => handleAddFeature(activeTab)}
          >
            + Add Feature
          </button>
        </div>
      </div>

      {/* Property Details */}
      <div className="form-section">
        <h3>Property Details</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
            <label>Bedrooms</label>
            <input
              type="number"
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Bathrooms</label>
            <input
              type="number"
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Area</label>
            <input
              type="number"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="forSale">For Sale</option>
              <option value="forRent">For Rent</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="form-group">
            <label>Badge</label>
            <select
              value={formData.badge || ''}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value || null })}
            >
              <option value="">None</option>
              <option value="new">🟢 New</option>
              <option value="exclusive">⭐ Exclusive</option>
              <option value="sold">⚫ Sold</option>
            </select>
            {formData.badge && (
              <span className={`badge-sample ${formData.badge}`}>
                {formData.badge.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            />

            Featured Property
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="form-section">
        <h3>Images (Optional)</h3>

        {/* Main Image */}
        <div className="form-group">
          <label>Main Image</label>

          <div
            className="image-drop-zone"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, true)}
          >
            {formData.mainImage ? (
              <div className="image-preview">
                <img src={formData.mainImage} alt="Main" />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={() => setFormData({ ...formData, mainImage: '' })}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="drop-zone-content">
                <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor" opacity="0.3">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
                <p>Drag & drop image here</p>
                <p className="text-small">or</p>
                <label className="btn-upload">
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], true)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="form-divider">
            <span>OR paste URL</span>
          </div>
          <input
            type="url"
            value={formData.mainImage}
            onChange={(e) => setFormData({ ...formData, mainImage: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Additional Images */}
        <div className="form-group">
          <label>Additional Images</label>

          <div className="images-grid">
            {formData.images.map((image, index) => (
              <div key={index} className="image-preview-small">
                <img src={image} alt={`Image ${index + 1}`} />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={() => handleRemoveImage(index)}
                >
                  ✕
                </button>
              </div>
            ))}

            <div
              className="image-drop-zone-small"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, false)}
            >
              <label className="drop-zone-small-content">
                <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor" opacity="0.3">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], false)}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {formData.images.map((image, index) => (
            <div key={index} className="input-group">
              <input
                type="url"
                value={image}
                onChange={(e) => handleImageChange(index, e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button"
                className="btn-remove"
                onClick={() => handleRemoveImage(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn-add"
            onClick={handleAddImage}
          >
            + Add Image URL
          </button>
        </div>
      </div>
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      {type === 'project' && renderProjectForm()}

      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={uploadingImages}>
          {uploadingImages ? 'Uploading...' : (mode === 'update' ? 'Update Project' : 'Create Project')}
        </button>
      </div>
    </form>
  );
};

export default UniversalForm;