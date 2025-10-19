import { Router } from "express";
import { makePostController } from "../controllers/post.controller";
import { makePostService } from "../../../shared/services/post.service";
import { makePostRepository } from "../../../shared/repositories/post.repository";

export const postRouter = Router();

const postController = makePostController(makePostService(makePostRepository()));

// Post routes
postRouter.post("/", (req, res) => postController.createPost(req, res));
postRouter.get("/", (req, res) => postController.getPosts(req, res));
postRouter.get("/:postId", (req, res) => postController.getPost(req, res));

// Comment routes
postRouter.post("/:postId/comments", (req, res) => postController.createComment(req, res));
postRouter.get("/:postId/comments", (req, res) => postController.getComments(req, res));

