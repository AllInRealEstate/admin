// src/components/ProjectForm.jsx
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './ProjectForm.css';
import { compressImage } from '../../../utils/imageCompressor.js';
import LocationPickerModal from './LocationPickerModal';

const UniversalForm = ({
  type,
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [activeTab, setActiveTab] = useState('en');
  const [uploadingImages, setUploadingImages] = useState(false);

  //  Store actual File objects for upload
  const [mainImageFile, setMainImageFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);

  // ADD THIS MISSING STATE:
  const [isMapOpen, setIsMapOpen] = useState(false);

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
        badge: '',
        images: [],      // URLs from server (for display in edit mode)
        mainImage: ''    // URL from server (for display in edit mode)
      };
    }
    return {};
  };

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (mode === 'update' && initialData) {
      if (type === 'project') {
        const hasTranslations = initialData.translations?.en && initialData.translations?.ar && initialData.translations?.he;

        if (hasTranslations) {
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
            badge: initialData.badge || 'new',
            images: initialData.images || [],
            mainImage: initialData.mainImage || ''
          });
        } else {
          setFormData({
            translations: {
              en: {
                title: initialData.title || '',
                location: initialData.location || '',
                shortDesc: initialData.shortDesc || '',
                fullDesc: initialData.fullDesc || '',
                features: initialData.features || []
              },
              ar: { title: '', location: '', shortDesc: '', fullDesc: '', features: [] },
              he: { title: '', location: '', shortDesc: '', fullDesc: '', features: [] }
            },
            price: initialData.price || '',
            currency: initialData.currency || 'ILS',
            bedrooms: initialData.bedrooms || '',
            bathrooms: initialData.bathrooms || '',
            area: initialData.area || '',
            areaUnit: initialData.areaUnit || 'sqm',
            type: initialData.type || 'forSale',
            status: initialData.status || 'active',
            featured: initialData?.featured ?? false,
            badge: initialData.badge || 'new',
            images: initialData.images || [],
            mainImage: initialData.mainImage || ''
          });
        }
      }
    }
  }, [mode, initialData, type]);

  const handleLocationSelect = (addresses) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        en: { ...prev.translations.en, location: addresses.en },
        ar: { ...prev.translations.ar, location: addresses.ar },
        he: { ...prev.translations.he, location: addresses.he }
      }
    }));
    toast.success("Location updated in all languages!");
  };

  const handleTranslationChange = (lang, field, value) => {
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


  // ✅ UPDATED: Handle main image with Compression
  const handleMainImageSelect = async (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      // 1. Compress the file BEFORE doing anything else
      const compressedFile = await compressImage(file);

      // 2. Save the SMALL compressed file to state (for upload)
      setMainImageFile(compressedFile);

      // 3. Create preview from the compressed file
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, mainImage: e.target.result }));
      };
      reader.readAsDataURL(compressedFile);

    } catch (error) {
      console.error("Compression failed:", error);
      toast.error("Failed to process image");
    }
  };


  // ✅ UPDATED: Handle gallery files with Compression
  const handleGalleryFileSelect = async (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      // 1. Compress
      const compressedFile = await compressImage(file);

      // 2. Add SMALL file to array (for upload)
      setGalleryFiles(prev => [...prev, compressedFile]);

      // 3. Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, e.target.result]
        }));
      };
      reader.readAsDataURL(compressedFile);

    } catch (error) {
      console.error("Compression failed:", error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ✅ UPDATED: Handle Drop to support async calls
  const handleDrop = (e, isMain = false) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      if (isMain) {
        // Just call it, it handles its own errors
        handleMainImageSelect(imageFiles[0]);
      } else {
        // Process all dropped gallery images
        imageFiles.forEach(file => handleGalleryFileSelect(file));
      }
    }
  };
  /*
    // ✅ NEW: Handle main image file selection
    const handleMainImageSelect = (file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
  
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
  
      setMainImageFile(file);
  
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, mainImage: e.target.result }));
      };
      reader.readAsDataURL(file);
    };
  
    
  
    // ✅ NEW: Handle gallery file selection
    const handleGalleryFileSelect = (file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
  
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
  
      // Add to files array
      setGalleryFiles(prev => [...prev, file]);
  
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, e.target.result]
        }));
      };
      reader.readAsDataURL(file);
    };
  */
  // ✅ MODIFIED: Remove image (handles both URLs and new files)
  const handleRemoveImage = (index) => {
    // Remove from preview
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));

    // Remove from files array (only if it's a new upload)
    // Count how many are existing URLs vs new files
    const existingCount = mode === 'update' ? (initialData?.images?.length || 0) : 0;
    const fileIndex = index - existingCount;

    if (fileIndex >= 0 && fileIndex < galleryFiles.length) {
      setGalleryFiles(prev => prev.filter((_, i) => i !== fileIndex));
    }
  };
  /*
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
        if (isMain) {
          handleMainImageSelect(imageFiles[0]);
        } else {
          imageFiles.forEach(file => handleGalleryFileSelect(file));
        }
      }
    };
  */
  // ✅ NEW: Build FormData for submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (type === 'project') {
      const languages = ['en', 'ar', 'he'];
      for (const lang of languages) {
        if (!formData.translations[lang].title || !formData.translations[lang].location) {
          toast.error(`Please fill in all required fields for ${lang.toUpperCase()}`);
          return;
        }
      }

      // ✅ Create FormData object
      const submitFormData = new FormData();

      // Add translations as JSON string
      submitFormData.append('translations', JSON.stringify(formData.translations));

      // Add other fields (only append if value exists)
      if (formData.price && Number(formData.price) > 0) {
        submitFormData.append('price', Number(formData.price));
      }
      submitFormData.append('currency', formData.currency);

      if (formData.bedrooms && Number(formData.bedrooms) > 0) {
        submitFormData.append('bedrooms', Number(formData.bedrooms));
      }
      if (formData.bathrooms && Number(formData.bathrooms) > 0) {
        submitFormData.append('bathrooms', Number(formData.bathrooms));
      }
      if (formData.area && Number(formData.area) > 0) {
        submitFormData.append('area', Number(formData.area));
      }
      submitFormData.append('areaUnit', formData.areaUnit);

      submitFormData.append('type', formData.type);
      submitFormData.append('status', formData.status);
      submitFormData.append('featured', formData.featured);
      submitFormData.append('badge', formData.badge || 'new');

      // ✅ Add main image file (if new upload)
      if (mainImageFile) {
        submitFormData.append('mainImageFile', mainImageFile);
      }

      // ✅ Add gallery files (if new uploads)
      galleryFiles.forEach((file) => {
        submitFormData.append('galleryFiles', file);
      });

      // ✅ In UPDATE mode: Send list of existing images to keep
      if (mode === 'update') {
        const existingImages = formData.images.filter(url =>
          typeof url === 'string' && url.startsWith('http')
        );
        existingImages.forEach(url => {
          submitFormData.append('existingImages', url);
        });
      }



      // Pass FormData to parent
      onSubmit(submitFormData);
    }
  };

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
              <label>Location ({activeTab.toUpperCase()}) <span className="required-star">*</span></label>
              <div className="location-input-group">
                <input
                  type="text"
                  name="location" // Good practice
                  value={formData.translations[activeTab].location || ''} // Handle null/undefined
                  onChange={(e) => handleTranslationChange(activeTab, 'location', e.target.value)}
                  placeholder="Enter location or pick from map"
                  required
                />
                <button 
                  type="button" 
                  className="btn-map-picker" 
                  onClick={() => setIsMapOpen(true)}
                  title="Pick from Map"
                >
                  📍 Map
                </button>
              </div>
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
              placeholder="0"
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
              value={formData.badge || 'new'}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value || null })}
            >
              <option value="new">🟢 New</option>
              <option value="exclusive">⭐ Exclusive</option>

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
        <h3>Images</h3>

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
                  onClick={() => {
                    setFormData({ ...formData, mainImage: '' });
                    setMainImageFile(null);
                  }}
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
                    onChange={(e) => e.target.files[0] && handleMainImageSelect(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Images */}
        <div className="form-group">
          <label>Gallery Images</label>

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
                  multiple
                  onChange={(e) => {
                    Array.from(e.target.files).forEach(file => handleGalleryFileSelect(file));
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );

return (
    <>
      <form onSubmit={handleSubmit} className="modal-form">
        {type === 'project' && renderProjectForm()}

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={uploadingImages || isSubmitting}>
            {uploadingImages || isSubmitting ? 'Saving...' : (mode === 'update' ? 'Update' : 'Create')}
          </button>
        </div>
      </form>

      {/* ✅ Render the Map Modal */}
      <LocationPickerModal 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
        onLocationSelect={handleLocationSelect} 
      />
    </>
  );
};

export default UniversalForm;