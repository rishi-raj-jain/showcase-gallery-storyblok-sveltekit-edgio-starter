import { brotliCompressSync } from 'zlib'
import { Router } from '@edgio/core/router'
import { isProductionBuild } from '@edgio/core/environment'
import CustomCacheKey from '@edgio/core/router/CustomCacheKey'

const BROTLI_ENCODING_REGEX = /\bbr\b/

const sendBrotliEncoded = (req, res) => {
	const acceptEncoding = req.getHeader('accept-encoding')
	const acceptBrotliEncoding = BROTLI_ENCODING_REGEX.test(acceptEncoding)
	if (!acceptBrotliEncoding) return
	const encodedBody = brotliCompressSync(Buffer.from(res.body))
	res.setHeader('content-length', Buffer.byteLength(encodedBody))
	res.setHeader('content-encoding', 'br')
	res.body = encodedBody
}

// Try to brotli encode each response
const transformResponse = (res, req) => {
	sendBrotliEncoded(req, res)
}

const router = new Router()

if (isProductionBuild()) {
	router.static('.vercel/output/static')
}

// Preload the URLs as soon as the deployment is done
router.prerender(async () => {
	return [{ path: '/' }, { path: '/__data.json' }]
})

router.match('/service-worker.js', ({ serviceWorker }) => {
	serviceWorker('.edgio/tmp/service-worker.js')
})

// Cache the page repsonses at the edge only

router.match('/', ({ renderWithApp, removeUpstreamResponseHeader, cache }) => {
	removeUpstreamResponseHeader('cache-control')
	cache({
		edge: {
			maxAgeSeconds: 60 * 60,
			staleWhileRevalidateSeconds: 60 * 60 * 24 * 365
		},
		key: new CustomCacheKey().excludeAllQueryParametersExcept('keyName', 'search', 'toggle')
	})
	renderWithApp({ transformResponse })
})

router.match('/templates/:path', ({ renderWithApp, removeUpstreamResponseHeader, cache }) => {
	removeUpstreamResponseHeader('cache-control')
	cache({
		edge: {
			maxAgeSeconds: 60 * 60,
			staleWhileRevalidateSeconds: 60 * 60 * 24 * 365
		},
		key: new CustomCacheKey().excludeAllQueryParametersExcept('keyName', 'search')
	})
	renderWithApp({ transformResponse })
})

// Cache the navigation JSONs at the browser in SW only

router.match('/__data.json', ({ renderWithApp, removeUpstreamResponseHeader, cache }) => {
	removeUpstreamResponseHeader('cache-control')
	cache({
		browser: {
			serviceWorkerSeconds: 60
		},
		edge: {
			maxAgeSeconds: 60 * 60,
			staleWhileRevalidateSeconds: 60 * 60 * 24 * 365
		},
		key: new CustomCacheKey().excludeAllQueryParametersExcept('keyName', 'search', 'toggle')
	})
	renderWithApp({ transformResponse })
})

router.match('/templates/:path/__data.json', ({ renderWithApp, removeUpstreamResponseHeader, cache }) => {
	removeUpstreamResponseHeader('cache-control')
	cache({
		browser: {
			serviceWorkerSeconds: 60
		},
		edge: {
			maxAgeSeconds: 60 * 60,
			staleWhileRevalidateSeconds: 60 * 60 * 24 * 365
		},
		key: new CustomCacheKey().excludeAllQueryParametersExcept('keyName', 'search')
	})
	renderWithApp({ transformResponse })
})

// Only match requests to the /og which contain text, image and description
router.match(
	{
		path: '/og',
		query: {
			text: /^.{1,}$/,
			image: /^.{1,}$/,
			description: /^.{1,}$/
		}
	},
	({ renderWithApp, removeUpstreamResponseHeader, cache }) => {
		removeUpstreamResponseHeader('cache-control')
		cache({
			browser: {
				maxAgeSeconds: 60
			},
			edge: {
				maxAgeSeconds: 60 * 60 * 24 * 365
			},
			key: new CustomCacheKey().excludeAllQueryParametersExcept('width', 'height', 'text', 'description', 'image')
		})
		renderWithApp({ transformResponse })
	}
)

export default router
