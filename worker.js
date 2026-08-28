import { createOpenAI } from '@ai-sdk/openai';
import { jsonSchema, streamText, tool } from 'ai';

const GH = 'https://api.github.com';
const UA = 'calm.apexlinks.org';

const cookie = (req, name) =>
	(req.headers.get('cookie') || '')
		.split(';')
		.map((x) => x.trim())
		.find((x) => x.startsWith(name + '='))
		?.slice(name.length + 1);

const set_cookie = (name, val, max = 60 * 60 * 24 * 30) =>
	`${name}=${val}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${max}`;

const clear_cookie = (name) => `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

const json = (o, status = 200, extra = {}) =>
	new Response(JSON.stringify(o), {
		status,
		headers: { 'content-type': 'application/json', ...extra }
	});

const redir = (url, headers = {}) => new Response(null, { status: 302, headers: { location: url, ...headers } });

const gh = (token, path, init = {}) =>
	fetch(GH + path, {
		...init,
		headers: {
			accept: 'application/vnd.github+json',
			authorization: `Bearer ${token}`,
			'user-agent': UA,
			...(init.headers || {})
		}
	});

async function me(token) {
	const r = await gh(token, '/user');
	if (!r.ok) return null;
	const u = await r.json();
	return u.login || null;
}

function file_of(gist) {
	return Object.values(gist.files || {}).find((f) => /^resume\.json$/i.test(f.filename || ''));
}

async function find_gist(token) {
	let url = GH + '/gists?per_page=100';
	while (url) {
		const r = await fetch(url, {
			headers: {
				accept: 'application/vnd.github+json',
				authorization: `Bearer ${token}`,
				'user-agent': UA
			}
		});
		if (!r.ok) return { e: 'github ' + r.status, status: r.status };
		const list = await r.json();
		for (const g of list) {
			const f = file_of(g);
			if (f) return { g, f };
		}
		const link = r.headers.get('link') || '';
		const next = link.split(',').find((p) => p.includes('rel="next"'));
		url = next ? (next.match(/<([^>]+)>/) || [])[1] : '';
	}
	return { e: 'no resume.json gist', status: 404 };
}

async function load_resume(token) {
	const found = await find_gist(token);
	if (found.e) return found;
	let text = found.f.content;
	if (found.f.truncated || !text) {
		const raw = await fetch(found.f.raw_url, {
			headers: { authorization: `Bearer ${token}`, 'user-agent': UA }
		});
		if (!raw.ok) return { e: 'could not read that gist', status: raw.status };
		text = await raw.text();
	}
	try {
		return { g: found.g, f: found.f, r: JSON.parse(text) };
	} catch {
		return { e: 'resume.json is not valid json', status: 400 };
	}
}

function ok_resume(r) {
	return r && typeof r === 'object' && !Array.isArray(r) && r.basics && typeof r.basics === 'object';
}

async function owner(req) {
	const token = cookie(req, 'c');
	if (!token) return { status: 401, e: 'log in with github' };
	const u = await me(token);
	if (!u) return { status: 401, e: 'log in with github' };
	return { token, u };
}

async function owner_of(req, who) {
	const o = await owner(req);
	if (o.e) return o;
	if (!who || o.u.toLowerCase() !== who.toLowerCase()) return { status: 403, e: 'not your résumé' };
	return o;
}

const SYS = `you edit this person's json resume. when they ask for a change, call apply_resume with the full updated object. never invent employers, jobs, dates, degrees, awards, or skills. only change what they asked. keep every other field. short lowercase replies. the current resume.json is given each turn.`;

export default {
	async fetch(req, env, ctx) {
		const url = new URL(req.url);
		const p = url.pathname;

		if (p === '/login') return login(req, env, url);
		if (p === '/callback') return callback(req, env, url);
		if (p === '/logout') {
			return redir('/', { 'set-cookie': clear_cookie('c') });
		}
		if (p === '/api/me') return api_me(req);
		if (p === '/api/resume') return api_resume(req, url);
		if (p === '/api/chat') return api_chat(req, env);
		if (p === '/api/transcribe') return api_transcribe(req, env);

		return env.ASSETS.fetch(req);
	}
};

function login(req, env, url) {
	if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
		return new Response('oauth not configured', { status: 503 });
	}
	const state = crypto.randomUUID();
	const next = url.searchParams.get('next') || '/';
	const origin = url.origin;
	const ghurl = new URL('https://github.com/login/oauth/authorize');
	ghurl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
	ghurl.searchParams.set('redirect_uri', origin + '/callback');
	ghurl.searchParams.set('scope', 'gist');
	ghurl.searchParams.set('state', state);
	const headers = new Headers({ location: ghurl.toString() });
	headers.append('set-cookie', set_cookie('st', state, 600));
	headers.append('set-cookie', set_cookie('nx', encodeURIComponent(next), 600));
	return new Response(null, { status: 302, headers });
}

