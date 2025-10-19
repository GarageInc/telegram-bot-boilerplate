import { Post, Comment } from "../database/mongo-models";
import type { IPost, IComment } from "../database/mongo-models";

export interface PostDocument {
	id: string;
	authorId: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface CommentDocument {
	id: string;
	postId: string;
	authorId: string;
	parentId: string | null;
	content: string;
	createdAt: string;
	updatedAt: string;
}

// Helper to convert MongoDB document to plain object
function toPostDocument(doc: IPost): PostDocument {
	return {
		id: doc._id.toString(),
		authorId: doc.authorId,
		content: doc.content,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString(),
	};
}

function toCommentDocument(doc: IComment): CommentDocument {
	return {
		id: doc._id.toString(),
		postId: doc.postId,
		authorId: doc.authorId,
		parentId: doc.parentId,
		content: doc.content,
		createdAt: doc.createdAt.toISOString(),
		updatedAt: doc.updatedAt.toISOString(),
	};
}

export const makePostRepository = () => ({
	async createPost(authorId: string, content: string): Promise<PostDocument> {
		const post = await Post.create({
			authorId,
			content,
		});
		
		return toPostDocument(post);
	},

	async getPostById(postId: string): Promise<PostDocument | null> {
		const post = await Post.findById(postId);
		
		if (!post) return null;
		
		return toPostDocument(post);
	},

	async getAllPosts(limit = 50, offset = 0): Promise<PostDocument[]> {
		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(offset);
		
		return posts.map(post => toPostDocument(post));
	},

	async getPostsByAuthor(authorId: string): Promise<PostDocument[]> {
		const posts = await Post.find({ authorId })
			.sort({ createdAt: -1 });
		
		return posts.map(post => toPostDocument(post));
	},

	async createComment(
		postId: string,
		authorId: string,
		content: string,
		parentId: string | null = null
	): Promise<CommentDocument> {
		const comment = await Comment.create({
			postId,
			authorId,
			parentId,
			content,
		});
		
		return toCommentDocument(comment);
	},

	async getCommentsByPostId(postId: string): Promise<CommentDocument[]> {
		const comments = await Comment.find({ postId })
			.sort({ createdAt: -1 });
		
		return comments.map(comment => toCommentDocument(comment));
	},

	async getCommentById(commentId: string): Promise<CommentDocument | null> {
		const comment = await Comment.findById(commentId);
		
		if (!comment) return null;
		
		return toCommentDocument(comment);
	},
});

export type PostRepository = ReturnType<typeof makePostRepository>;

