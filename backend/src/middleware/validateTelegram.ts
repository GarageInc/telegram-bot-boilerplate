import { createHmac } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const BOT_TOKEN = process.env.BOT_TOKEN!;

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

export function verifyTelegramWebAppData(initData: string): any {
	try {
		if (!validateTelegramWebAppData(initData, BOT_TOKEN)) {
			return null;
		}

		const urlParams = new URLSearchParams(initData);
		const userParam = urlParams.get("user");
		if (!userParam) return null;

		return JSON.parse(userParam);
	} catch (error) {
		console.error("Error verifying Telegram data:", error);
		return null;
	}
}

export function validateTelegramData(req: Request, res: Response, next: NextFunction) {
	const initData = req.query.initData || req.body.initData;

	if (!initData) {
		return res.status(400).json({ error: "Missing initData" });
	}

	// Validate Telegram Web App data
	if (!validateTelegramWebAppData(initData as string, BOT_TOKEN)) {
		return res.status(401).json({ error: "Invalid Telegram Web App data" });
	}

	// Verify user ID matches
	const extractedUserId = extractUserId(initData as string);
	const providedUserId = req.query.userId || req.body.userId;

	if (extractedUserId !== String(providedUserId)) {
		return res.status(403).json({ error: "User ID mismatch" });
	}

	next();
}
