import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './ServiceForm.css';
import { compressImage } from '../../../utils/imageCompressor.js';

// ✅ Added isSubmitting prop
const ServiceForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
    const [activeTab, setActiveTab] = useState('en');
    const [iconFile, setIconFile] = useState(null);
    const [iconPreview, setIconPreview] = useState('');

    const [formData, setFormData] = useState({
        order: 1,
        icon: '',
        translations: {
            en: { title: '', description: '' },
            ar: { title: '', description: '' },
            he: { title: '', description: '' }
        },
        active: true,
        relatedProjects: []
    });

    // Pre-fill form when editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                order: initialData.order || 1,
                icon: initialData.icon || '',
                translations: initialData.translations || {
                    en: { title: '', description: '' },
                    ar: { title: '', description: '' },
                    he: { title: '', description: '' }
                },
                active: initialData.active !== undefined ? initialData.active : true,
                relatedProjects: initialData.relatedProjects || []
            });

            if (initialData.icon) {
                setIconPreview(initialData.icon);
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

    /*
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Image must be smaller than 10MB');
                return;
            }
            setIconFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setIconPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };
*/

    // ✅ UPDATED: Handle Icon Selection with Compression
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            // Removed 10MB check because compressor handles large files

            try {
                // 1. Compress the file instantly
                const compressedFile = await compressImage(file);

                // 2. Store the SMALL file
                setIconFile(compressedFile);

                // 3. Generate preview
                const reader = new FileReader();
                reader.onload = (e) => setIconPreview(e.target.result);
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

        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => file.type.startsWith('image/'));

        if (imageFile) {
            // Create a fake event to reuse the logic above
            const fakeEvent = { target: { files: [imageFile] } };
            handleFileSelect(fakeEvent);
        }
    };
    const handleRemoveIcon = () => {
        setIconFile(null);
        setIconPreview('');
        setFormData(prev => ({ ...prev, icon: '' }));
    };

    // ... (Keep handleDragOver and handleDrop as is) ...
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

    /*
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => file.type.startsWith('image/'));
        if (imageFile) {
            const fakeEvent = { target: { files: [imageFile] } };
            handleFileSelect(fakeEvent);
        }
    };
    */

    const handleSubmit = async (e) => {
        e.preventDefault();

        const languages = ['en', 'ar', 'he'];
        for (const lang of languages) {
            if (!formData.translations[lang].title || !formData.translations[lang].description) {
                toast.error(`Please fill in all required fields for ${lang.toUpperCase()}`);
                setActiveTab(lang); // Switch to error tab
                return;
            }
        }

        // Prepare FormData
        const data = new FormData();

        // Add file if selected
        if (iconFile) {
            data.append('iconFile', iconFile);
        }
        // Or keep existing URL
        else if (formData.icon) {
            data.append('icon', formData.icon);
        }

        data.append('order', formData.order);
        data.append('active', formData.active);
        data.append('translations', JSON.stringify(formData.translations));

        if (formData.relatedProjects && formData.relatedProjects.length > 0) {
            data.append('relatedProjects', JSON.stringify(formData.relatedProjects));
        }

        onSubmit(data); // Send FormData to parent
    };

    return (
        <form onSubmit={handleSubmit} className="modal-form">
            <div className="tabs">
                {['en', 'ar', 'he'].map(lang => (
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

            <div className="tab-content">
                <p className="form-note-required">* All three languages are required</p>
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
            </div>

            <div className="form-section">
                <h3>Service Details</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Display Order *</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Service Icon</label>
                    {iconPreview ? (
                        <div className="icon-preview-container">
                            <img src={iconPreview} alt="Icon preview" className="icon-preview-image" />
                            {/* NEW: Standardized Floating X Button */}
                            <button
                                type="button"
                                className="btn-remove-image" /* <--- MUST MATCH THE CSS CLASS */
                                onClick={handleRemoveIcon}
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <div className="icon-drop-zone" onDragOver={handleDragOver} onDrop={handleDrop}>
                            <p>Drag & drop icon here or</p>
                            <label className="btn-upload">
                                Choose File
                                <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                            </label>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        />
                        Active Service
                    </label>
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
                        initialData ? 'Update Service' : 'Create Service'
                    )}
                </button>
            </div>
        </form>
    );
};

export default ServiceForm;