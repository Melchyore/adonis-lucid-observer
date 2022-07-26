import { Exception } from '@poppinss/utils'

export default class ModelAlreadyObservedException extends Exception {
  public static invoke(model: string) {
    return new this(`The model "${model}" is already observed`, 500, 'E_MODEL_ALREADY_OBSERVED')
  }
}
