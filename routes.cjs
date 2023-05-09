import { brotliCompressSync } from 'zlib'
import { CustomCacheKey, Router } from '@edgio/core/router'
import { isProductionBuild } from '@edgio/core/environment'

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

const transformResponse = (res, req) => {
	sendBrotliEncoded(req, res)
}

const router = new Router()

if (isProductionBuild()) {
	router.static('.vercel/output/static')
}

router.prerender(async () => {
	return [{ path: '/' }, { path: '/__data.json' }]
})

router.match('/service-worker.js', ({ serviceWorker }) => {
	serviceWorker('.edgio/temp/service-worker.js')
})

router.match('/', ({ renderWithApp, removeUpstreamResponseHeader, cache }) => {
	removeUpstreamResponseHeader('cache-control')
	cache({
		edge: {
			maxAgeSeconds: 60 * 60 * 24 * 365
		},
		key: new CustomCacheKey().excludeAllQueryParametersExcept('keyName', 'search', 'toggle')
	})
	renderWithApp({ transformResponse })
})

router.match('/__data.json', ({ renderWithApp, removeUpstreamResponseHeader, cache }) => {
	removeUpstreamResponseHeader('cache-control')
	cache({
		browser: {
			serviceWorkerSeconds: 60
		},
		edge: {
			maxAgeSeconds: 60 * 60 * 24 * 365
		},
		key: new CustomCacheKey().excludeAllQueryParametersExcept('keyName', 'search', 'toggle')
	})
	renderWithApp({ transformResponse })
})

router.match('/t/:path', ({ renderWithApp, removeUpstreamResponseHeader, cache }) => {
	removeUpstreamResponseHeader('cache-control')
	cache({
		edge: {
			maxAgeSeconds: 60 * 60 * 24 * 365
		},
		key: new CustomCacheKey().excludeAllQueryParametersExcept('keyName', 'search')
	})
	renderWithApp({ transformResponse })
})

router.match('/t/:path/__data.json', ({ renderWithApp, removeUpstreamResponseHeader, cache }) => {
	removeUpstreamResponseHeader('cache-control')
	cache({
		browser: {
			serviceWorkerSeconds: 60
		},
		edge: {
			maxAgeSeconds: 60 * 60 * 24 * 365
		},
		key: new CustomCacheKey().excludeAllQueryParametersExcept('keyName', 'search')
	})
	renderWithApp({ transformResponse })
})

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
			edge: {
				maxAgeSeconds: 60 * 60 * 24 * 365
			},
			key: new CustomCacheKey().excludeAllQueryParametersExcept('width', 'height', 'text', 'description', 'image')
		})
		renderWithApp({ transformResponse })
	}
)

router.fallback(({ renderWithApp, send }) => {
	renderWithApp()
	// send('Blocked', 403)
})

export default router