async function callback(req, env, url) {
	const state = url.searchParams.get('state');
	const saved = cookie(req, 'st');
	const next = decodeURIComponent(cookie(req, 'nx') || '%2F');
	const clear = [clear_cookie('st'), clear_cookie('nx')];
	if (!saved || saved !== state) {
		const h = new Headers({ location: '/?e=' + encodeURIComponent('github login failed') });
		clear.forEach((c) => h.append('set-cookie', c));
		return new Response(null, { status: 302, headers: h });
	}
	const code = url.searchParams.get('code');
	const tok = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: { accept: 'application/json', 'content-type': 'application/json' },
		body: JSON.stringify({
			client_id: env.GITHUB_CLIENT_ID,
			client_secret: env.GITHUB_CLIENT_SECRET,
			code,
			redirect_uri: url.origin + '/callback'
		})
	});
	const data = await tok.json();
	if (!data.access_token) {
		const h = new Headers({ location: '/?e=' + encodeURIComponent('github login failed') });
		clear.forEach((c) => h.append('set-cookie', c));
		return new Response(null, { status: 302, headers: h });
	}
	const u = await me(data.access_token);
	const dest = next === '/' && u ? '/' + u : next;
	const h = new Headers({ location: dest });
	clear.forEach((c) => h.append('set-cookie', c));
	h.append('set-cookie', set_cookie('c', data.access_token));
	return new Response(null, { status: 302, headers: h });
}

async function api_me(req) {
	const o = await owner(req);
	if (o.e) return json({ u: '' });
	return json({ u: o.u });
}

async function api_resume(req, url) {
	const who = url.searchParams.get('u') || '';
	const o = await owner_of(req, who);
	if (o.e) return json({ e: o.e }, o.status);
	const loaded = await load_resume(o.token);
	if (loaded.e) return json({ e: loaded.e }, loaded.status || 404);
	return json({ r: loaded.r, i: loaded.g.id, n: loaded.f.filename });
}

async function api_chat(req, env) {
	if (req.method !== 'POST') return json({ e: 'method' }, 405);
	if (!env.OPENCODE_API_KEY) return json({ e: 'chat not configured' }, 503);
	const body = await req.json().catch(() => ({}));
	const who = String(body.u || '');
	const messages = Array.isArray(body.m) ? body.m : [];
	const o = await owner_of(req, who);
	if (o.e) return json({ e: o.e }, o.status);
	const loaded = await load_resume(o.token);
	if (loaded.e) return json({ e: loaded.e }, loaded.status || 404);

	const openai = createOpenAI({
		apiKey: env.OPENCODE_API_KEY,
		baseURL: 'https://opencode.ai/zen/v1'
	});

	const result = streamText({
		model: openai('muse-spark-1.2-contributor-free'),
		system: SYS + '\n\n' + JSON.stringify(loaded.r),
		messages: messages
			.filter((x) => x && (x.role === 'user' || x.role === 'assistant') && typeof x.content === 'string')
			.slice(-20),
		tools: {
			apply_resume: tool({
				description: 'write the full updated resume.json to the user gist',
				inputSchema: jsonSchema({
					type: 'object',
					properties: {
						r: { type: 'object', description: 'the full resume object' }
					},
					required: ['r']
				}),
				execute: async ({ r }) => {
					if (!ok_resume(r)) return { ok: 0, e: 'invalid resume' };
					const patch = await gh(o.token, `/gists/${loaded.g.id}`, {
						method: 'PATCH',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({
							files: { [loaded.f.filename]: { content: JSON.stringify(r, null, 2) } }
						})
					});
					if (!patch.ok) return { ok: 0, e: 'github write failed' };
					return { ok: 1, r };
				}
			})
		}
	});

	return result.toUIMessageStreamResponse();
}

async function api_transcribe(req, env) {
	if (req.method !== 'POST') return json({ e: 'method' }, 405);
	if (!env.GROQ_API_KEY) return json({ e: 'voice not configured' }, 503);
	const o = await owner(req);
	if (o.e) return json({ e: o.e }, o.status);
	const form = await req.formData();
	const file = form.get('file');
	if (!file || typeof file === 'string') return json({ e: 'no speech detected' }, 400);
	const fd = new FormData();
	fd.set('file', file, file.name || 'chunk.wav');
	fd.set('model', 'whisper-large-v3');
	fd.set('language', 'en');
	fd.set('response_format', 'json');
	const prompt = form.get('prompt');
	if (typeof prompt === 'string' && prompt) fd.set('prompt', prompt.slice(-200));
	const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
		method: 'POST',
		headers: { authorization: `Bearer ${env.GROQ_API_KEY}` },
		body: fd
	});
	if (!r.ok) return json({ e: 'could not transcribe' }, r.status);
	const data = await r.json();
	return json({ t: (data.text || '').trim() });
}
