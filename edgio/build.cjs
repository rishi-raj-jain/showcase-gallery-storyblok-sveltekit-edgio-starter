const appDir = process.cwd()
const { join } = require('path')
const { existsSync } = require('fs')
const { DeploymentBuilder } = require('@edgio/core/deploy')

const SW_SOURCE = join(appDir, 'sw', 'service-worker.ts')
const SW_DEST = join(appDir, '.edgio', 'tmp', 'service-worker.js')

module.exports = async () => {
	const builder = new DeploymentBuilder()
	builder.clearPreviousBuildOutput()
	await builder.exec('npm run build')
	await builder.buildServiceWorker({
		swSrc: SW_SOURCE,
		swDest: SW_DEST
	})
	if (existsSync(join(appDir, '.env'))) builder.addJSAsset(join(appDir, '.env'), join('dist', 'fn.func', '.env'))
	if (existsSync(join(appDir, 'static', 'fonts'))) builder.addJSAsset(join(appDir, 'static', 'fonts'), join('static', 'fonts'))
	if (existsSync(join(appDir, '.vercel', 'output', 'functions'))) builder.addJSAsset(join(appDir, '.vercel', 'output', 'functions'), join('dist'))
	if (existsSync(join(appDir, '.vercel', 'output', 'config.json'))) builder.addJSAsset(join(appDir, '.vercel', 'output', 'config.json'), join('config.json'))
	builder.writeFileSync(join(builder.jsDir, '__backends__', 'package.json'), JSON.stringify({ type: 'commonjs' }))
	await builder.build()
}
