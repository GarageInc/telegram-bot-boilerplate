import { and, desc, eq, gt, inArray, isNotNull, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { users } from "../database/schema";

export const makeUserRepository = (db: NodePgDatabase) => {
	const findAll = async () => {
		return await db.select().from(users);
	};

	const findById = async (id: string) => {
		const result = await db.select().from(users).where(eq(users.id, id));
		return result.length > 0 ? result[0] : null;
	};

	const updateUser = async (id: string, updates: Partial<typeof users.$inferInsert>) => {
		if (Object.keys(updates).length === 0) {
			throw new Error("No update fields provided");
		}

		const result = await db
			.update(users)
			.set({
				...updates,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(users.id, id))
			.returning();

		return result[0] ?? null;
	};

	const newUser = async (tgUserId: number, tgUsername: string, whiteList: boolean = false, referrerId?: string) => {
		console.log(`Creating new user with ID: ${tgUserId}`);
		const result = await db
			.insert(users)
			.values({
				id: String(tgUserId),
				whitelistedAccess: whiteList,
				username: tgUsername,
				updatedAt: new Date().toISOString(),
				...(referrerId && { referrerId }),
			})
			.returning();
		return result[0];
	};

	const findUserByRefCode = async (refCode: string) => {
		console.log(`Finding user by ref code: ${refCode}`);
		const result = await db.select().from(users).where(eq(users.refCode, refCode));
		return result.length > 0 ? result[0] : null;
	};

	const findUserByUsername = async (username: string) => {
		const result = await db.select().from(users).where(eq(users.username, username));
		return result.length > 0 ? result[0] : null;
	};

	const getReferredUsersCount = async () => {
		const result = await db.select({ count: users.id }).from(users).where(isNotNull(users.referrerId));
		return result.length;
	};

	/**
	 * Batch update whitelisted_access for a list of user IDs.
	 * Returns the list of user IDs that were updated (i.e. existed in DB).
	 */
	const updateUsersWhitelisted = async (ids: string[], value: boolean): Promise<string[]> => {
		if (!ids.length) return [];
		const result = await db
			.update(users)
			.set({ whitelistedAccess: value, updatedAt: new Date().toISOString() })
			.where(inArray(users.id, ids))
			.returning({ id: users.id });
		return result.map(r => r.id);
	};

	/**
	 * Returns the subset of provided IDs that are currently whitelisted.
	 */
	const findWhitelistedIdsByIds = async (ids: string[]): Promise<string[]> => {
		if (!ids.length) return [];
		const result = await db
			.select({ id: users.id })
			.from(users)
			.where(and(inArray(users.id, ids), eq(users.whitelistedAccess, true)));
		return result.map(r => r.id);
	};

	/**
	 * Find users by multiple IDs.
	 * Returns an array of users that exist in the database.
	 */
	const findByIds = async (ids: string[]) => {
		if (!ids.length) return [];
		const result = await db.select().from(users).where(inArray(users.id, ids));
		return result;
	};

	const getAllReferredUsersRecursive = async (userId: string, visited: Set<string> = new Set()): Promise<string[]> => {
		// Prevent infinite loops in case of circular references
		if (visited.has(userId)) {
			return [];
		}
		visited.add(userId);

		try {
			// Get direct referred users
			const directReferredUsers = await db.select({ id: users.id }).from(users).where(eq(users.referrerId, userId));

			const allReferredUserIds: string[] = [];

			// Add direct referred users
			for (const user of directReferredUsers) {
				allReferredUserIds.push(user.id);

				// Recursively get their referred users
				const subReferredUsers = await getAllReferredUsersRecursive(user.id, new Set(visited));
				allReferredUserIds.push(...subReferredUsers);
			}

			return [...new Set(allReferredUserIds)]; // Remove duplicates
		} catch (error) {
			console.error(`Error fetching referred users for ${userId}:`, error);
			return [];
		}
	};

	const deleteUser = async (id: string) => {
		console.log(`Deleting user with ID: ${id}`);
		const result = await db.delete(users).where(eq(users.id, id)).returning();
		return result[0] ?? null;
	};

	/**
	 * Find user by display name.
	 */
	const findUserByDisplayName = async (displayName: string) => {
		const result = await db.select().from(users).where(eq(users.displayName, displayName));
		return result.length > 0 ? result[0] : null;
	};


	const getTopClickerUsers = async (limit: number = 20) => {
		return await db.select().from(users).orderBy(desc(users.clickCount)).limit(limit);
	};

	const getUserRank = async (userId: string): Promise<number | null> => {
		const user = await findById(userId);
		if (!user || !user.clickCount || user.clickCount === 0) {
			return null;
		}

		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(users)
			.where(gt(users.clickCount, user.clickCount));

		const rank = (result[0]?.count ?? 0) + 1;
		return rank;
	};

	return {
		findAll,
		findById,
		newUser,
		updateUser,
		findUserByRefCode,
		findUserByUsername,
		getReferredUsersCount,
		getAllReferredUsersRecursive,
		updateUsersWhitelisted,
		findWhitelistedIdsByIds,
		findByIds,
		deleteUser,
		findUserByDisplayName,
		getTopClickerUsers,
		getUserRank,
	};
};

export type UserRepository = ReturnType<typeof makeUserRepository>;

