import React, { useState, useEffect } from 'react';
import './ReviewViewModal.css';

const ReviewViewModal = ({ review, onClose, onToggleActive, onStatusChange, onDelete, isSuperAdmin, isToggling }) => {
    const [activeTab, setActiveTab] = useState(review.originalLanguage || 'en');
    const [isActive, setIsActive] = useState(review.active);

    // Sync local state with parent prop (Live Update)
    useEffect(() => {
        setIsActive(review.active);
    }, [review.active]);

    const getContent = (lang) => review.translations?.[lang] || {};

    // Available languages checker
    const availableLangs = ['en', 'ar', 'he'].filter(lang =>
        review.translations?.[lang]?.text
    );

    const currentContent = getContent(activeTab);
    const isApproved = review.status === 'approved';

    // Format Date: "Jan 09, 2026 • 08:26 PM"
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date).replace(',', ' •');
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <svg key={i} width="16" height="16" viewBox="0 0 20 20" fill={i < rating ? '#d4af37' : '#e5e7eb'}>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-masterpiece" onClick={(e) => e.stopPropagation()}>

                {/* --- SIDEBAR (Metadata) --- */}
                <div className="masterpiece-sidebar">

                    {/* Status Badge */}
                    <div className={`mp-status-badge ${review.status}`}>
                        <span className="dot"></span>
                        {review.status.toUpperCase()}
                    </div>

                    <div className="mp-meta-group">

                        {/* Date */}
                        <div className="mp-meta-item">
                            <label>Submitted On</label>
                            <div className="mp-value date-value">
                                {formatDate(review.createdAt)}
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="mp-meta-item">
                            <label>Rating</label>
                            <div className="mp-stars">{renderStars(review.rating)}</div>
                        </div>

                        {/* Author */}
                        <div className="mp-meta-item">
                            <label>Author</label>
                            <div className="mp-value author-value">
                                {currentContent.author || 'Anonymous'}
                            </div>
                        </div>

                        {/* Location (Optional) */}
                        {currentContent.location && (
                            <div className="mp-meta-item">
                                <label>Location</label>
                                <div className="mp-value">{currentContent.location}</div>
                            </div>
                        )}
                    </div>


                    {/* Visibility Switch (Bottom of Sidebar) */}
                    {isApproved && (
                        <div className="mp-toggle-container">
                            <label>Public Visibility</label>
                            <button
                                className={`mp-toggle-btn ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    if (!isToggling) {
                                        setIsActive(!isActive); // Immediate visual update
                                        onToggleActive(review._id);
                                    }
                                }}
                            >
                                <span className="mp-toggle-circle"></span>
                                <span className="mp-toggle-label">
                                    {isActive ? 'Visible' : 'Hidden'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                {/* --- MAIN CONTENT (Review Text) --- */}
                <div className="masterpiece-main">

                    {/* Header & Tabs */}
                    <div className="mp-header">
                        <h2 className="mp-title">Review Details</h2>

                        <div className="mp-tabs">
                            {availableLangs.map(lang => (
                                <button
                                    key={lang}
                                    className={`mp-tab ${activeTab === lang ? 'active' : ''}`}
                                    onClick={() => setActiveTab(lang)}
                                >
                                    {lang === 'en' && 'English'}
                                    {lang === 'ar' && 'Arabic'}
                                    {lang === 'he' && 'Hebrew'}
                                </button>
                            ))}
                        </div>

                        <button className="mp-close-icon" onClick={onClose}>✕</button>
                    </div>

                    {/* Content Body */}
                    <div className="mp-content-body custom-scroll" dir={activeTab === 'en' ? 'ltr' : 'rtl'}>
                        <div className="mp-quote-icon">❝</div>
                        <p className="mp-review-text">
                            {currentContent.text}
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="mp-footer">
                        {/* Left Side: Delete (SuperAdmin) */}
                        {isSuperAdmin && (
                            <button
                                className="mp-btn-delete"
                                onClick={() => {
                                    onDelete(review._id, currentContent.author || 'this review');
                                    onClose();
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                Delete
                            </button>
                        )}

                        {/* Right Side: Actions or Done */}
                        <div className="mp-footer-actions">
                            {review.status === 'pending' ? (
                                <>
                                    <button
                                        className="mp-btn-reject-action"
                                        onClick={() => onStatusChange(review._id, 'rejected')}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        className="mp-btn-approve-action"
                                        onClick={() => onStatusChange(review._id, 'approved')}
                                    >
                                        Approve
                                    </button>
                                </>
                            ) : (
                                <button className="mp-btn-done" onClick={onClose}>DONE</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewViewModal;