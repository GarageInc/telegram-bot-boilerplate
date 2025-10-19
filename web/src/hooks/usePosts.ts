import { useState, useCallback, useEffect } from "react";
import type { TelegramWebApp } from "../types/telegram";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export interface Post {
	id: string;
	authorId: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface Comment {
	id: string;
	postId: string;
	authorId: string;
	parentId: string | null;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface CommentTree extends Comment {
	children: CommentTree[];
	authorName?: string;
}

export function usePosts(tg: TelegramWebApp) {
	const [posts, setPosts] = useState<Post[]>([]);
	const [selectedPost, setSelectedPost] = useState<Post | null>(null);
	const [comments, setComments] = useState<CommentTree[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadPosts = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch(`${API_URL}/api/posts`);
			if (!response.ok) throw new Error("Failed to load posts");
			const data = await response.json();
			setPosts(data);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const loadPost = useCallback(async (postId: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch(`${API_URL}/api/posts/${postId}`);
			if (!response.ok) throw new Error("Failed to load post");
			const data = await response.json();
			setSelectedPost(data);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const loadComments = useCallback(async (postId: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch(`${API_URL}/api/posts/${postId}/comments?tree=true`);
			if (!response.ok) throw new Error("Failed to load comments");
			const data = await response.json();
			setComments(data);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const createComment = useCallback(
		async (postId: string, content: string, parentId: string | null = null) => {
			setError(null);
			try {
				const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						content,
						parentId,
						initData: tg.initData,
					}),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to create comment");
				}

				// Reload comments after creating
				await loadComments(postId);
			} catch (err: any) {
				setError(err.message);
				throw err;
			}
		},
		[tg.initData, loadComments]
	);

	useEffect(() => {
		loadPosts();
	}, [loadPosts]);

	return {
		posts,
		selectedPost,
		comments,
		isLoading,
		error,
		loadPosts,
		loadPost,
		loadComments,
		createComment,
		setSelectedPost,
	};
}

