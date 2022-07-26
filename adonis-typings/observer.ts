declare module '@ioc:Adonis/Addons/LucidObserver' {
  import type {
    ModelQueryBuilderContract,
    LucidModel,
    LucidRow,
    EventsList,
  } from '@ioc:Adonis/Lucid/Orm'
  import type { SimplePaginatorContract } from '@ioc:Adonis/Lucid/Database'
  import type { NormalizeConstructor } from '@ioc:Adonis/Core/Helpers'
  import { Constructor } from '@adonisjs/fold'

  export type ObserverMethod = `${'before' | 'after'}${Capitalize<EventsList>}`

  export type ObserverMethodParameter =
    | LucidRow
    | Array<LucidRow>
    | ModelQueryBuilderContract<LucidModel>
    | [
        countQuery: ModelQueryBuilderContract<LucidModel>,
        query: ModelQueryBuilderContract<LucidModel>
      ]
    | SimplePaginatorContract<LucidRow>

  export interface ObserverContract {
    /**
     * Indicate if observer methods should be executed
     * after transaction commit.
     */
    afterCommit?: boolean

    /**
     * Invoked before the insert or the update query.
     *
     * @param {LucidRow} model
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    beforeSave?(model: LucidRow): Promise<void>

    /**
     * Invoked after the insert or the update query.
     *
     * @param {LucidRow} model
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    afterSave?(model: LucidRow): Promise<void>

    /**
     * Invoked before the find query.
     *
     * @param {ModelQueryBuilderContract<LucidModel>} query
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    beforeFind?(query: ModelQueryBuilderContract<LucidModel>): Promise<void>

    /**
     * Invoked after the find query.
     *
     * @param {LucidRow} model
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    afterFind?(model: LucidRow): Promise<void>

    /**
     * Invoked before the fetch query.
     *
     * @param {ModelQueryBuilderContract<LucidModel>} query
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    beforeFetch?(query: ModelQueryBuilderContract<LucidModel>): Promise<void>

    /**
     * Invoked after the fetch query.
     *
     * @param {Array<LucidRow>} records
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    afterFetch?(records: Array<LucidRow>): Promise<void>

    /**
     * Invoked only before the insert query.
     *
     * @param {LucidRow} model
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    beforeCreate?(model: LucidRow): Promise<void>

    /**
     * Invoked only after the insert query.
     *
     * @param {LucidRow} model
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    afterCreate?(model: LucidRow): Promise<void>

    /**
     * Invoked only before the update query.
     *
     * @param {LucidRow} model
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    beforeUpdate?(model: LucidRow): Promise<void>

    /**
     * Invoked only after the update query.
     *
     * @param {LucidRow} model
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    afterUpdate?(model: LucidRow): Promise<void>

    /**
     * Invoked before the delete query.
     *
     * @param {LucidRow} model
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    beforeDelete?(model: LucidRow): Promise<void>

    /**
     * Invoked after the delete query.
     *
     * @param {LucidRow} model
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    afterDelete?(model: LucidRow): Promise<void>

    /**
     * Invoked before the paginate query.
     *
     * @param {ModelPaginatorContract<LucidRow>} paginator
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    beforePaginate?([countQuery, query]: [
      ModelQueryBuilderContract<LucidModel>,
      ModelQueryBuilderContract<LucidModel>
    ]): Promise<void>

    /**
     * Invoked after the paginate query.
     *
     * @param {ModelPaginatorContract<LucidRow>} paginator
     * @return {*}  {Promise<void>}
     * @memberof ObserverContract
     */
    afterPaginate?(paginator: SimplePaginatorContract<LucidRow>): Promise<void>
  }

  export interface ObservableModel extends LucidModel {
    /**
     * Add an observer to the model.
     *
     * @param {ObserverContract} observer
     * @memberof ObservableModel
     */
    $addObserver(observer: Constructor<ObserverContract>): void

    /**
     * Add multiple observers to a model.
     *
     * @param {Array<ObserverContract>} observers
     * @memberof ObservableModel
     */
    $addObservers(observers: Array<Constructor<ObserverContract>>): void

    /**
     * Get a list of observers instances attached
     * to the model.
     *
     * @return {*}  {Array<ObserverContract>}
     * @memberof ObservableModel
     */
    $getObservers(): Array<ObserverContract>

    /**
     * Get a list of all observers instances (including globals).
     *
     * @return {*}  {Array<ObserverContract>}
     * @memberof ObservableModel
     */
    $getAllObservers(): Array<ObserverContract>

    /**
     * Add observers to the model and register hooks callbacks.
     *
     * @param {Array<Constructor<ObserverContract>>} [observers]
     * @memberof ObservableModel
     */
    observe(observers?: Array<Constructor<ObserverContract>>): void

    /**
     * Remove observers from the model and execute the callback,
     * then restore them.
     *
     * @param {(() => any | Promise<any>)} callback
     * @return {*}  {Promise<void>}
     * @memberof ObservableModel
     */
    withoutObservers<T extends () => any | Promise<any>>(callback: T): Promise<ReturnType<T>>
  }

  export interface ObservableRow extends LucidRow {
    /**
     * Save without executing 0observers methods.
     */
    saveQuietly(): Promise<this>
  }

  export interface ObservableMixin {
    <T extends NormalizeConstructor<LucidModel>>(superclass: T): T &
      ObservableModel & {
        new (...args: Array<any>): ObservableRow
      }
  }

  const Observable: ObservableMixin

  export { Observable }
}
