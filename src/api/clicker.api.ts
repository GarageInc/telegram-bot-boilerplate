import { createHmac } from "node:crypto";
import type { BotDependencies } from "../dependencies.ts";

/**
 * Validate Telegram Web App init data
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function validateTelegramWebAppData(initData: string, botToken: string): boolean {
	try {
		const urlParams = new URLSearchParams(initData);
		const hash = urlParams.get("hash");
		urlParams.delete("hash");
		
		if (!hash) return false;
		
		// Create data-check-string
		const dataCheckArr: string[] = [];
		for (const [key, value] of urlParams.entries()) {
			dataCheckArr.push(`${key}=${value}`);
		}
		dataCheckArr.sort();
		const dataCheckString = dataCheckArr.join("\n");
		
		// Create secret key
		const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
		
		// Calculate hash
		const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
		
		return calculatedHash === hash;
	} catch (error) {
		console.error("Telegram Web App data validation error:", error);
		return false;
	}
}

/**
 * Extract user ID from Telegram init data
 */
function extractUserId(initData: string): string | null {
	try {
		const urlParams = new URLSearchParams(initData);
		const userParam = urlParams.get("user");
		if (!userParam) return null;
		
		const user = JSON.parse(userParam);
		return user?.id ? String(user.id) : null;
	} catch (error) {
		console.error("Error extracting user ID:", error);
		return null;
	}
}

/**
 * API handler for clicker game endpoints
 */
export const createClickerAPI = (deps: BotDependencies, botToken: string) => {
	/**
	 * GET /api/clicker/stats
	 * Get user and global click statistics
	 */
	const getStats = async (request: Request): Promise<Response> => {
		try {
			const url = new URL(request.url);
			const userIdParam = url.searchParams.get("userId");
			const initData = url.searchParams.get("initData");
			
			if (!userIdParam || !initData) {
				return new Response(
					JSON.stringify({ error: "Missing userId or initData" }),
					{ status: 400, headers: { "Content-Type": "application/json" } }
				);
			}
			
			// Validate Telegram Web App data
			if (!validateTelegramWebAppData(initData, botToken)) {
				return new Response(
					JSON.stringify({ error: "Invalid Telegram Web App data" }),
					{ status: 401, headers: { "Content-Type": "application/json" } }
				);
			}
			
			// Verify user ID matches
			const extractedUserId = extractUserId(initData);
			if (extractedUserId !== userIdParam) {
				return new Response(
					JSON.stringify({ error: "User ID mismatch" }),
					{ status: 403, headers: { "Content-Type": "application/json" } }
				);
			}
			
			// Get stats
			const [userClicks, globalClicks] = await Promise.all([
				deps.clickerService.getUserClicks(userIdParam),
				deps.clickerService.getGlobalClicks(),
			]);
			
			return new Response(
				JSON.stringify({
					userClicks,
					globalClicks,
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				}
			);
		} catch (error) {
			console.error("Error in getStats:", error);
			return new Response(
				JSON.stringify({ error: "Internal server error" }),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}
	};
	
	/**
	 * POST /api/clicker/click
	 * Record click(s) from user
	 */
	const recordClick = async (request: Request): Promise<Response> => {
		try {
			const body: any = await request.json();
			const { userId, amount = 1, initData } = body;
			
			if (!userId || !initData) {
				return new Response(
					JSON.stringify({ error: "Missing userId or initData" }),
					{ status: 400, headers: { "Content-Type": "application/json" } }
				);
			}
			
			// Validate amount
			if (typeof amount !== "number" || amount < 1 || amount > 100) {
				return new Response(
					JSON.stringify({ error: "Invalid amount (must be 1-100)" }),
					{ status: 400, headers: { "Content-Type": "application/json" } }
				);
			}
			
			// Validate Telegram Web App data
			if (!validateTelegramWebAppData(initData, botToken)) {
				return new Response(
					JSON.stringify({ error: "Invalid Telegram Web App data" }),
					{ status: 401, headers: { "Content-Type": "application/json" } }
				);
			}
			
			// Verify user ID matches
			const extractedUserId = extractUserId(initData);
			if (extractedUserId !== String(userId)) {
				return new Response(
					JSON.stringify({ error: "User ID mismatch" }),
					{ status: 403, headers: { "Content-Type": "application/json" } }
				);
			}
			
			// Rate limiting check (simple in-memory, should use Redis in production)
			// This is a basic check - the broadcaster service handles the real rate limiting
			
			// Record clicks
			const newTotal = await deps.clickerService.incrementClicks(String(userId), amount);
			const globalClicks = await deps.clickerService.getGlobalClicks();
			
			// Invalidate leaderboard cache
			await deps.leaderboardService.invalidateCache();
			
			return new Response(
				JSON.stringify({
					success: true,
					userClicks: newTotal,
					globalClicks,
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				}
			);
		} catch (error) {
			console.error("Error in recordClick:", error);
			return new Response(
				JSON.stringify({ error: "Internal server error" }),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}
	};
	
	return {
		getStats,
		recordClick,
	};
};

