export class BaseAuthenticator {
  isAuthenticated(event) {
    throw new Error("Not implemented");
  }
}

export class Authenticator extends BaseAuthenticator {
  /**
   *
   * @param {string} accessKey
   */
  constructor(accessKey) {
    super();
    this.accessKey = accessKey;
  }

  isAuthenticated(event) {
    const auth = event.headers.Authorization || event.headers.authorization;

    return auth === `Bearer ${this.accessKey}`;
  }
}
