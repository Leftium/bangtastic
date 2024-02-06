import { redirect } from '@sveltejs/kit';

export const load = async ({ url }) => {
	const q = url.searchParams.get('q');
	if (q) {
		redirect(302, `https://kagi.com/search?q=${q}`);
	}
};
