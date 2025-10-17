import * as crypto from "node:crypto";
import { REFERRAL_CRYPTO_KEY, REFERRAL_CRYPTO_IV } from "../env.ts";

export function encrypt(phrase: string): string {
	const algorithm = "aes-256-cbc";

	const cipher = crypto.createCipheriv(
		algorithm,
		Buffer.from(REFERRAL_CRYPTO_KEY, "hex"),
		Buffer.from(REFERRAL_CRYPTO_IV, "hex"),
	);

	let encrypted = cipher.update(phrase, "utf8", "hex");
	encrypted += cipher.final("hex");

	return encrypted;
}

export function generateReferralLink(botUsername: string, userId: string, refCode?: string): string {
	if (refCode) {
		// User has a custom referral code
		return `https://t.me/${botUsername}?start=r-${refCode}`;
	} else {
		// User doesn't have a custom referral code, use encrypted userId
		const encryptedUserId = encrypt(userId);
		return `https://t.me/${botUsername}?start=r-${encryptedUserId}`;
	}
}

export function getReferralCountText(referralCount: number, hasRefCode: boolean): string {
	return hasRefCode ? `Friends Referred: ${referralCount}` : `Referral Count: ${referralCount}`;
}

export function decrypt(encryptedText: string): string {
	const algorithm = "aes-256-cbc";

	const decipher = crypto.createDecipheriv(
		algorithm,
		Buffer.from(REFERRAL_CRYPTO_KEY, "hex"),
		Buffer.from(REFERRAL_CRYPTO_IV, "hex"),
	);

	let decrypted = decipher.update(encryptedText, "hex", "utf8");
	decrypted += decipher.final("utf8");

	return decrypted;
}
