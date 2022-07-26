declare module '@ioc:Adonis/Lucid/Orm' {
  import type { ObserverContract } from '@ioc:Adonis/Addons/LucidObserver'
  import type { Constructor } from '@adonisjs/fold'

  interface LucidModel {
    /**
     * List of global observers.
     *
     * @type {Array<Constructor<ObserverContract>>}
     * @memberof LucidModel
     */
    $globalObservers: Array<ObserverContract>

    /**
     * Add a global observer.
     *
     * @param {ObserverContract} observer
     * @memberof ObservableModel
     */
    $addGlobalObserver(observer: Constructor<ObserverContract>): void

    /**
     * Add multiple global observers.
     *
     * @param {Array<ObserverContract>} observers
     * @memberof ObservableModel
     */
    $addGlobalObservers(observers: Array<Constructor<ObserverContract>>): void

    /**
     * Get a list of global observers instances.
     *
     * @return {*}  {Array<ObserverContract>}
     * @memberof ObservableModel
     */
    $getGlobalObservers(): Array<ObserverContract>
  }
}
