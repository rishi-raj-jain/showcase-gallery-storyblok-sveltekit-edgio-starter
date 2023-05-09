const appDir = process.cwd()
const { join } = require('path')
const { createDevServer } = require('@edgio/core/dev')
const { DeploymentBuilder } = require('@edgio/core/deploy')

module.exports = async function () {
	const builder = new DeploymentBuilder()
	builder.buildServiceWorker(join(appDir, 'sw', 'service-worker.ts'), join(appDir, '.edgio', 'temp', 'service-worker.js'), false)
	return createDevServer({
		label: 'SvelteKit',
		command: (port) => `npm run dev -- --port ${port} --host 127.0.0.1`
	})
}
