import type { users } from "../infra/database";
import { type UserRepository } from "../repositories/user.repository";

export class UserServiceError extends Error {}

interface Dependencies {
	userRepository: UserRepository;
}

export const makeUserService = ({ userRepository }: Dependencies) => {
	const getOrCreateUser = async (tgUserId: number, userName?: string) => {
		const user =
			(await userRepository.findById(String(tgUserId))) || (await userRepository.newUser(tgUserId, userName ?? ""));
		return user;
	};

	/**
	 * Updates an existing user by ID.
	 * Only provided fields will be updated.
	 */
	const updateUser = async (userId: string, updates: Partial<Omit<typeof users.$inferInsert, "id" | "createdAt">>) => {
		return await userRepository.updateUser(userId, updates);
	};

	const getUserById = (userId: number) => userRepository.findById(String(userId));

	const getUserByIdOrUsername = async (idOrNameInput: string) => {
		const byId = await userRepository.findById(idOrNameInput);
		if (byId) return byId;
		return await userRepository.findUserByUsername(idOrNameInput);
	};

	const findUserByRefCode = async (refCode: string) => {
		return await userRepository.findUserByRefCode(refCode);
	};

	const createUser = async (tgUserId: number, tgUsername: string, referrerId?: string) => {
		return await userRepository.newUser(tgUserId, tgUsername, false, referrerId);
	};

	const findUserByUsername = async (username: string) => {
		return await userRepository.findUserByUsername(username);
	};

	const getReferredUsersCount = async () => {
		return await userRepository.getReferredUsersCount();
	};

	const getAllReferredUsersRecursive = async (userId: string, visited: Set<string> = new Set()) => {
		return await userRepository.getAllReferredUsersRecursive(userId, visited);
	};

	const findAllUsers = async () => {
		return await userRepository.findAll();
	};

	/**
	 * Batch set whitelistedAccess for the provided user IDs.
	 * Returns the list of IDs that were updated.
	 */
	const batchUpdateUserWhitelisted = async (userIds: number[] | string[], value: boolean) => {
		const ids = userIds.map(id => String(id));
		return await userRepository.updateUsersWhitelisted(ids, value);
	};

	/**
	 * Returns the subset of provided IDs that are currently whitelisted.
	 */
	const getWhitelisted = async (userIds: number[] | string[]) => {
		const ids = userIds.map(id => String(id));
		return await userRepository.findWhitelistedIdsByIds(ids);
	};

	/**
	 * Get users by multiple IDs.
	 * Returns an array of users that exist in the database.
	 */
	const getUsersByIds = async (userIds: number[] | string[]) => {
		const ids = userIds.map(id => String(id));
		return await userRepository.findByIds(ids);
	};

	const deleteUser = async (userId: string) => {
		return await userRepository.deleteUser(userId);
	};

	return {
		getUserById,
		getOrCreateUser,
		updateUser,
		findUserByRefCode,
		createUser,
		findUserByUsername,
		getReferredUsersCount,
		getAllReferredUsersRecursive,
		findAllUsers,
		batchUpdateUserWhitelisted,
		getWhitelisted,
		getUsersByIds,
		deleteUser,
		getUserByIdOrUsername,
	};
};

export type UserService = ReturnType<typeof makeUserService>;
