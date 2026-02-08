import React, { useState } from 'react';
import { createReply, deleteReview, updateReview } from '../api/travellerApi';
import { useToast } from '../context/ToastContext';
import '../styles/ReviewSection.css';

const ReviewSection = ({ reviews, serviceId, onReviewsUpdate, currentUserId }) => {
    return (
        <div className="review-section-container">
            <div className="review-header">
                <div className="review-header-left">
                    <div className="review-title-row">
                        <h3 className="review-title">Reviews</h3>
                        <span className="review-count-badge">{reviews.length}</span>
                    </div>
                    <p className="review-subtitle">Real experiences from travellers</p>
                </div>
            </div>

            <div className="reviews-scrollable-content">
                {reviews.length === 0 ? (
                    <div className="review-empty">
                        <p className="review-empty-title">No reviews yet</p>
                        <p className="review-empty-subtitle">
                            Be the first to share your experience.
                        </p>
                    </div>
                ) : (
                    <div className="reviews-list">
                        {reviews.map((review) => (
                            <ReviewItem
                                key={review.id}
                                review={review}
                                serviceId={serviceId}
                                onReviewsUpdate={onReviewsUpdate}
                                currentUserId={currentUserId}
                                depth={0}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ReviewItem = ({ review, serviceId, onReviewsUpdate, currentUserId, depth }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    const [showAllReplies, setShowAllReplies] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(review.comment);
    const [editRating, setEditRating] = useState(review.rating || 5);
    const toast = useToast();

    const INITIAL_REPLIES_SHOWN = 3;

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const renderStars = (rating) => {
        return (
            <div className="review-stars">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < rating ? 'star filled' : 'star'}>
                        ★
                    </span>
                ))}
            </div>
        );
    };

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        setIsSubmitting(true);
        try {
            await createReply(review.id, { comment: replyText });
            toast.success('Reply submitted successfully!');
            setReplyText('');
            setShowReplyForm(false);
            onReviewsUpdate(serviceId);
        } catch (error) {
            console.error('Failed to submit reply:', error);
            toast.error('Failed to submit reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = await toast.confirm({
            title: 'Delete Comment',
            message: 'Are you sure you want to delete this comment?',
            type: 'danger',
            confirmText: 'Delete',
        });
        if (confirmed) {
            try {
                await deleteReview(review.id);
                toast.success('Comment deleted successfully!');
                onReviewsUpdate(serviceId);
            } catch (error) {
                console.error('Failed to delete:', error);
                toast.error('Failed to delete comment');
            }
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!editText.trim()) return;

        setIsSubmitting(true);
        try {
            await updateReview(review.id, { comment: editText, rating: editRating });
            toast.success('Comment updated successfully!');
            setIsEditing(false);
            onReviewsUpdate(serviceId);
        } catch (error) {
            console.error('Failed to update:', error);
            toast.error('Failed to update comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditText(review.comment);
        setEditRating(review.rating || 5);
    };

    const isReply = depth > 0;
    const hasReplies = review.replies && review.replies.length > 0;
    const isOwnComment = review.travellerId === currentUserId;
    const visibleReplies = showAllReplies ? review.replies : review.replies?.slice(0, INITIAL_REPLIES_SHOWN);
    const hasMoreReplies = review.replies && review.replies.length > INITIAL_REPLIES_SHOWN;

    return (
        <div className={`review-item ${isReply ? 'reply-item' : ''}`}>
            <div className="review-content">
                <div className="review-avatar" aria-hidden="true">
                    {getInitials(review.travellerName)}
                </div>
                
                <div className="review-body">
                    <div className="review-meta-row">
                        <div className="review-meta">
                            <span className="review-author">{review.travellerName || 'Traveller'}</span>
                            <span className="review-date">
                                {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        {!isReply && review.rating > 0 && (
                            <div className="review-rating">{renderStars(review.rating)}</div>
                        )}
                    </div>

                    {isEditing ? (
                        <form className="edit-form" onSubmit={handleEdit}>
                            {!isReply && review.rating > 0 && (
                                <div className="edit-rating-row">
                                    <label>Rating:</label>
                                    <select 
                                        value={editRating} 
                                        onChange={(e) => setEditRating(Number(e.target.value))}
                                        className="edit-rating-select"
                                    >
                                        <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                                        <option value={4}>⭐⭐⭐⭐ Good</option>
                                        <option value={3}>⭐⭐⭐ Average</option>
                                        <option value={2}>⭐⭐ Poor</option>
                                        <option value={1}>⭐ Terrible</option>
                                    </select>
                                </div>
                            )}
                            <textarea
                                className="edit-input"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                            />
                            <div className="edit-form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={handleCancelEdit}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-reply-btn"
                                    disabled={isSubmitting || !editText.trim()}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <p className="review-comment">{review.comment}</p>
                    )}

                    <div className="review-actions">
                        <button
                            className="action-btn reply-btn"
                            onClick={() => setShowReplyForm(!showReplyForm)}
                        >
                            💬 Reply
                        </button>
                        
                        {hasReplies && (
                            <button
                                className="action-btn toggle-replies-btn"
                                onClick={() => setShowReplies(!showReplies)}
                            >
                                {showReplies ? '▼' : '▶'} {review.replies.length} {review.replies.length === 1 ? 'reply' : 'replies'}
                            </button>
                        )}

                        {isOwnComment && !isEditing && (
                            <>
                                <button
                                    className="action-btn-icon edit-btn-icon"
                                    onClick={() => setIsEditing(true)}
                                    title="Edit"
                                >
                                    ✏️
                                </button>
                                <button
                                    className="action-btn-icon delete-btn-icon"
                                    onClick={handleDelete}
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </>
                        )}
                    </div>

                    {showReplyForm && (
                        <form className="reply-form" onSubmit={handleSubmitReply}>
                            <textarea
                                className="reply-input"
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={2}
                                disabled={isSubmitting}
                            />
                            <div className="reply-form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        setShowReplyForm(false);
                                        setReplyText('');
                                    }}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-reply-btn"
                                    disabled={isSubmitting || !replyText.trim()}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Reply'}
                                </button>
                            </div>
                        </form>
                    )}

                    {hasReplies && showReplies && (
                        <div className="replies-container">
                            {visibleReplies.map((reply) => (
                                <ReviewItem
                                    key={reply.id}
                                    review={reply}
                                    serviceId={serviceId}
                                    onReviewsUpdate={onReviewsUpdate}
                                    currentUserId={currentUserId}
                                    depth={depth + 1}
                                />
                            ))}
                            {hasMoreReplies && !showAllReplies && (
                                <button 
                                    className="see-more-replies-btn"
                                    onClick={() => setShowAllReplies(true)}
                                >
                                    ▼ See {review.replies.length - INITIAL_REPLIES_SHOWN} more {review.replies.length - INITIAL_REPLIES_SHOWN === 1 ? 'reply' : 'replies'}
                                </button>
                            )}
                            {showAllReplies && hasMoreReplies && (
                                <button 
                                    className="see-more-replies-btn"
                                    onClick={() => setShowAllReplies(false)}
                                >
                                    ▲ Show less
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewSection;
