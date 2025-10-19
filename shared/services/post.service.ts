import type { PostRepository, PostDocument, CommentDocument } from "../repositories/post.repository";

export interface CommentTree extends CommentDocument {
	children: CommentTree[];
	authorName?: string;
}

export const makePostService = (postRepository: PostRepository) => ({
	async createPost(authorId: string, content: string): Promise<PostDocument> {
		if (!content.trim()) {
			throw new Error("Post content cannot be empty");
		}
		if (content.length > 4000) {
			throw new Error("Post content is too long (max 4000 characters)");
		}
		return postRepository.createPost(authorId, content);
	},

	async getPostById(postId: string): Promise<PostDocument | null> {
		return postRepository.getPostById(postId);
	},

	async getAllPosts(limit = 50, offset = 0): Promise<PostDocument[]> {
		return postRepository.getAllPosts(limit, offset);
	},

	async getPostsByAuthor(authorId: string): Promise<PostDocument[]> {
		return postRepository.getPostsByAuthor(authorId);
	},

	async createComment(
		postId: string,
		authorId: string,
		content: string,
		parentId: string | null = null
	): Promise<CommentDocument> {
		if (!content.trim()) {
			throw new Error("Comment content cannot be empty");
		}
		if (content.length > 2000) {
			throw new Error("Comment content is too long (max 2000 characters)");
		}

		// Verify post exists
		const post = await postRepository.getPostById(postId);
		if (!post) {
			throw new Error("Post not found");
		}

		// Verify parent comment exists if parentId is provided
		if (parentId) {
			const parentComment = await postRepository.getCommentById(parentId);
			if (!parentComment) {
				throw new Error("Parent comment not found");
			}
			if (parentComment.postId !== postId) {
				throw new Error("Parent comment does not belong to this post");
			}
		}

		return postRepository.createComment(postId, authorId, content, parentId);
	},

	async getCommentsByPostId(postId: string): Promise<CommentDocument[]> {
		return postRepository.getCommentsByPostId(postId);
	},

	async getCommentsTree(postId: string): Promise<CommentTree[]> {
		const comments = await postRepository.getCommentsByPostId(postId);
		return buildCommentTree(comments);
	},
});

function buildCommentTree(comments: CommentDocument[]): CommentTree[] {
	const commentMap = new Map<string, CommentTree>();
	const rootComments: CommentTree[] = [];

	// First pass: create all comment nodes
	comments.forEach(comment => {
		commentMap.set(comment.id, { ...comment, children: [] });
	});

	// Second pass: build the tree structure
	comments.forEach(comment => {
		const node = commentMap.get(comment.id)!;
		if (comment.parentId) {
			const parent = commentMap.get(comment.parentId);
			if (parent) {
				parent.children.push(node);
			} else {
				// Parent not found, treat as root
				rootComments.push(node);
			}
		} else {
			rootComments.push(node);
		}
	});

	return rootComments;
}

export type PostService = ReturnType<typeof makePostService>;

