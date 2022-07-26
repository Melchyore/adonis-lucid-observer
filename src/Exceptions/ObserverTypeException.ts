import { Exception } from '@poppinss/utils'

export default class ObserverTypeException extends Exception {
  public static invoke(observer: any, model: string) {
    return new this(
      `The observer "${
        typeof observer === 'function' ? observer.name : observer
      }" must be an instance, ${typeof observer} given in model "${model}"`,
      500,
      'E_WRONG_OBSERVER_TYPE'
    )
  }
}
