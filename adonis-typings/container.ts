declare module '@ioc:Adonis/Core/Application' {
  import type { ObservableMixin } from '@ioc:Adonis/Addons/LucidObserver'

  export interface ContainerBindings {
    'Adonis/Addons/LucidObserver': {
      Observable: ObservableMixin
    }
  }
}
