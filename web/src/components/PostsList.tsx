import type { Post } from '../hooks/usePosts';

interface PostsListProps {
	posts: Post[];
	onSelectPost: (post: Post) => void;
	isLoading: boolean;
}

function PostsList({ posts, onSelectPost, isLoading }: PostsListProps) {
	if (isLoading) {
		return (
			<div className="text-center py-12 text-primary-600 text-xl animate-pulse">
				Loading posts...
			</div>
		);
	}

	if (posts.length === 0) {
		return (
			<div className="text-center py-16 px-4">
				<p className="text-2xl text-gray-600 mb-2">No posts yet</p>
				<p className="text-base text-gray-400">Use the bot to create your first post!</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3 p-3">
			{posts.map((post) => (
				<div
					key={post.id}
					className="gradient-purple rounded-xl p-4 cursor-pointer transition-all duration-200 
					           hover:scale-[1.01] hover:shadow-lg active:scale-100 shadow-md"
					onClick={() => onSelectPost(post)}
				>
					<div className="text-white text-sm leading-relaxed mb-3 break-words">
						{post.content}
					</div>
					<div className="flex justify-between items-center text-xs text-white/80">
						<span className="font-medium">User {post.authorId.slice(0, 8)}</span>
						<span className="italic">
							{new Date(post.createdAt).toLocaleDateString()}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}

export default PostsList;
