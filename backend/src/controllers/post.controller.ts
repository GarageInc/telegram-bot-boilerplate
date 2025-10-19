import type { Request, Response } from "express";
import type { PostService } from "../../../shared/services/post.service";
import { verifyTelegramWebAppData } from "../middleware/validateTelegram";

export const makePostController = (postService: PostService) => ({
	async createPost(req: Request, res: Response) {
		try {
			const { content, initData } = req.body;

			// Validate Telegram data
			const telegramData = verifyTelegramWebAppData(initData);
			if (!telegramData?.user?.id) {
				return res.status(401).json({ error: "Unauthorized" });
			}

			const authorId = String(telegramData.user.id);
			const post = await postService.createPost(authorId, content);

			res.json(post);
		} catch (error: any) {
			console.error("Error creating post:", error);
			res.status(400).json({ error: error.message || "Failed to create post" });
		}
	},

	async getPosts(req: Request, res: Response) {
		try {
			const limit = parseInt(req.query.limit as string) || 50;
			const offset = parseInt(req.query.offset as string) || 0;

			const posts = await postService.getAllPosts(limit, offset);
			res.json(posts);
		} catch (error: any) {
			console.error("Error fetching posts:", error);
			res.status(500).json({ error: "Failed to fetch posts" });
		}
	},

	async getPost(req: Request, res: Response) {
		try {
			const { postId } = req.params;
			const post = await postService.getPostById(postId);

			if (!post) {
				return res.status(404).json({ error: "Post not found" });
			}

			res.json(post);
		} catch (error: any) {
			console.error("Error fetching post:", error);
			res.status(500).json({ error: "Failed to fetch post" });
		}
	},

	async createComment(req: Request, res: Response) {
		try {
			const { postId } = req.params;
			const { content, parentId, initData } = req.body;

			// Validate Telegram data
			const telegramData = verifyTelegramWebAppData(initData);
			if (!telegramData?.user?.id) {
				return res.status(401).json({ error: "Unauthorized" });
			}

			const authorId = String(telegramData.user.id);
			const comment = await postService.createComment(postId, authorId, content, parentId || null);

			res.json(comment);
		} catch (error: any) {
			console.error("Error creating comment:", error);
			res.status(400).json({ error: error.message || "Failed to create comment" });
		}
	},

	async getComments(req: Request, res: Response) {
		try {
			const { postId } = req.params;
			const tree = req.query.tree === "true";

			if (tree) {
				const comments = await postService.getCommentsTree(postId);
				res.json(comments);
			} else {
				const comments = await postService.getCommentsByPostId(postId);
				res.json(comments);
			}
		} catch (error: any) {
			console.error("Error fetching comments:", error);
			res.status(500).json({ error: "Failed to fetch comments" });
		}
	},
});

