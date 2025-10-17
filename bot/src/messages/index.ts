import { skeletonLoader, ZWSP } from "../utils/index.ts";
import { generateReferralLink } from "../utils/referral.ts";
import type { Database } from "../infra/database/drizzle/types.ts";

export interface Pagination {
	page: number;
	total: number;
	size: number;
}

export const COMMON_BUTTONS = {
	back: "← Back",
	backToStart: "← Back to Start",
	refresh: "↻ Refresh",
};

export const pad = (length: number) => " ".repeat(length) + ZWSP;

export const onboarding = {
	initial() {
		return [
			"<b>Welcome to Multi-Chain Wallet Bot!</b>",
			'For support and updates, join us on <a href="https://discord.gg/gundotfun">Discord</a>.',
			"<i>Create a wallet to get started.</i>",
		].join("\n\n");
	},
	loading() {
		return [
			`<b>Your multi-chain wallet is being created...</b>`,
			`Please wait while we generate your private keys securely.`,
			`<b>EVM Address:</b>\n<code>${skeletonLoader(42)}</code>`,
			`<b>EVM Private Key:</b>\n<code>${skeletonLoader(64)}</code>`,
			`<b>Solana Address:</b>\n<code>${skeletonLoader(44)}</code>`,
			`<b>Solana Private Key:</b>\n<code>${skeletonLoader(88)}</code>`,
		].join("\n\n");
	},
	pairingWalletsLoading() {
		return [
			`<b>🔗 Pairing your multi-chain wallets...</b>`,
			`<b>EVM Address:</b>\n<code>${skeletonLoader(42)}</code>`,
			`<b>Solana Address:</b>\n<code>${skeletonLoader(44)}</code>`,
		].join("\n\n");
	},
	success() {
		return [
			`<b>Your multi-chain wallet has been created!</b>`,
			`<b>Please keep your private keys secured and never share them with anyone!</b>`,
			`<b>We cannot recover these for you after this message is deleted.</b>`,
		].join("\n\n");
	},
};

export const welcome = `<b>Welcome to Telegram Bot by RFI</b>`;

export const start = {
	loading() {
		return [
			welcome,
			Array.from({ length: 3 }, () => `${skeletonLoader(4)} ${skeletonLoader(3)} (${skeletonLoader(5)})`).join("\n"),
		].join("\n\n");
	},
	initial() {
		return welcome;
	},
	allNetworksToggledOff() {
		return [
			"⚠️ All chains are toggled off. Please enable at least one chain to get started.",
			"<i>💡 Go to /settings to enable chains.</i>",
		].join("\n\n");
	},
	noWallets() {
		return [
			"⚠️ You don't have any wallets. Please create a wallet to get started.",
			"<i>💡 Go to /wallets to create a wallet.</i>",
		].join("\n\n");
	},
	allWalletsInactive() {
		return [
			"⚠️ All wallets are inactive. Please activate at least one wallet to get started.",
			"<i>💡 Go to /wallets to activate a wallet.</i>",
		].join("\n\n");
	},
};

export const error = {
	msg(msg?: string, traceId?: string) {
		let text = ZWSP + "\n🔴 Error:\n\n";

		if (msg) text += msg;
		else text += "An error occurred while processing your request. Please try again later.";

		return text;
	},
};

export const referrals = {
	initial(botUsername: string, userId: string, referralsEnabled: boolean, refCode?: string) {
		if (!referralsEnabled) {
			return `<b>Referrals</b>\n\nReferral links are not enabled for your account yet. Please contact support to enable this feature.`;
		}

		// Generate referral link and count text using utility functions
		const referralLink = generateReferralLink(botUsername, userId, refCode);

		let message = [`<b>Invite a Friend!</b>\n`, `<u>Your Invite Link:</u>`, `<code>${referralLink}</code>\n`].join(
			"\n",
		);

		return message;
	},
};

export const setReferralCode = {
	header() {
		return "Set a new referral code. Once you set a new referral code, you will not be able to change it later.";
	},
	invalidFormat() {
		return "❌ Invalid referral code format. Please use only letters and numbers (3-20 characters).";
	},
	success() {
		return "✅ Referral code updated successfully!";
	},
	error() {
		return "❌ Error setting referral code. Please try again.";
	},
};

