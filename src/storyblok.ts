import { STORYBLOK_API_KEY } from '$env/static/private'
import { storyblokInit, apiPlugin, useStoryblokApi } from '@storyblok/svelte'

storyblokInit({
	accessToken: STORYBLOK_API_KEY,
	use: [apiPlugin]
})

export const storyblokApi = useStoryblokApi()
