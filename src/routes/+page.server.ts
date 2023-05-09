import type { Seo } from '@/src/classes'
import { redirect } from '@sveltejs/kit'
import { storyblokApi } from '@/src/storyblok'
import { getBase64ImageUrl } from '@/src/image'
import { getDescription, getScreenshotLoader, getTitle } from '@/src/utils'

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ url }) => {
	// Create SEO Object
	const seo: Seo = {
		title: 'Find your Template - ' + getTitle(),
		description: getDescription(),
		domain: url.origin,
		pathname: url.pathname
	}

	let searchParam = url.searchParams.get('search')
	let keyNameParam = url.searchParams.get('keyName')

	try {
		if (keyNameParam?.length > 0) {
			keyNameParam = JSON.parse(decodeURIComponent(keyNameParam))
		}
	} catch (e) {
		// @ts-ignore
		console.log(e.message || e.toString())
		keyNameParam = null
	}

	// Append cdn/stories/ before your full slug path
	// SSR only 20 stories, late populate the remaining stories
	const { data } = await storyblokApi.get(`cdn/stories/`, { per_page: 20, starts_with: 'templates/' })

	if (!data || !data.stories) throw redirect(307, '/404')

	let filteredTemplates = data.stories.map((i) => ({
		slug: i.slug,
		name: i.content.name,
		demoUrl: i.content.demoUrl.url,
		publisher: i.content.publisher,
		description: i.content.description,
		githubUrl: i.content.githubUrl.url,
		...(i.content.css && { css: i.content.css.split(',').map((i: string) => i.trim()) }),
		...(i.content.cms && { cms: i.content.cms.split(',').map((i: string) => i.trim()) }),
		...(i.content.type && { type: i.content.type.split(',').map((i: string) => i.trim()) }),
		...(i.content.framework && { framework: i.content.framework.split(',').map((i: string) => i.trim()) })
	}))

	if (searchParam) {
		filteredTemplates = filteredTemplates.filter((i) => i.name.includes(searchParam) || i.description.includes(searchParam))
	}

	if (keyNameParam) {
		const keys = Object.keys(keyNameParam)
		keys.forEach((i) => {
			if (keyNameParam[i]?.length < 1) delete keyNameParam[i]
		})
		if (Object.keys(keyNameParam).length > 0) {
			filteredTemplates = filteredTemplates.filter((i) => {
				for (const j of Object.keys(keyNameParam)) {
					if (i[j] && i[j].length > 0) {
						for (const eachAttr of i[j]) {
							if (keyNameParam[j].includes(eachAttr)) {
								return true
							}
						}
					}
				}
				return false
			})
		}
	}

	// Create blurURLs for each demoUrl screenshot
	for (let i = 0; i < filteredTemplates.length; i++) {
		if (!(url.hostname === 'localhost')) {
			filteredTemplates[i]['blurDataURL'] = (await getBase64ImageUrl(getScreenshotLoader(filteredTemplates[i].demoUrl), 10)).image
		}
	}

	if (filteredTemplates?.length > 0) {
		seo['preloads'] = [{ url: getScreenshotLoader(filteredTemplates[0].demoUrl), as: 'image' }]
	}

	return {
		seo,
		templates: filteredTemplates
	}
}
