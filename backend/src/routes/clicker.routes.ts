import { Router } from "express";
import { makeClickerController } from "../controllers/clicker.controller.ts";
import { validateTelegramData } from "../middleware/validateTelegram.ts";
import type { Services } from "../services/index.ts";

export function createClickerRouter(services: Services) {
	const router = Router();
	const clickerController = makeClickerController(services.clickerService, services.leaderboardService);

	router.get("/stats", validateTelegramData, (req, res) => clickerController.getStats(req, res));
	router.post("/click", validateTelegramData, (req, res) => clickerController.handleClick(req, res));

	return router;
}
