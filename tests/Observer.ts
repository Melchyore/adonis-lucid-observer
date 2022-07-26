import type { ObserverContract } from '@ioc:Adonis/Addons/LucidObserver'
import type { LucidRow } from '@ioc:Adonis/Lucid/Orm'

export default class Observer implements ObserverContract {
  public async beforeCreate(model: LucidRow): Promise<void> {
    console.log(model.constructor.name)
  }
}
