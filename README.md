<h1 align="center">Lucid Observer</h1>
<p>
  <a href="https://npmjs.org/package/@melchyore/adonis-ucid-observer" target="_blank">
    <img alt="npm" src="https://img.shields.io/npm/v/@melchyore/adonis-lucid-observer.svg?style=for-the-badge&logo=npm" />
  </a>
  <a href="https://github.com/Melchyore/adonis-lucid-observer/blob/master/LICENSE.md" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/npm/l/@melchyore/adonis-lucid-observer?color=blueviolet&style=for-the-badge" />
  </a>

  <img alt="Typescript" src="https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript" />
</p>

Use classes instead of decorators to observe your Lucid models.

# Introduction
If you hate decorators or if you like small model files, then this package is for you.

You can listen to your model events from Observer classes that have method names which reflect Lucid hooks (events). These methods receive the same arguments as hooks.

If you don't know what are hooks, you can read about them [here](https://docs.adonisjs.com/guides/models/hooks) and [here](https://docs.adonisjs.com/reference/orm/decorators#beforesave).

# Pre-requisites
> Node.js >= 16.14.0
> 
> @adonisjs/lucid >= 18.0.0

# Installation

```sh
yarn install @melchyore/adonis-lucid-observer
```

# Configure

```sh
node ace configure @melchyore/adonis-lucid-observer
```

# Usage

## Create an Observer

### Global observer
```sh
node ace make:observer GlobalObserver -g

# or

node ace make:observer GlobalObserver --global
```

The `GlobalObserver` will be placed in `App/Observers`. This directory is created automatically if it doesn't exist.

Following is the content of the created file. Note that methods are **not** static.

```ts
// App/Observers/GlobalObserver.ts

import type { ModelQueryBuilderContract, LucidModel, LucidRow } from '@ioc:Adonis/Lucid/Orm'
import type { ObserverContract } from '@ioc:Adonis/Addons/LucidObserver'

export default class GlobalObserver implements ObserverContract {
  public async beforeFind(query: ModelQueryBuilderContract<LucidModel>): Promise<void> {}

  public async afterFind(model: LucidRow): Promise<void> {}

  public async beforeFetch(query: ModelQueryBuilderContract<LucidModel>): Promise<void> {}

  public async beforeSave(model: LucidRow): Promise<void> {}

  public async afterSave(model: LucidRow): Promise<void> {}
}

```

### Model observer
```sh
node ace make:observer UserObserver --model=User

# or

node ace make:observer UserObserver -m "User"
```

The `UserObserver` will be placed in `App/Observers`. This directory is created automatically if it doesn't exist.

Following is the content of the created file. Note that methods are **not** static.

```ts
// App/Observers/UserObserver.ts

import type { ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
import type { ObserverContract } from '@ioc:Adonis/Addons/LucidObserver'

import User from 'App/Models/User'

export default class UserObserver implements ObserverContract {
  public async beforeFind(query: ModelQueryBuilderContract<typeof User>): Promise<void> {}

  public async afterFind(user: User): Promise<void> {}

  public async beforeFetch(query: ModelQueryBuilderContract<typeof User>): Promise<void> {}

  public async afterFetch(user: Array<User>): Promise<void> {}

  public async beforeSave(user: User): Promise<void> {}

  public async afterSave(user: User): Promise<void> {}
}
```

> **Note**
>
> The command will check if `User` model exist. If not, the observer will not be created. For example, if your model path is `App/Models/Foo/Bar.ts` then it should be `--model=Foo/Bar` or `-m "Foo/Bar"`. So, be sure to pass a valid model path.

If we want to hash the user password, then we will edit the `beforeSave` method.

```ts
// App/Observers/UserObserver.ts

import type { ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
import type { ObserverContract } from '@ioc:Adonis/Addons/LucidObserver'

import Hash from '@ioc:Adonis/Core/Hash'

import User from 'App/Models/User'

export default class UserObserver implements ObserverContract {
  // ... other methods

  public async beforeSave(user: User): Promise<void> {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }
}
```

> **Note**
>
> All Lucid hooks are supported: `beforeSave`, `afterSave`, `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete`, `beforeFind`, `afterFind`, `beforeFetch`, `afterFetch`, `beforePaginate`, `afterPaginate`.

