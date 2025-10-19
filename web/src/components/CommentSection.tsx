import { useState } from 'react';
import './CommentSection.css';
import type { Post, CommentTree } from '../hooks/usePosts';

interface CommentSectionProps {
	post: Post;
	comments: CommentTree[];
	onCreateComment: (content: string, parentId: string | null) => Promise<void>;
	onBack: () => void;
}

function CommentSection({ post, comments, onCreateComment, onBack }: CommentSectionProps) {
	const [newComment, setNewComment] = useState('');
	const [replyingTo, setReplyingTo] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (parentId: string | null = null) => {
		if (!newComment.trim() || isSubmitting) return;

		setIsSubmitting(true);
		try {
			await onCreateComment(newComment, parentId);
			setNewComment('');
			setReplyingTo(null);
		} catch (error) {
			console.error('Failed to create comment:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderComment = (comment: CommentTree, depth: number = 0) => (
		<div key={comment.id} className="comment" style={{ marginLeft: `${depth * 1.5}rem` }}>
			<div className="comment-content">{comment.content}</div>
			<div className="comment-meta">
				<span className="comment-author">User {comment.authorId.slice(0, 8)}</span>
				<span className="comment-date">
					{new Date(comment.createdAt).toLocaleDateString()}
				</span>
				<button
					className="comment-reply-btn"
					onClick={() => setReplyingTo(comment.id)}
				>
					Reply
				</button>
			</div>

			{replyingTo === comment.id && (
				<div className="reply-form">
					<textarea
						value={newComment}
						onChange={(e) => setNewComment(e.target.value)}
						placeholder="Write your reply..."
						rows={3}
					/>
					<div className="reply-form-actions">
						<button onClick={() => handleSubmit(comment.id)} disabled={isSubmitting}>
							{isSubmitting ? 'Sending...' : 'Send Reply'}
						</button>
						<button onClick={() => { setReplyingTo(null); setNewComment(''); }}>
							Cancel
						</button>
					</div>
				</div>
			)}

			{comment.children.length > 0 && (
				<div className="comment-children">
					{comment.children.map((child) => renderComment(child, depth + 1))}
				</div>
			)}
		</div>
	);

	return (
		<div className="comment-section">
			<div className="comment-section-header">
				<button className="back-btn" onClick={onBack}>← Back</button>
				<h2>Comments</h2>
			</div>

			<div className="post-detail">
				<div className="post-detail-content">{post.content}</div>
				<div className="post-detail-meta">
					By User {post.authorId.slice(0, 8)} • {new Date(post.createdAt).toLocaleDateString()}
				</div>
			</div>

			<div className="new-comment-form">
				<textarea
					value={newComment}
					onChange={(e) => setNewComment(e.target.value)}
					placeholder="Write a comment..."
					rows={4}
					disabled={isSubmitting || replyingTo !== null}
				/>
				<button
					onClick={() => handleSubmit(null)}
					disabled={!newComment.trim() || isSubmitting || replyingTo !== null}
				>
					{isSubmitting ? 'Sending...' : 'Post Comment'}
				</button>
			</div>

			<div className="comments-list">
				{comments.length === 0 ? (
					<div className="comments-empty">No comments yet. Be the first to comment!</div>
				) : (
					comments.map((comment) => renderComment(comment))
				)}
			</div>
		</div>
	);
}

export default CommentSection;

