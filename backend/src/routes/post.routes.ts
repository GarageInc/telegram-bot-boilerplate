import { Router } from "express";
import { makePostController } from "../controllers/post.controller";
import { validateTelegramData } from "../middleware/validateTelegram.ts";
import type { Services } from "../services/index";

export function createPostRouter(services: Services) {
	const router = Router();
	const postController = makePostController(services.postService);

	// Post routes (write operations need validation)
	router.post("/", validateTelegramData, (req, res) => postController.createPost(req, res));
	router.get("/", (req, res) => postController.getPosts(req, res)); // Read-only, no auth needed
	router.get("/:postId", (req, res) => postController.getPost(req, res)); // Read-only, no auth needed

	// Comment routes
	router.post("/:postId/comments", validateTelegramData, (req, res) => postController.createComment(req, res));
	router.get("/:postId/comments", (req, res) => postController.getComments(req, res)); // Read-only, no auth needed

	return router;
}
