declare module '@ioc:Adonis/Core/Event' {
  import type {
    LucidRow,
    ModelQueryBuilderContract,
    LucidModel,
    EventsList as Hooks,
  } from '@ioc:Adonis/Lucid/Orm'
  import type { SimplePaginatorContract } from '@ioc:Adonis/Lucid/Database'

  type Payload<Type extends string> = {
    type: Type
    data: Type extends 'observer:beforeFetch' | 'observer:beforeFind'
      ? ModelQueryBuilderContract<LucidModel>
      : Type extends 'observer:beforePaginate'
      ? [ModelQueryBuilderContract<LucidModel>, ModelQueryBuilderContract<LucidModel>]
      : Type extends 'observer:afterPaginate'
      ? SimplePaginatorContract<LucidRow>
      : Type extends 'observer:afterFetch'
      ? Array<LucidRow>
      : LucidRow
    observer: string
    isTransaction: Type extends 'observer:afterPaginate' ? false : boolean
  }

  type EventName<Type extends string> = `observer:${Type}${Capitalize<Hooks>}`

  type BeforeHooksList = EventName<'before'>
  type AfterHooksList = EventName<'after'>

  type HooksList = {
    [Key in BeforeHooksList]: Payload<Key>
  } & {
    [Key in AfterHooksList]: Payload<Key>
  }

  interface EventsList extends HooksList {}
}
