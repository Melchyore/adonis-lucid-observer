import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { LucidModel } from '@ioc:Adonis/Lucid/Orm'
import type { ObserverContract } from '@ioc:Adonis/Addons/LucidObserver'

import type { Constructor } from '@adonisjs/fold'

export default class AppProvider {
  public static needsApplication = true

  constructor(protected app: ApplicationContract) {}

  public register() {
    this.app.container.singleton('Adonis/Addons/LucidObserver', () => {
      const { Observable } = require('../src/Mixins/Observable')

      return { Observable }
    })
  }

  public async boot() {
    const { BaseModel } = this.app.container.use('Adonis/Lucid/Orm')
    BaseModel.$globalObservers = []

    BaseModel.$addGlobalObserver = function (observer: Constructor<ObserverContract>) {
      ;(this as LucidModel).$globalObservers.push(new observer())
    }

    BaseModel.$addGlobalObservers = function (observers: Array<Constructor<ObserverContract>>) {
      ;(this as LucidModel).$globalObservers.push(...observers.map((observer) => new observer()))
    }

    BaseModel.$getGlobalObservers = function () {
      return this.$globalObservers
    }
  }

  public async ready() {
    // App is ready
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
