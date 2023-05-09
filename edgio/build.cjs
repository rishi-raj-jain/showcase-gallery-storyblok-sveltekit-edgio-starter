const appDir = process.cwd()
const { join } = require('path')
const { DeploymentBuilder } = require('@edgio/core/deploy')

module.exports = async () => {
	const builder = new DeploymentBuilder()
	builder.clearPreviousBuildOutput()
	await builder.exec('npm run build')
	builder.writeFileSync(join(builder.jsDir, '__backends__', 'package.json'), JSON.stringify({ type: 'commonjs' }))
	builder.addJSAsset(join(appDir, '.vercel', 'output', 'functions'), join('dist'))
	builder.addJSAsset(join(appDir, '.env'), join('dist', 'fn.func', '.env'))
	builder.addJSAsset(join(appDir, 'static', 'fonts'), join('static', 'fonts'))
	builder.addJSAsset(join(appDir, '.vercel', 'output', 'config.json'), join('config.json'))
	builder.buildServiceWorker(join(process.cwd(), 'sw', 'service-worker.ts'), join(process.cwd(), '.edgio', 'temp', 'service-worker.js'), false)
	await builder.build()
}
