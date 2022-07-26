import type { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import type {
  EventsList,
  LucidRow,
  ModelQueryBuilderContract,
  LucidModel,
} from '@ioc:Adonis/Lucid/Orm'
import type {
  ObservableMixin,
  ObserverContract,
  ObserverMethodParameter,
} from '@ioc:Adonis/Addons/LucidObserver'
import type { Constructor } from '@adonisjs/fold'
import type { EmitterContract } from '@ioc:Adonis/Core/Event'

import { string } from '@poppinss/utils/build/helpers'

import ModelAlreadyObservedException from '../Exceptions/ModelAlreadyObservedException'
import ObserverTypeException from '../Exceptions/ObserverTypeException'

const Event = global[Symbol.for('ioc.use')]('Adonis/Core/Event') as EmitterContract

export const Observable: ObservableMixin = (superclass) => {
  class ObservableModel extends superclass {
    /**
     * Determine if the model is observed.
     */
    private static isObserved = false

    /**
     * Global observers list.
     */
    private static globalObservers = super.$globalObservers

    /**
     * Observers list.
     * ! If a model extends another Observable model,
     * ! it will inherit its observers.
     */
    protected static $observers: Array<ObserverContract> = []

    /**
     * Add an observer to the model.
     */
    public static $addObserver(observer: Constructor<ObserverContract>) {
      this.$observers.push(new observer())
    }

    /**
     * Add multiple observers to the model.
     */
    public static $addObservers(observers: Array<Constructor<ObserverContract>>) {
      this.$observers.push(...observers.map((observer) => new observer()))
    }

    /**
     * Get model's observers.
     */
    public static $getObservers() {
      return this.$observers
    }

    /**
     * Get a list of all observers instances (including globals).
     */
    public static $getAllObservers() {
      return [...this.globalObservers, ...this.$observers]
    }

    /**
     * Remove observers from the model and execute the callback,
     * then restore them.
     */
    public static async withoutObservers(callback: () => any | Promise<any>): Promise<any> {
      const globalObservers = this.globalObservers
      const observers = this.$observers

      let result = null

      /**
       * Remove the observers if any.
       */
      this.globalObservers = []
      this.$observers = []

      try {
        result = await callback()
      } catch (e) {
        throw new Error(e)
      }

      /**
       * Restore the observers if any.
       */
      this.$observers = observers
      this.globalObservers = globalObservers

      return result
    }

    /**
     * Register observers methods.
     */
    public static observe(observers: Array<Constructor<ObserverContract>> = []) {
      if (this.isObserved) {
        throw ModelAlreadyObservedException.invoke(this.name)
      }

      this.isObserved = true
      this.$addObservers(observers)
      this.checkObserversTypes()

      const hooks = [
        'fetch',
        'find',
        'create',
        'update',
        'delete',
        'save',
        'paginate',
      ] as Array<EventsList>

      for (const type of ['before', 'after']) {
        for (const hook of hooks) {
          this[type](hook, async (arg: ObserverMethodParameter) => {
            await this.registerHookCallback(type, hook, arg)
          })
        }
      }
    }

    private static checkObserversTypes() {
      for (const observer of [...this.globalObservers, ...this.$observers]) {
        if (typeof observer !== 'object') {
          throw ObserverTypeException.invoke(observer, this.name)
        }
      }
    }

    private static async registerHookCallback(
      type: string,
      event: EventsList,
      arg: ObserverMethodParameter
    ) {
      const method = type + string.pascalCase(event)

      for (const observer of [...this.globalObservers, ...this.$observers]) {
        await this.executeObserverMethod(observer, method, arg)
      }
    }

    private static async executeObserverMethod(
      observer: ObserverContract,
      method: string,
      arg: ObserverMethodParameter
    ) {
      if (typeof observer[method] === 'function') {
        let trx: TransactionClientContract | null = null

        /**
         * If the observer should execute its methods after
         * transaction commit, we need to get the transaction
         * client from the hook parameter.
         * ! We can't get transaction using afterPaginate hook.
         */
        if (observer.afterCommit) {
          if (['beforeFind', 'beforeFetch'].includes(method)) {
            // Model query builder.
            trx = this.getTransactionFromModelQueryBuilder(
              arg as ModelQueryBuilderContract<LucidModel>
            )
          } else if (method === 'beforePaginate') {
            // Model paginator query builder.
            trx = this.getTransactionFromModelQueryBuilder(
              arg[0] as ModelQueryBuilderContract<LucidModel>
            )
          } else if (method === 'afterFetch') {
            // Array of model instances.
            const firstRecord = arg[0] as LucidRow

            if (firstRecord.$trx) {
              trx = firstRecord.$trx
            }
          } else {
            if (method !== 'afterPaginate') {
              // Model instance.
              const modelInstance = arg as LucidRow

              if (modelInstance.$trx) {
                trx = modelInstance.$trx
              }
            }
          }

          if (trx) {
            trx.after('commit', async () => {
              await observer[method]!(arg)

              await this.emit(method, arg, observer, true)
            })
          } else {
            /**
             * afterCommit is true but no transaction defined.
             * Execute the observer methods.
             */
            await observer[method](arg)

            await this.emit(method, arg, observer)
          }
        } else {
          /**
           * Not a transaction. Execute the observer methods.
           */
          await observer[method](arg)

          await this.emit(method, arg, observer)
        }
      }
    }

    private static async emit(
      event: string,
      data: any,
      observer: ObserverContract,
      isTransaction = false
    ) {
      await Event.emit(`observer:${event}`, {
        type: event,
        data,
        observer: observer.constructor.name,
        isTransaction,
      })
    }

    /**
     * Save without executing observers methods.
     */
    public async saveQuietly() {
      return await (<typeof ObservableModel>this.constructor).withoutObservers(async () => {
        return await this.save()
      })
    }

    private static getTransactionFromModelQueryBuilder(
      queryBuilder: ModelQueryBuilderContract<LucidModel>
    ) {
      if (queryBuilder.clientOptions.client?.isTransaction) {
        return queryBuilder.clientOptions.client as TransactionClientContract
      }

      return null
    }
  }

  return ObservableModel
}
