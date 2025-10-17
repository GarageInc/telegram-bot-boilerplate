import { eq, desc, sql, gt } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { users } from "../database/schema";

export function makeUserRepository(db: NodePgDatabase) {
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
		updateUser,
		getTopClickerUsers,
		getUserRank,
	};
}

export type UserRepository = ReturnType<typeof makeUserRepository>;
