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

  /*
  type Shared = {
    observer: string
    isTransaction: boolean
  }

  interface EventsList {
    'observer:beforeFetch': {
      type: 'beforeFetch'
      data: ModelQueryBuilderContract<LucidModel>
    } & Shared

    'observer:afterFetch': {
      type: 'afterFetch'
      data: Array<LucidRow>
    } & Shared

    'observer:beforeFind': {
      type: 'beforeFind'
      data: ModelQueryBuilderContract<LucidModel>
    } & Shared

    'observer:afterFind': {
      type: 'afterFind'
      data: LucidRow
    } & Shared

    'observer:beforeCreate': {
      type: 'beforeCreate'
      data: LucidRow
    } & Shared

    'observer:afterCreate': {
      type: 'afterCreate'
      data: LucidRow
    } & Shared

    'observer:beforeUpdate': {
      type: 'beforeUpdate'
      data: LucidRow
    } & Shared

    'observer:afterUpdate': {
      type: 'afterUpdate'
      data: LucidRow
    } & Shared

    'observer:beforeDelete': {
      type: 'beforeDelete'
      data: LucidRow
    } & Shared

    'observer:afterDelete': {
      type: 'afterDelete'
      data: LucidRow
    } & Shared

    'observer:beforeSave': {
      type: 'beforeSave'
      data: LucidRow
    } & Shared

    'observer:afterSave': {
      type: 'afterSave'
      data: LucidRow
    } & Shared

    'observer:beforePaginate': {
      type: 'beforePaginate'
      data: [ModelQueryBuilderContract<LucidModel>, ModelQueryBuilderContract<LucidModel>]
    } & Shared

    'observer:afterPaginate': {
      type: 'afterPaginate'
      data: SimplePaginatorContract<LucidRow>
      observer: string
      isTransaction: false
    }
  }*/
}
