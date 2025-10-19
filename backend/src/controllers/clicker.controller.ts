import type { Request, Response } from "express";
import type { ClickerService } from "../../../shared/services/clicker.service";
import type { LeaderboardService } from "../../../shared/services/leaderboard.service";

export const makeClickerController = (
	clickerService: ClickerService,
	leaderboardService: LeaderboardService
) => ({
	async getStats(req: Request, res: Response) {
		try {
			const userId = req.query.userId as string;

			if (!userId) {
				return res.status(400).json({ error: "Missing userId" });
			}

			const [userClicks, globalClicks] = await Promise.all([
				clickerService.getUserClicks(userId),
				clickerService.getGlobalClicks(),
			]);

			res.json({
				userClicks,
				globalClicks,
			});
		} catch (error) {
			console.error("Error in getStats:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	},

	async handleClick(req: Request, res: Response) {
		try {
			const { userId, amount = 1 } = req.body;

			if (!userId) {
				return res.status(400).json({ error: "Missing userId" });
			}

			if (typeof amount !== "number" || amount < 1 || amount > 100) {
				return res.status(400).json({ error: "Invalid amount (must be 1-100)" });
			}

			// Record clicks
			const newTotal = await clickerService.incrementClicks(userId, amount);
			const globalClicks = await clickerService.getGlobalClicks();

			// Invalidate leaderboard cache
			await leaderboardService.invalidateCache();

			res.json({
				success: true,
				userClicks: newTotal,
				globalClicks,
			});
		} catch (error) {
			console.error("Error in handleClick:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	},
});