// Helper functions
export function escapeHtml(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function formatNumber(num: number): string {
	return num.toLocaleString("en-US");
}

export const clicker = {
	welcome() {
		return "🎮 <b>Welcome to the Clicker Game!</b>\n\nChoose a display name to get started:";
	},
	setDisplayName() {
		return "Please enter your display name (3-20 characters):";
	},
	invalidDisplayName() {
		return "❌ Invalid display name. Please use 3-20 characters (letters, numbers, spaces allowed).";
	},
	displayNameTaken() {
		return "❌ This display name is already taken. Please choose another one.";
	},
	displayNameSuccess(displayName: string) {
		return `✅ Display name set to: <b>${displayName}</b>`;
	},
	changeDisplayName() {
		return "Enter your new display name (3-20 characters):";
	},
	formatWelcomeMessage(
		userClicks: number,
		globalClicks: number,
		leaderboard: Array<{ userId: string; displayName: string; clickCount: number; rank: number }>,
		currentUserId: string,
		userRank: number | null,
	): string {
		const lines: string[] = [];

		lines.push("🎮 <b>Clicker Game</b>\n");
		lines.push(`Your clicks: <b>${formatNumber(userClicks)}</b>`);

		if (userRank !== null) {
			lines.push(`Your rank: <b>#${userRank}</b>`);
		}

		lines.push(`Global clicks: <b>${formatNumber(globalClicks)}</b>\n`);

		// Leaderboard
		if (leaderboard.length > 0) {
			lines.push("🏆 <b>Top 20 Clickers</b>\n");

			for (const entry of leaderboard) {
				const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : "  ";
				const highlight = entry.userId === currentUserId ? "👉 " : "";
				const name = escapeHtml(entry.displayName);

				lines.push(
					`${medal} ${highlight}<code>${entry.rank}.</code> ${name}: <b>${formatNumber(entry.clickCount)}</b>`,
				);
			}
		} else {
			lines.push("🏆 No clicks yet! Be the first!");
		}

		return lines.join("\n");
	},
};

export const admin = {
	header() {
		return "Admin Panel";
	},
	queryUser() {
		return "Enter user ID or username to query:";
	},
	userNotFound() {
		return "❌ User not found.";
	},
	userInfo(user: Database.User) {
		return [
			`<b>User Information</b>`,
			`ID: ${user.id}`,
			`Username: ${user.username || "N/A"}`,
			`Referrer ID: ${user.referrerId || "N/A"}`,
			`Referral Code: ${user.refCode || "N/A"}`,
		].join("\n");
	},
	referralsEnabled() {
		return "✅ Referral links enabled for user.";
	},
	referralsDisabled() {
		return "❌ Failed to enable referral links for user.";
	},
	whitelistSuccess() {
		return "✅ User whitelisted successfully.";
	},
	whitelistError() {
		return "❌ Failed to whitelist user.";
	},
	bulkWhitelistSuccess(count: number) {
		return `✅ Successfully whitelisted ${count} users.`;
	},
	bulkWhitelistReport(updated: number, already: number, notFound: number) {
		return [
			updated ? `Updated: ${updated}` : undefined,
			already ? `Already whitelisted: ${already}` : undefined,
			notFound ? `Not found: ${notFound}` : undefined,
		]
			.filter(Boolean)
			.join("\n");
	},
	bulkWhitelistError() {
		return "❌ Failed to whitelist users.";
	},
	messageSent() {
		return "✅ Message sent to all users.";
	},
	messageError() {
		return "❌ Failed to send message to users.";
	},
	// Bulk whitelist messages
	bulkWhitelistHeader() {
		return "Enter user IDs separated by commas (max 100):";
	},
	bulkWhitelistInvalidIds() {
		return "❌ Please enter valid user IDs separated by commas.";
	},
	bulkWhitelistTooMany() {
		return "❌ Maximum 100 users allowed per bulk operation.";
	},
	// Welcome message for whitelisted users
	welcomeWhitelistedUser(username: string) {
		return `🎉 <b>Welcome ${username}</b>!\n\nYou are off the waitlist for the Closed Beta! \n\n Click /start to get started!`;
	},
	// Enable referrals messages
	enableReferralsHeader() {
		return "Enter user ID or username to enable referral links:";
	},
	enableReferralsInvalidId() {
		return "❌ Please enter a valid user ID (number).";
	},
	// Query user messages
	queryUserError() {
		return "❌ Error querying user. Please try again.";
	},
	// Whitelist user messages
	whitelistUserHeader() {
		return "Enter user ID to whitelist:";
	},
	whitelistUserInvalidId() {
		return "❌ Please enter a valid user ID (number).";
	},
	// Remove user messages
	removeUserHeader() {
		return "Enter the user ID or username to remove from the database:\n\n⚠️ This action cannot be undone!";
	},
	removeUserSuccess(username: string, id: string) {
		return `✅ User "${username || id}" has been removed from the database. They can now go through the onboarding process again.`;
	},
	removeUserError() {
		return "❌ Error removing user. Please try again.";
	},
};
