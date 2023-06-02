import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'

export async function toHTML(md: string) {
	if (!md || md.length < 1) return ''
	return await unified().use(remarkParse).use(remarkRehype).use(rehypeSanitize).use(rehypeStringify).processSync(md).toString()
}

export const getScreenshotLoader = (url: string) => {
	return 'https://rishi-raj-jain-screenshot-default.layer0-limelight.link?url=' + url
}

export function getTitle(val?: string) {
	return val ?? 'Showcase with Storyblok, SvelteKit and Edgio'
}

export function getDescription(val?: string) {
	return val ?? 'Jumpstart your app development process with our pre-built solutions.'
}

export function getDomain(val?: string) {
	return val ?? 'https://rishi-raj-jain-showcase-gallery-storyblok-svelte-5b8f53-default.edgio.link'
}

export function getOrigin(val?: URL) {
	if (val) {
		let hostURL = val['x-host'] ?? val['host']
		if (hostURL) {
			hostURL = hostURL.replace('http://', '').replace('https://', '')
			if (hostURL.includes('localhost:') || hostURL.includes('127.0.0.1')) {
				origin = `http://${hostURL}`
			} else {
				origin = `https://${hostURL}`
			}
		}
		return origin
	}
	return 'https://rishi-raj-jain-showcase-gallery-storyblok-svelte-5b8f53-default.edgio.link'
}