Before registering the observer, you need to apply the `Observable` mixin to your model.

```ts
// App/Models/User.ts

import { BaseModel } from '@ioc:Adonis/Lucid/Orm'
import { compose } from '@ioc:Adonis/Core/Helpers'
import { Observable } from '@ioc:Adonis/Addons/LucidObserver'

class User extends compose(BaseModel, Observable) {}
```

Now, `User` model has the following static methods:

#### $addObserver(observer)
Add an observer to a model.
___

#### $addObservers([observers])
Add multiple observers to a model.
___

#### $getObservers()
Get a list of model observers.
___

#### $getAllObservers()
Get a list of model observers (including global observers if any).
___

#### observe()
Start to observe the model.
___

#### withoutObservers(callback)
Execute model actions without firing any observer event. For example, the below code won't fire the `beforeFind` and `afterFind` events:

```ts
await User.withoutObservers(async () => {
  await User.find(1)
})
```

You can also return whatever you want from the method, it will be automatically typed.

```ts
const user = await User.withoutObservers(async () => {
  return await User.create({
    name: 'John Doe',
    email: 'john@doe.com'
  })
})
// ^^^ const user: User
```
___

Thanks to the mixin, each model instance can call the `saveQuietly` method. This method will execute `save` method under the hood without firing any observer event.

The following example will not fire `beforeSave` and `afterSave` events.

```ts
const user = new User()
user.email = 'john@doe.com'
user.name = 'John Doe'

await user.saveQuietly()
```

> **Note**
>
> `saveQuietly` always return an instance of the model.

## Register Observers

### Global Observers
Global observers will observe all models that extend the `Observable` mixin.

#### Inside a provider file
Create a preloaded file.

```sh
node ace make:provider Observer
```

Open the newly created file `providers/ObserverProvider.ts` and add the following code to the `boot` method.

```ts
import type { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class ObserverProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {}

  public async boot() {
    const { default: GlobalObserver } = await import('App/Observers/GlobalObserver')

    const { BaseModel } = this.app.container.use('Adonis/Lucid/Orm')
    BaseModel.$addGlobalObserver(GlobalObserver)
  }

  public async ready() {}

  public async shutdown() {}
```

> **Note**
>
> Inside `.adonisrc.json`, this provider file **must** come after `@adonisjs/lucid` and `@melchyore/adonis-lucid-observer` in the providers array, not before.

> **Note**
>
> You can use `$addGlobalObservers` method, which accepts an `Array` of observers as the only argument.

> **Note**
>
> If you are creating a third-party package, this way is preferred to register a global observer.

#### Inside a preloaded file
Create a preloaded file.

```sh
node ace make:prldfile observers
```

Open the newly created file `start/observers.ts` and paste the following code.

```ts
import { BaseModel } from '@ioc:Adonis/Lucid/Orm'

import GlobalObserver from 'App/Observers/Globals/GlobalObserver'

BaseModel.$addGlobalObserver(GlobalObserver)
```

> **Note**
>
> You can use `$addGlobalObservers` method, which accepts an `Array` of observers as the only argument.

### Model Observers
Model observers are applied to specific models.

```ts
// App/Observers/UserObserver.ts
import type { ObserverContract } from '@ioc:Adonis/Addons/LucidObserver'

class UserObserver implements ObserverContract {
  // Some methods
}
```
You can register this observer in many ways.

#### `$observers` attribute in the model

```ts
// App/Models/User.ts

import { BaseModel } from '@ioc:Adonis/Lucid/Orm'
import { compose } from '@ioc:Adonis/Core/Helpers'
import { Observable } from '@ioc:Adonis/Addons/LucidObserver'

class User extends compose(BaseModel, Observable) {
  protected static $observers = [new UserObserver()]

  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @column()
  public name: string
}
```

> **Note**
>
> You must register an **instance** of the observer class. All other ways don't require class instance.

#### Model `boot` method

```ts
// App/Models/User.ts

import { BaseModel } from '@ioc:Adonis/Lucid/Orm'
import { compose } from '@ioc:Adonis/Core/Helpers'
import { Observable } from '@ioc:Adonis/Addons/LucidObserver'

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
    this.$addObserver(UserObserver)
  }
}
```

