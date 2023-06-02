const appDir = process.cwd()
const { join } = require('path')
const { createDevServer } = require('@edgio/core/dev')
const { DeploymentBuilder } = require('@edgio/core/deploy')

const SW_SOURCE = join(appDir, 'sw', 'service-worker.ts')
const SW_DEST = join(appDir, '.edgio', 'tmp', 'service-worker.js')

module.exports = async function () {
	const builder = new DeploymentBuilder()
	await builder.watchServiceWorker(SW_SOURCE, SW_DEST)
	return createDevServer({
		label: 'SvelteKit',
		command: (port) => `npm run dev -- --port ${port} --host 127.0.0.1`
	})
}
