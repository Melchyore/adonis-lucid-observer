declare module '@ioc:Adonis/Core/Event' {
  import type {
    LucidRow,
    ModelQueryBuilderContract,
    LucidModel,
    EventsList as Hooks,
  } from '@ioc:Adonis/Lucid/Orm'
  import type { SimplePaginatorContract } from '@ioc:Adonis/Lucid/Database'

  type ObserverEventName<Event extends string> = `observer:${Event}`

  type Data<Type> = Type extends ObserverEventName<'beforeFetch'> | ObserverEventName<'beforeFind'>
    ? ModelQueryBuilderContract<LucidModel>
    : Type extends ObserverEventName<'beforePaginate'>
    ? [ModelQueryBuilderContract<LucidModel>, ModelQueryBuilderContract<LucidModel>]
    : Type extends ObserverEventName<'afterPaginate'>
    ? SimplePaginatorContract<LucidRow>
    : Type extends ObserverEventName<'afterFetch'>
    ? Array<LucidRow>
    : LucidRow

  type Payload<Type extends string> = {
    type: Type
    data: Data<Type>
    observer: string
    isTransaction: Type extends ObserverEventName<'afterPaginate'> ? false : boolean
  }

  type BeforeHooksList = ObserverEventName<`before${Capitalize<Hooks>}`>
  type AfterHooksList = ObserverEventName<`after${Capitalize<Hooks>}`>

  type HooksList = {
    [Key in BeforeHooksList]: Payload<Key>
  } & {
    [Key in AfterHooksList]: Payload<Key>
  }

  interface EventsList extends HooksList {}
}
