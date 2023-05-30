export class CustomError {
  constructor(message: string = "Unknown Error") {
    this.message = message;
  }
  message: string;
}
