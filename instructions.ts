import type { ApplicationContract } from '@ioc:Adonis/Core/Application'

import * as sinkStatic from '@adonisjs/sink'

export default async function instructions(
  projectRoot: string,
  _app: ApplicationContract,
  sink: typeof sinkStatic
) {
  const key = 'observers'

  const adonisrc = new sink.files.AdonisRcFile(projectRoot)

  if (!adonisrc.get(`namespaces.${key}`)) {
    const namespace = 'App/Observers'

    adonisrc.set(`namespaces.${key}`, namespace)
    adonisrc.commit()
    sink.logger
      .action('update')
      .succeeded(
        `.adonisrc.json ${sink.logger.colors
          .yellow()
          .dim(`{ namespaces += { ${key}: "${namespace}" } }`)}`
      )
  }
}