> **Note**
>
> You can use `$addObservers` method, which accepts an `Array` of observers as the only argument.

#### Inside a preloaded file (the preferred way)

Create a preloaded file.

```sh
node ace make:prldfile observers
```

Open the newly created file `start/observers.ts` and paste the following code.

```ts
// start/observers.ts

import User from 'App/Models/User'
import UserObserver from 'App/Observers/UserObserver'

User.$addObserver(UserObserver)
```

> **Note**
>
> You can use `$addObservers` method, which accepts an `Array` of observers as the only argument.

If you wish to register and observe a model in one go, make use of the `observe` method, which accept an optional array of observers as the only argument.

```ts
// start/observers.ts

import User from 'App/Models/User'
import UserObserver from 'App/Observers/UserObserver'

User.observe([UserObserver])
```

## Observe models
To start observing a model, you need to call the `observe` method for each model. It will execute both global and model observers.

```ts
// start/observers.ts

import User from 'App/Models/User'
import UserObserver from 'App/Observers/UserObserver'

User.$addObserver(UserObserver)
User.observe()

// Or

User.observe([UserObserver]) // <- Preferred way. 
```

> **Note**
>
> If you have registered an observer via the `observe` method, you don't need to call it again. If you call the `observe` method twice, an exception will be raised.

If you don't want to import each model and observer, you can register the observers inside models, as described in [observers attribute in the model](#observers-attribute-in-the-model) and [Model boot method](#model-boot-method) sections.

Next, you need to create a new file called `index.ts` inside `App/Models`. You will export all the models you want to observe from that file.

```ts
// App/Models/index.ts

import User from './User'

export {
  User
}
```

Then, paste the following code inside `start/observers.ts`.

```ts
import * as Models from 'App/Models'

for (const Model of Object.values(Models)) {
  Model.observe()
}

```

## Transactions
If you wish to execute observer methods after the database transaction is committed, you can define an `afterCommit` property on the observer class. In the following example, `afterFetch` will be executed once the transaction is committed.

```ts
import type { ObserverContract } from '@ioc:Adonis/Addons/LucidObserver'

class UserObserver implements ObserverContract {
  public afterCommit = true

  public async afterFetch(users: Array<User>): Promise<void> {
    // Some code
  }
}
```

> **Note**
>
> If `afterCommit` is set to `true` and no transaction is defined, the observer methods will still be executed.

> **Note**
>
> `afterPaginate` won't work with transactions.

## Inherit observers through models
If a model extends from another model that has observers, it will inherit its observers. In other words, if the parent model extends from `Observable` mixin, the child model doesn't need to extend from that mixin.

## Events
Each observer action will fire an event. Each event is named using the pattern `observer:actionName`. For example, `beforeFind` will fire the `observer:beforeFind` event. Each event handler will receive an object with the following data.

```ts
Event.on('observer:afterSave', (data) => {
  data.type // <- afterSave
  data.data // <- model instance, not all the events have the same `data`, it depends on the type of the event.
  data.observer // <- name of the observer.
  data.isTransaction // <- a boolean indicating if the query has been run in a transaction. Always `false` for afterPaginate.
})
```

# Run tests

```sh
yarn run test
```

# Author

👤 **Oussama Benhamed**

* Twitter: [@Melchyore](https://twitter.com/Melchyore)
* Github: [@Melchyore](https://github.com/Melchyore)

# 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/Melchyore/adonis-lucid-observer/issues). 

# Show your support

Give a ⭐️ if this project helped you!

<a href="https://www.patreon.com/melchyore">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

<a href="https://www.buymeacoffee.com/melchyore" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="160" />
</a>

<a href="https://paypal.me/melchyore" target="_blank">
  <img src="https://assets.stickpng.com/images/580b57fcd9996e24bc43c530.png" width="160" >
</a>

# License

Copyright © 2022 [Oussama Benhamed](https://github.com/Melchyore).<br />
This project is [MIT](https://github.com/Melchyore/adonis-lucid-observer/blob/master/LICENSE) licensed.
