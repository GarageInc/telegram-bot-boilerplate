import { Router } from "express";
import { makePostController } from "../controllers/post.controller";
import type { Services } from "../services/index";

export function createPostRouter(services: Services) {
	const router = Router();
	const postController = makePostController(services.postService);

	// Post routes
	router.post("/", (req, res) => postController.createPost(req, res));
	router.get("/", (req, res) => postController.getPosts(req, res));
	router.get("/:postId", (req, res) => postController.getPost(req, res));

	// Comment routes
	router.post("/:postId/comments", (req, res) => postController.createComment(req, res));
	router.get("/:postId/comments", (req, res) => postController.getComments(req, res));

	return router;
}
