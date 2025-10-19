import './PostsList.css';
import type { Post } from '../hooks/usePosts';

interface PostsListProps {
	posts: Post[];
	onSelectPost: (post: Post) => void;
	isLoading: boolean;
}

function PostsList({ posts, onSelectPost, isLoading }: PostsListProps) {
	if (isLoading) {
		return <div className="posts-loading">Loading posts...</div>;
	}

	if (posts.length === 0) {
		return (
			<div className="posts-empty">
				<p>No posts yet</p>
				<p className="posts-empty-hint">Use the bot to create your first post!</p>
			</div>
		);
	}

	return (
		<div className="posts-list">
			{posts.map((post) => (
				<div
					key={post.id}
					className="post-card"
					onClick={() => onSelectPost(post)}
				>
					<div className="post-content">{post.content}</div>
					<div className="post-meta">
						<span className="post-author">By User {post.authorId.slice(0, 8)}</span>
						<span className="post-date">
							{new Date(post.createdAt).toLocaleDateString()}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}

export default PostsList;

