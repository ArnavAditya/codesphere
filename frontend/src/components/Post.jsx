import useDialog from '../hooks/useDialog';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { FiHeart, FiMessageSquare, FiArrowUpRight, FiX, FiCornerDownRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom'; // Import the useHistory hook

const Post = ({ post }) => {
    const commentInput = useRef(null);
    const [actionError, setActionError] = useState('');
    const [liking, setLiking] = useState(false);
    const navigate = useNavigate(); // Initialize useHistory hook
    const user = useSelector((state) => state.auth.user);
    const [likes, setLikes] = useState(post.likes.length);
    const [isLiked, setIsLiked] = useState(post.likes.includes(user._id));
    const [isFriend, setIsFriend] = useState(user.friends.includes(post.userId));
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [comments, setComments] = useState(post.comments);
    const [replyingTo, setReplyingTo] = useState(null); // Keep track of the comment being replied to
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';

    const handleClickLike = async () => {
        if (liking) return;
        setLiking(true);
        setActionError('');
        try {
            const url = `${apiUrl}/api/post/${post._id}/like`;
            const response = await axios.patch(url, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setIsLiked(!isLiked);
                setLikes(prevLikes => isLiked ? prevLikes - 1 : prevLikes + 1);
            }
        } catch (error) {
            setActionError('Could not update your like. Please try again.');
        } finally {
            setLiking(false);
        }
    };

    const handleAddRemoveFriend = () => navigate(`/dashboard/${post.userId}`);

    const handleNavigateToDashboard = () => {
    navigate(`/dashboard/${post.userId}`);
    };

    const buttonStyle = {
        color: 'black',
        cursor: 'pointer',
        marginLeft: '5px',
    };

    const formattedDate = new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const ms = Date.now() - new Date(post.createdAt);
    const hrs = ms / 36e5;
    const timeAgo = hrs < 24 ? `${Math.round(hrs)} hr` : hrs < 168 ? `${Math.round(hrs / 24)} d` : hrs < 720 ? `${Math.round(hrs / 168)} w` : hrs < 8760 ? `${Math.round(hrs / 720)} mo` : `${Math.round(hrs / 8760)} yr`;

    const handleShowComments = () => {
        setShowCommentsModal(true);
    };

    const handleHideComments = () => {
        setShowCommentsModal(false);
        setReplyingTo(null);
    };

    useDialog(showCommentsModal, handleHideComments);

    const fetchComments = async () => {
        try {
            const response = await axios.get(`${apiUrl}/api/post/${post._id}/comments`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setComments(response.data.comments);
        } catch (error) {
            setActionError('Could not load comments. Please try again.');
        }
    };

    useEffect(() => {
        if (showCommentsModal) {
            fetchComments();
        }
    }, [showCommentsModal]);

    const handleCreateComment = async () => {
        try {
            const response = await axios.post(`${apiUrl}/api/post/${post._id}/comment`, {
                content: newCommentContent,
                userId: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                parentId: replyingTo ? replyingTo._id : null,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setNewCommentContent('');
            setReplyingTo(null);
            fetchComments();
        } catch (error) {
            setActionError('Could not post your comment. Please try again.');
        }
    };

    const handleReply = (comment) => {
        setReplyingTo(comment);
        commentInput.current?.focus();
    };

    const renderComments = (parentId = null, depth = 0) => {
        const filteredComments = comments.filter(comment => (comment.parentId ?? null) === parentId);

        if (filteredComments.length === 0) {
            return null;
        }

        return filteredComments.map(comment => (
            <div key={comment._id} className={`comment-item ${depth > 0 ? 'ml-4' : ''} ${replyingTo === comment ? 'border-l-2 border-blue-500 pl-2' : ''}`}>
                <b><p className="text-black">{comment.firstName} {comment.lastName}</p></b>
                <p className="text-gray-800">{comment.content}</p>
                <button onClick={() => handleReply(comment)} className="text-link">Reply</button>
                {/* Add white space between comments and replies */}
                <div style={{ marginTop: '10px' }} />
                {renderComments(comment._id, depth + 1)}
            </div>
        ));
    };

    return <article className="surface post-card">
        <header className="post-header"><button className="initial-avatar" onClick={handleNavigateToDashboard} aria-label={`View ${post.firstName}'s profile`}>{post.firstName?.[0]}{post.lastName?.[0]}</button><div><button className="post-author" onClick={handleNavigateToDashboard}>{post.firstName} {post.lastName}</button><p className="muted" title={formattedDate}>{timeAgo} ago {post.location && `· ${post.location}`}</p></div><button className="icon-button" onClick={handleNavigateToDashboard} aria-label="View author profile"><FiArrowUpRight /></button></header>
        <p className="post-body">{post.description}</p>
        {post.picturePath && <img className="post-image" src={post.picturePath} alt="Image shared in this post" loading="lazy" />}
        {actionError && !showCommentsModal && <p role="alert" className="error-notice">{actionError}</p>}
        <footer className="post-actions"><button className={isLiked ? 'liked' : ''} disabled={liking} aria-pressed={isLiked} onClick={handleClickLike}><FiHeart fill={isLiked ? 'currentColor' : 'none'} /> {likes} <span>Likes</span></button><button onClick={handleShowComments}><FiMessageSquare /> {comments.length} <span>Comments</span></button><span className="post-category">Community</span></footer>
        {showCommentsModal && <div className="modal-backdrop" onClick={handleHideComments}><section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby={`comments-${post._id}`} onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') handleHideComments(); }}><div className="modal-heading"><div><p className="eyebrow">KEEP THE CONVERSATION GOING</p><h2 id={`comments-${post._id}`}>Comments <span className="count-badge">{comments.length}</span></h2></div><button className="icon-button" onClick={handleHideComments} aria-label="Close comments"><FiX /></button></div>{actionError && <p role="alert" className="error-notice">{actionError}</p>}<div className="comments-list">{comments.length ? renderComments() : <div className="empty-state"><FiMessageSquare /><p>Be the first to join in.</p></div>}</div>{replyingTo && <div className="reply-indicator"><FiCornerDownRight /> Replying to {replyingTo.firstName}<button onClick={() => setReplyingTo(null)} aria-label="Cancel reply"><FiX /></button></div>}<form className="comment-composer" onSubmit={e => { e.preventDefault(); if (newCommentContent.trim()) handleCreateComment(); }}><input ref={commentInput} aria-label="Your comment" value={newCommentContent} onChange={e => setNewCommentContent(e.target.value)} placeholder="Add your thoughts…" /><button className="button button-primary" disabled={!newCommentContent.trim()}>Post</button></form></section></div>}
    </article>;
};
export default Post;
