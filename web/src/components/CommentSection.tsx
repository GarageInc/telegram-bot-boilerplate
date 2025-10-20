import { useState } from 'react';
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
		<div 
			key={comment.id} 
			className="animate-slide-up"
			style={{ marginLeft: `${depth * 1}rem` }}
		>
			<div className="bg-white border-l-2 border-primary-400 p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-shadow">
				<div className="text-gray-800 text-sm leading-relaxed mb-2 break-words">
					{comment.content}
				</div>
				<div className="flex items-center gap-3 text-xs text-gray-600">
					<span className="font-semibold">User {comment.authorId.slice(0, 8)}</span>
					<span className="italic">
						{new Date(comment.createdAt).toLocaleDateString()}
					</span>
					<button
						className="text-primary-600 text-xs font-semibold hover:text-primary-700 hover:bg-primary-50 px-2 py-0.5 rounded transition-colors"
						onClick={() => setReplyingTo(comment.id)}
					>
						Reply
					</button>
				</div>

				{replyingTo === comment.id && (
					<div className="mt-2 p-2 bg-gray-50 rounded-lg">
						<textarea
							value={newComment}
							onChange={(e) => setNewComment(e.target.value)}
							placeholder="Write your reply..."
							rows={2}
							className="w-full p-2 border-2 border-gray-200 rounded-lg text-sm resize-vertical 
							           focus:outline-none focus:border-primary-500 transition-colors"
						/>
						<div className="flex gap-2 mt-2">
							<button 
								onClick={() => handleSubmit(comment.id)} 
								disabled={isSubmitting}
								className="px-3 py-1.5 gradient-purple text-white font-semibold rounded-lg text-xs
								           hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
							>
								{isSubmitting ? 'Sending...' : 'Send'}
							</button>
							<button 
								onClick={() => { setReplyingTo(null); setNewComment(''); }}
								className="px-3 py-1.5 bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs
								           hover:bg-gray-300 transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				)}

				{comment.children.length > 0 && (
					<div className="mt-2">
						{comment.children.map((child) => renderComment(child, depth + 1))}
					</div>
				)}
			</div>
		</div>
	);

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center gap-3 p-3 gradient-purple text-white sticky top-0 z-10 shadow-md">
				<button 
					className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
					onClick={onBack}
				>
					← Back
				</button>
				<h2 className="text-lg font-bold">Comments</h2>
			</div>

			{/* Post Detail */}
			<div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200">
				<div className="text-gray-800 text-base leading-relaxed mb-3">
					{post.content}
				</div>
				<div className="text-sm text-gray-600">
					By User {post.authorId.slice(0, 8)} • {new Date(post.createdAt).toLocaleDateString()}
				</div>
			</div>

			{/* New Comment Form */}
			<div className="p-3 bg-white border-b border-gray-200 shadow-sm">
				<textarea
					value={newComment}
					onChange={(e) => setNewComment(e.target.value)}
					placeholder="Write a comment..."
					rows={3}
					disabled={isSubmitting || replyingTo !== null}
					className="w-full p-2 border-2 border-gray-200 rounded-lg text-sm resize-vertical mb-2
					           focus:outline-none focus:border-primary-500 transition-colors
					           disabled:bg-gray-100 disabled:cursor-not-allowed"
				/>
				<button
					onClick={() => handleSubmit(null)}
					disabled={!newComment.trim() || isSubmitting || replyingTo !== null}
					className="gradient-purple text-white px-4 py-2 rounded-lg font-semibold text-sm
					           hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
					           transition-all shadow-md hover:shadow-lg w-full"
				>
					{isSubmitting ? 'Sending...' : 'Post Comment'}
				</button>
			</div>

			{/* Comments List */}
			<div className="p-3 flex-1 overflow-y-auto">
				{comments.length === 0 ? (
					<div className="text-center py-12 text-gray-500 italic">
						No comments yet. Be the first to comment!
					</div>
				) : (
					comments.map((comment) => renderComment(comment))
				)}
			</div>
		</div>
	);
}

export default CommentSection;

