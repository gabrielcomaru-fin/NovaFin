import { useEffect, useState, useRef } from 'react';

export function usePersistentState(key, initialValue) {
	const isFirst = useRef(true);
	const [state, setState] = useState(() => {
		try {
			const raw = localStorage.getItem(key);
			return raw !== null ? JSON.parse(raw) : (typeof initialValue === 'function' ? initialValue() : initialValue);
		} catch {
			return typeof initialValue === 'function' ? initialValue() : initialValue;
		}
	});

	useEffect(() => {
		if (isFirst.current) { isFirst.current = false; return; }
		try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
	}, [key, state]);

	return [state, setState];
}


