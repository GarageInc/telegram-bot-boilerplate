import { useState, useCallback, useRef, useEffect } from "react";
import type { TelegramWebApp } from "../types/telegram";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function useClicker(tg: TelegramWebApp) {
	const [clickCount, setClickCount] = useState(0);
	const [globalCount, setGlobalCount] = useState(0);
	const [pendingClicks, setPendingClicks] = useState(0);
	const [comboCount, setComboCount] = useState(0);
	const [rateLimited, setRateLimited] = useState(false);

	const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const userId = tg.initDataUnsafe?.user?.id;

	const loadStats = useCallback(async () => {
		if (!userId) return;

		try {
			const response = await fetch(
				`${API_URL}/api/clicker/stats?userId=${userId}&initData=${encodeURIComponent(tg.initData)}`,
			);

			if (!response.ok) throw new Error("Failed to load stats");

			const data = await response.json();
			setClickCount(data.userClicks || 0);
			setGlobalCount(data.globalClicks || 0);
		} catch (error) {
			console.error("Error loading stats:", error);
			throw error;
		}
	}, [userId, tg.initData]);

	const syncClicks = useCallback(
		async (amount: number) => {
			if (!userId || amount === 0 || rateLimited) return;

			try {
				const response = await fetch(`${API_URL}/api/clicker/click`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						userId,
						amount,
						initData: tg.initData,
					}),
				});

				if (!response.ok) {
					if (response.status === 429) {
						setRateLimited(true);
						setPendingClicks(prev => prev + amount);

						setTimeout(() => {
							setRateLimited(false);
						}, 3000);

						return;
					}
					throw new Error("Failed to sync clicks");
				}

				const data = await response.json();
				setGlobalCount(data.globalClicks || globalCount);
			} catch (error) {
				console.error("Sync error:", error);
				setPendingClicks(prev => prev + amount);
			}
		},
		[userId, tg.initData, rateLimited, globalCount],
	);

	const queueSync = useCallback(() => {
		if (syncTimer.current) {
			clearTimeout(syncTimer.current);
		}

		syncTimer.current = setTimeout(() => {
			if (pendingClicks > 0) {
				const amount = pendingClicks;
				setPendingClicks(0);
				syncClicks(amount);
			}
		}, 500);
	}, [pendingClicks, syncClicks]);

	const handleClick = useCallback(() => {
		setClickCount(prev => prev + 1);
		setPendingClicks(prev => prev + 1);

		// Update combo
		setComboCount(prev => prev + 1);

		if (comboTimer.current) {
			clearTimeout(comboTimer.current);
		}

		comboTimer.current = setTimeout(() => {
			setComboCount(0);
		}, 1000);

		// Haptic feedback
		if (tg.HapticFeedback) {
			tg.HapticFeedback.impactOccurred("light");
		}

		queueSync();
	}, [tg, queueSync]);

	// Periodic sync
	useEffect(() => {
		if (!userId) return;

		const interval = setInterval(async () => {
			try {
				const response = await fetch(
					`${API_URL}/api/clicker/stats?userId=${userId}&initData=${encodeURIComponent(tg.initData)}`,
				);

				if (response.ok) {
					const data = await response.json();

					if (pendingClicks === 0) {
						setClickCount(data.userClicks || clickCount);
					}
					setGlobalCount(data.globalClicks || globalCount);
				}
			} catch (error) {
				console.error("Periodic sync error:", error);
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [userId, tg.initData, pendingClicks, clickCount, globalCount]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (syncTimer.current) clearTimeout(syncTimer.current);
			if (comboTimer.current) clearTimeout(comboTimer.current);
		};
	}, []);

	return {
		clickCount,
		globalCount,
		pendingClicks,
		comboCount,
		rateLimited,
		handleClick,
		loadStats,
	};
}
