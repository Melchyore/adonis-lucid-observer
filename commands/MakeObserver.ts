import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { args, flags } from '@adonisjs/core/build/standalone'
import { string } from '@poppinss/utils/build/helpers'
import { slash } from '@poppinss/utils/build'
import { BaseGenerator } from '@adonisjs/assembler/build/commands/Make/Base'

/**
 * Command to make a new model Observer
 */
export default class Make extends BaseGenerator {
  /**
   * Required by BaseGenerator
   */
  protected suffix = 'Observer'
  protected form = 'singular' as const
  protected pattern = 'pascalcase' as const
  protected resourceName: string
  protected createExact = false

  public static commandName = 'make:observer'

  public static description = 'Create an observer'

  private modelPath: string | null = null

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string({
    description: 'Observer name',
    required: true,
  })
  public observerName: string

  @flags.string({
    name: 'model',
    alias: 'm',
    description: 'Model name',
  })
  public model: string

  @flags.boolean({
    name: 'global',
    alias: 'g',
    description: 'Define an observer as global',
  })
  public isGlobal: boolean = false

  /**
   * Pull path from the `observers` directory declaration from
   * the `.adonisrc.json` file or fallback to `app/Observers`
   */
  protected getDestinationPath(): string {
    return this.getPathForNamespace('observers') || 'app/Observers'
  }

  /**
   * Returns the template stub
   */
  protected getStub(): string {
    return join(
      __dirname,
      '..',
      'templates',
      this.isGlobal ? 'global-observer.txt' : 'model-observer.txt'
    )
  }

  protected templateData(): any {
    const modelPath = this.modelPath

    let data = {}

    if (!this.isGlobal && modelPath) {
      const modelName = modelPath.split('/').pop()
      const camelCasedModelName = string.camelCase(modelName!)

      data = {
        modelPath,
        modelName,
        camelCasedModelName,
        pluralizedModel: string.pluralize(camelCasedModelName),
      }
    }

    return data
  }

  public async prepare() {
    const model = this.model

    if (!this.isGlobal) {
      if (!model) {
        this.logger.error(`You must provide a model name to the observer "${this.observerName}"`)

        await this.exit()
      } else {
        this.modelPath = slash(
          join(
            this.application.namespacesMap.get('models') || 'App/Models',
            ...this.model.split('/').map((segment) => string.pascalCase(segment))
          )
        )

        /**
         * Check if model exists.
         */
        if (!existsSync(join(this.application.appRoot, `${this.modelPath}.ts`))) {
          this.logger.error(`Cannot find model "${this.modelPath}"`)

          await this.exit()
        }
      }
    }
  }

  public async run() {
    this.resourceName = this.observerName

    await super.generate()
  }
}
