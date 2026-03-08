import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './TestimonialForm.css';

// Added isSubmitting prop
const TestimonialForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [activeTab, setActiveTab] = useState('en');
  
  const [formData, setFormData] = useState({
    translations: {
      en: { text: '', author: '', location: '' },
      ar: { text: '', author: '', location: '' },
      he: { text: '', author: '', location: '' }
    },
    rating: 5,
    order: 0,
    active: true,
    featured: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        translations: initialData.translations || {
          en: { text: '', author: '', location: '' },
          ar: { text: '', author: '', location: '' },
          he: { text: '', author: '', location: '' }
        },
        rating: initialData.rating || 5,
        order: initialData.order || 0,
        active: initialData.active !== undefined ? initialData.active : true,
        featured: initialData.featured || false
      });
    }
  }, [initialData]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const languages = ['en', 'ar', 'he'];
    for (const lang of languages) {
      if (!formData.translations[lang].text || 
          !formData.translations[lang].author || 
          !formData.translations[lang].location) {
        toast.error(`Please fill in all required fields for ${lang.toUpperCase()}`);
        setActiveTab(lang);
        return;
      }
    }

    const submitData = {
      ...formData,
      rating: Number(formData.rating),
      order: Number(formData.order)
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
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

        <div className="form-group">
          <label>Testimonial Text *</label>
          <textarea
            rows="4"
            value={formData.translations[activeTab].text}
            onChange={(e) => handleInputChange(activeTab, 'text', e.target.value)}
            required
            placeholder="Customer testimonial..."
            dir={activeTab === 'en' ? 'ltr' : 'rtl'}
          />
        </div>

        <div className="form-group">
          <label>Author Name *</label>
          <input
            type="text"
            value={formData.translations[activeTab].author}
            onChange={(e) => handleInputChange(activeTab, 'author', e.target.value)}
            required
            placeholder="John Doe"
            dir={activeTab === 'en' ? 'ltr' : 'rtl'}
          />
        </div>

        <div className="form-group">
          <label>Location *</label>
          <input
            type="text"
            value={formData.translations[activeTab].location}
            onChange={(e) => handleInputChange(activeTab, 'location', e.target.value)}
            required
            placeholder="City, Country"
            dir={activeTab === 'en' ? 'ltr' : 'rtl'}
          />
        </div>
      </div>

      {/* Testimonial Details */}
      <div className="form-section">
        <h3>Testimonial Details</h3>

        <div className="form-row">
          <div className="form-group">
            <label>Rating *</label>
            <select
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
              required
            >
              <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
              <option value="4">⭐⭐⭐⭐ (4 stars)</option>
              <option value="3">⭐⭐⭐ (3 stars)</option>
              <option value="2">⭐⭐ (2 stars)</option>
              <option value="1">⭐ (1 star)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Display Order</label>
            <input
              type="number"
              min="0"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              Active Testimonial
            </label>
          </div>
          

        </div>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
              <><div className="btn-spinner"></div> Saving...</>
          ) : (
              initialData ? 'Update Testimonial' : 'Create Testimonial'
          )}
        </button>
      </div>
    </form>
  );
};

export default TestimonialForm;