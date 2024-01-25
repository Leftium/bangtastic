import { bangs } from '$lib/bang';
import { json } from '@sveltejs/kit';

export const GET = async () => {
	return json(bangs);
};
