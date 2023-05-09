import { redirect } from '@sveltejs/kit'
import { storyblokApi } from '@/src/storyblok'
import { getBase64ImageUrl } from '@/src/image'
import { getScreenshotLoader, getTitle, toHTML } from '@/src/utils'

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ url, params }) => {
	let findTemplate

	const slug = params.slug

	// Append cdn/stories/ before your full slug path
	const { data } = await storyblokApi.get(`cdn/stories/templates/${slug}`)

	if (data?.story) {
		findTemplate = data.story
	}

	// If such a template data exists, otherwise redirect to home page
	if (!findTemplate || !findTemplate.content) throw redirect(307, '/')

	// Create the template data
	const template = {
		css: findTemplate.content.css,
		type: findTemplate.content.type,
		name: findTemplate.content.name,
		publisher: findTemplate.content.publisher,
		framework: findTemplate.content.framework,
		demoUrl: findTemplate.content.demoUrl.url,
		description: findTemplate.content.description,
		githubUrl: findTemplate.content.githubUrl.url,
		overview: await toHTML(findTemplate.content.overview)
	}

	if (!(url.hostname === 'localhost') && template?.demoUrl) {
		template['blurImageURL'] = (await getBase64ImageUrl(getScreenshotLoader(template.demoUrl))).image
	}

	// Create social shareable image URL
	const socialImage = new URL('/og', url.origin)
	if (template.name) socialImage.searchParams.set('text', template.name)
	if (template.description) socialImage.searchParams.set('description', template.description)
	if (template.demoUrl) socialImage.searchParams.set('image', getScreenshotLoader(template.demoUrl))

	// Create SEO Object
	const seo = {
		title: template.name + ' - ' + getTitle(),
		description: template.description,
		domain: url.origin,
		pathname: url.pathname,
		image: socialImage.toString(),
		preloads: template?.demoUrl ? [{ url: getScreenshotLoader(template.demoUrl), as: 'image' }] : []
	}

	return {
		seo,
		slug,
		template
	}
}
