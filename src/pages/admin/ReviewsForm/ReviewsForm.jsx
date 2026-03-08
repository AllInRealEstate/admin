import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './ReviewsForm.css';

const ReviewsForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [activeTab, setActiveTab] = useState('en');
  
  const [formData, setFormData] = useState({
    translations: {
      en: { text: '', author: '', location: '' },
      ar: { text: '', author: '', location: '' },
      he: { text: '', author: '', location: '' }
    },
    rating: 5,
    order: 0,
    status: 'approved',
    originalLanguage: 'en'
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
        status: initialData.status || 'pending',
        originalLanguage: initialData.originalLanguage || 'en'
      });
      if (initialData.originalLanguage) {
        setActiveTab(initialData.originalLanguage);
      }
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

    const currentTrans = formData.translations[activeTab];
    if (!currentTrans.text || !currentTrans.author) {
      toast.error(`Please fill in the fields for ${activeTab.toUpperCase()}`);
      return;
    }

    onSubmit({
      ...formData,
      rating: Number(formData.rating),
      order: Number(formData.order)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <div className="form-info-bar">
        <div className="info-item">
           <span className="label">Original Language:</span>
           <span className="value-badge">{formData.originalLanguage.toUpperCase()}</span>
        </div>
        <div className="info-item">
           <span className="label">Current Status:</span>
           <span className={`status-dot status-${formData.status}`}></span>
           <span style={{textTransform: 'capitalize'}}>{formData.status}</span>
        </div>
      </div>

      <div className="tabs">
        {['en', 'ar', 'he'].map(lang => (
          <button
            key={lang}
            type="button"
            className={`tab ${activeTab === lang ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(lang)}
          >
            {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : 'עברית'}
            {formData.originalLanguage === lang && ' (Original)'}
          </button>
        ))}
      </div>

      <div className="tab-content">
        <div className="form-group">
          <label>Review Text ({activeTab.toUpperCase()})</label>
          <textarea
            rows="4"
            value={formData.translations[activeTab].text || ''}
            onChange={(e) => handleInputChange(activeTab, 'text', e.target.value)}
            placeholder={activeTab === formData.originalLanguage ? "User's original review..." : "Enter translation..."}
            dir={activeTab === 'en' ? 'ltr' : 'rtl'}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Author Name</label>
            <input
              type="text"
              value={formData.translations[activeTab].author || ''}
              onChange={(e) => handleInputChange(activeTab, 'author', e.target.value)}
              dir={activeTab === 'en' ? 'ltr' : 'rtl'}
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={formData.translations[activeTab].location || ''}
              onChange={(e) => handleInputChange(activeTab, 'location', e.target.value)}
              dir={activeTab === 'en' ? 'ltr' : 'rtl'}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Moderation</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Rating</label>
            <select
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
            >
              {[5, 4, 3, 2, 1].map(star => (
                <option key={star} value={star}>{star} ⭐</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={`status-select status-${formData.status}`}
            >
              <option value="pending">🟡 Pending Approval</option>
              <option value="approved">🟢 Approved (Public)</option>
              <option value="rejected">🔴 Rejected (Hidden)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Review'}
        </button>
      </div>
    </form>
  );
};

export default ReviewsForm;