import type { DatabaseContract, SimplePaginatorContract } from '@ioc:Adonis/Lucid/Database'
import type {
  BaseModel as BaseModelContract,
  ColumnDecorator,
  LucidRow,
  ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm'
import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type {
  ObserverContract,
  Observable as ObservableContract,
} from '@ioc:Adonis/Addons/LucidObserver'

import { test } from '@japa/runner'
import { compose } from '@poppinss/utils/build/helpers'

import { setupDatabase, cleanDatabase } from '../bin/test/database'
import { fs } from '../bin/test/config'
import { setupApp } from '../test-helpers'

let db: DatabaseContract
let BaseModel: typeof BaseModelContract
let Observable: typeof ObservableContract
let app: ApplicationContract
let column: ColumnDecorator

test.group('Observable', (group) => {
  group.setup(async () => {
    app = await setupApp()
    db = app.container.use('Adonis/Lucid/Database')
    BaseModel = app.container.use('Adonis/Lucid/Orm').BaseModel
    column = app.container.use('Adonis/Lucid/Orm').column
    Observable = app.container.use('Adonis/Addons/LucidObserver').Observable
  })

  group.each.setup(async () => {
    await setupDatabase(db)
  })

  group.each.teardown(async () => {
    BaseModel.$globalObservers = []

    await cleanDatabase(db)
  })

  group.teardown(async () => {
    await db.manager.closeAll()
    await fs.cleanup()
  })

  test('register observer through $observer attribute inside model', async ({ expect }) => {
    class UserObserver implements ObserverContract {}

    class User extends compose(BaseModel, Observable) {
      protected static $observers = [new UserObserver()]

      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    expect(User.$getObservers()).toHaveLength(1)
    expect(User.$getObservers().at(0)).toBeInstanceOf(UserObserver)
  })

  test('register observer which is not a class instance through $observer attribute should throw an exception', async ({
    expect,
  }) => {
    class UserObserver implements ObserverContract {}

    class User extends compose(BaseModel, Observable) {
      protected static $observers = [UserObserver]

      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    expect(() => {
      User.observe()
    }).toThrowError()
  })

  test('calling observe from boot method should observe model', async ({ expect }) => {
    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public async beforeFind(_query: ModelQueryBuilderContract<typeof User>) {
        stack.push('beforeFind')
      }
    }

    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string

      public static boot() {
        if (this.booted) {
          return
        }

        super.boot()
        this.observe([UserObserver])
      }
    }

    await User.find(1)

    expect(stack).toHaveLength(1)
  })

  test('$addObserver should add an observer', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    class UserObserver implements ObserverContract {}

    User.$addObserver(UserObserver)

    expect(User.$getObservers()).toHaveLength(1)
    expect(User.$getObservers().at(0)).toBeInstanceOf(UserObserver)
  })

  test('$addObservers should add an array of observers', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    class UserObserver implements ObserverContract {}
    class UserSecondObserver implements ObserverContract {}

    User.$addObservers([UserObserver, UserSecondObserver])

    expect(User.$getObservers()).toHaveLength(2)
  })

  test('$getObservers should return an array of observers instances', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    class UserObserver implements ObserverContract {}
    class UserSecondObserver implements ObserverContract {}

    User.$addObservers([UserObserver, UserSecondObserver])

    expect(User.$getObservers().at(0)).toBeInstanceOf(UserObserver)
    expect(User.$getObservers()[1]).toBeInstanceOf(UserSecondObserver)
  })

  test('should not execute observer methods if "observe" is not called', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    class UserObserver implements ObserverContract {
      public async beforeCreate(user: User): Promise<void> {
        user.email = 'john@doe.com'
      }
    }

    User.$addObserver(UserObserver)

    const user = await User.create({
      email: 'test',
      name: 'John Doe',
    })

    expect(user.email).toStrictEqual('test')
  })

  test('observe method should add an array of observers', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    class UserObserver implements ObserverContract {}
    class UserSecondObserver implements ObserverContract {}

    User.observe([UserObserver, UserSecondObserver])

    expect(User.$getObservers()).toHaveLength(2)
  })

  test('beforeSave', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const email = 'john@doe.com'

    class UserObserver implements ObserverContract {
      public async beforeSave(user: User): Promise<void> {
        if (user.$dirty.email) {
          user.email = email
        }
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    const user = await User.create({
      email: 'test',
      name: 'test',
    })

    expect(user.email).toStrictEqual(email)
  })

  test('afterSave', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public async afterSave(user: User): Promise<void> {
        stack.push('afterSave')
        expect(user.$isPersisted).toBeTruthy()
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    await User.create({
      email: 'test',
      name: 'test',
    })

    expect(stack).toStrictEqual(['afterSave'])
  })

  test('beforeCreate', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const email = 'john@doe.com'

    class UserObserver implements ObserverContract {
      public async beforeCreate(user: User): Promise<void> {
        if (user.$dirty.email) {
          user.email = email
        }
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    const user = await User.create({
      email: 'test',
      name: 'test',
    })

    expect(user.email).toStrictEqual(email)
  })

  test('afterCreate', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public async afterCreate(user: User): Promise<void> {
        stack.push('afterCreate')
        expect(user.$isPersisted).toBeTruthy()
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    await User.create({
      email: 'test',
      name: 'test',
    })

    expect(stack).toStrictEqual(['afterCreate'])
  })

  test('beforeUpdate', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const email = 'john@doe.com'

    class UserObserver implements ObserverContract {
      public async beforeUpdate(user: User): Promise<void> {
        if (user.$dirty.email) {
          user.email = email
        }
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    await User.create({
      email: 'test',
      name: 'test',
    })

    const user = await User.find(1)
    await user!
      .merge({
        email: 'foo',
      })
      .save()

    expect(user!.email).toStrictEqual(email)
  })

  test('afterUpdate', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public async afterUpdate(user: User): Promise<void> {
        stack.push('afterUpdate')
        expect(user.$isPersisted).toBeTruthy()
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    await User.create({
      email: 'test',
      name: 'test',
    })

    const user = await User.find(1)
    await user!
      .merge({
        email: 'foo',
      })
      .save()

    expect(stack).toStrictEqual(['afterUpdate'])
  })

  test('beforeFind', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public async beforeFind(_query: ModelQueryBuilderContract<typeof User>): Promise<void> {
        stack.push('beforeFind')
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    await User.find(1)

    expect(stack).toStrictEqual(['beforeFind'])
  })

  test('afterFind', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public async afterFind(user: User): Promise<void> {
        stack.push('afterFind')
        expect(user.id).toStrictEqual(1)
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    await User.create({
      email: 'test',
      name: 'test',
    })

    await User.find(1)

    expect(stack).toStrictEqual(['afterFind'])
  })

  test('beforeFetch', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public async beforeFetch(_query: ModelQueryBuilderContract<typeof User>): Promise<void> {
        stack.push('beforeFetch')
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    await User.all()

    expect(stack).toStrictEqual(['beforeFetch'])
  })

  test('afterFetch', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public afterCommit = true

      public async afterFetch(users: Array<User>): Promise<void> {
        stack.push('afterFetch')
        expect(users.length).toStrictEqual(2)
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    await User.create({
      email: 'test',
      name: 'test',
    })
    await User.create({
      email: 'test2',
      name: 'test',
    })
    await User.all()

    expect(stack).toStrictEqual(['afterFetch'])
  })

  test('beforeDelete', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public async beforeDelete(_user: User): Promise<void> {
        stack.push('beforeDelete')
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    const user = await User.create({
      email: 'test',
      name: 'test',
    })
    await user.delete()

    expect(stack).toStrictEqual(['beforeDelete'])
  })

  test('afterDelete', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public async afterDelete(_user: User): Promise<void> {
        stack.push('afterDelete')
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    const user = await User.create({
      email: 'test',
      name: 'test',
    })
    await user.delete()

    expect(stack).toStrictEqual(['afterDelete'])
  })

  test('beforePaginate', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public async beforePaginate([countQuery, query]: [
        ModelQueryBuilderContract<typeof User>,
        ModelQueryBuilderContract<typeof User>
      ]): Promise<void> {
        stack.push('beforePaginate')
        expect(countQuery).not.toStrictEqual(query)
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    await User.query().paginate(1, 10)

    expect(stack).toStrictEqual(['beforePaginate'])
  })

  test('afterPaginate', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public async afterPaginate(paginator: SimplePaginatorContract<User>): Promise<void> {
        stack.push('afterPaginate')
        expect(paginator).toHaveProperty('url')
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    await User.query().paginate(1, 10)

    expect(stack).toStrictEqual(['afterPaginate'])
  })

  test('should not execute observer methods if afterCommit is true and transaction fails', async ({
    expect,
  }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public afterCommit = true

      public async beforeFind(_query: ModelQueryBuilderContract<typeof User>): Promise<void> {
        stack.push('beforeFind')
      }

      public async afterUpdate(user: User): Promise<void> {
        stack.push('afterUpdate')
        expect(user.$isDirty).toBeFalsy()
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    const transaction = async () =>
      await db.transaction(async (trx) => {
        await User.create(
          {
            email: 'test',
            name: 'test',
          },
          { client: trx }
        )

        const user = await User.find(1, { client: trx })
        await user!
          .merge({
            email: 'foo',
          })
          .save()

        throw new Error('FAIL')
      })

    expect(async () => await transaction()).rejects.toThrowError('FAIL')
    expect(stack.length).toStrictEqual(0)
  })

  test('should execute observer methods if afterCommit is true and transaction runs successfully', async ({
    expect,
  }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public afterCommit = true

      public async beforeFind(_query: ModelQueryBuilderContract<typeof User>): Promise<void> {
        stack.push('beforeFind')
      }

      public async afterUpdate(user: User): Promise<void> {
        stack.push('afterUpdate')
        expect(user.$isDirty).toBeFalsy()
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    await db.transaction(async (trx) => {
      await User.create(
        {
          email: 'test',
          name: 'test',
        },
        { client: trx }
      )

      const user = await User.find(1, { client: trx })
      await user!
        .merge({
          email: 'foo',
        })
        .save()
    })

    expect(stack).toStrictEqual(['beforeFind', 'afterUpdate'])
  })

  test('saveQuietly should not trigger observers methods', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public async beforeSave(user: User): Promise<void> {
        stack.push('beforeSave')
        user.email = 'test'
      }

      public async afterSave(_user: User): Promise<void> {
        stack.push('afterSave')
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    const email = 'john@doe.com'

    const user = new User()
    user.email = email
    user.name = 'John Doe'
    await user.saveQuietly()

    expect(stack).toHaveLength(0)
    expect((await User.find(1))?.email).toStrictEqual(email)
  })

  test('withoutObservers should not trigger observers methods', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class UserObserver implements ObserverContract {
      public async beforeSave(user: User): Promise<void> {
        stack.push('beforeSave')
        user.email = 'test'
      }

      public async afterSave(_user: User): Promise<void> {
        stack.push('afterSave')
      }
    }

    User.$addObserver(UserObserver)
    User.observe()

    const email = 'john@doe.com'

    await User.withoutObservers(async () => {
      await User.create({
        name: 'John Doe',
        email,
      })
    })

    expect(stack).toStrictEqual([])
    expect((await User.find(1))?.email).toStrictEqual(email)
  })

  test('global observer should observe all models that extend Observable mixin', async ({
    expect,
  }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    class Post extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string
    }

    const stack: Array<string> = []

    class GlobalObserver implements ObserverContract {
      public async beforeSave(model: LucidRow): Promise<void> {
        stack.push(model.constructor.name)
      }
    }

    BaseModel.$addGlobalObserver(GlobalObserver)

    User.observe()
    Post.observe()

    await User.create({
      name: 'John Doe',
      email: 'john@doe.com',
    })

    await Post.create({
      userId: 1,
      title: 'Test',
      content: 'This is content',
    })

    expect(stack).toStrictEqual(expect.arrayContaining([User.name, Post.name]))
  })

  test('global observer should not observe models when using withoutObservers', async ({
    expect,
  }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    class Post extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public userId: number

      @column()
      public title: string

      @column()
      public content: string
    }

    const stack: Array<string> = []

    class GlobalObserver implements ObserverContract {
      public async beforeSave(model: LucidRow): Promise<void> {
        stack.push(model.constructor.name)
      }
    }

    BaseModel.$addGlobalObserver(GlobalObserver)

    User.observe()
    Post.observe()

    await User.withoutObservers(async () => {
      await User.create({
        name: 'John Doe',
        email: 'john@doe.com',
      })
    })

    await Post.withoutObservers(async () => {
      await Post.create({
        userId: 1,
        title: 'Test',
        content: 'This is content',
      })
    })

    expect(stack).toHaveLength(0)
  })

  test('global observer should not observe models when using saveQuietly', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    const stack: Array<string> = []

    class GlobalObserver implements ObserverContract {
      public async beforeSave(model: LucidRow): Promise<void> {
        stack.push(model.constructor.name)
      }

      public async afterSave(model: LucidRow): Promise<void> {
        stack.push(model.constructor.name)
      }
    }

    BaseModel.$addGlobalObserver(GlobalObserver)

    User.observe()

    const user = new User()
    user.email = 'john@doe.com'
    user.name = 'John Doe'
    await user.saveQuietly()

    expect(stack).toHaveLength(0)
  })

  test('$getObservers method should return only model observers', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    class GlobalObserver implements ObserverContract {}
    class LocalObserver implements ObserverContract {}

    BaseModel.$addGlobalObserver(GlobalObserver)

    User.observe([LocalObserver])

    expect(User.$getObservers()).toHaveLength(1)
  })

  test('$getGlobalObservers method should return only global observers', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    class GlobalObserver implements ObserverContract {}
    class LocalObserver implements ObserverContract {}

    BaseModel.$addGlobalObserver(GlobalObserver)

    User.observe([LocalObserver])

    expect(User.$getGlobalObservers()).toHaveLength(1)
  })

  test('$addGlobalObservers method should add a list of global observers', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    class GlobalObserver implements ObserverContract {}
    class SecondGlobalObserver implements ObserverContract {}

    BaseModel.$addGlobalObservers([GlobalObserver, SecondGlobalObserver])

    User.observe()

    expect(User.$getGlobalObservers()).toHaveLength(2)
  })

  test('$getAllObservers method should return all observers (model and globals)', async ({
    expect,
  }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    class GlobalObserver implements ObserverContract {}
    class LocalObserver implements ObserverContract {}

    BaseModel.$addGlobalObserver(GlobalObserver)

    User.observe([LocalObserver])

    expect(User.$getAllObservers()).toHaveLength(2)
  })

  test('calling observe method twice or more should trigger an exception', async ({ expect }) => {
    class User extends compose(BaseModel, Observable) {
      @column({ isPrimary: true })
      public id: number

      @column()
      public email: string

      @column()
      public name: string
    }

    expect(() => {
      User.observe()
      User.observe()
    }).toThrowError(`The model "${User.name}" is already observed`)
  })
})
