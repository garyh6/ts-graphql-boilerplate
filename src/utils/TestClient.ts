import * as rp from "request-promise";

export class TestClient {
  url: string;

  options: {
    jar: any;
    withCredentials: boolean;
    json: boolean;
  };

  constructor(url: string) {
    this.url = process.env.TEST_HOST + url;
    this.options = {
      jar: rp.jar(),
      withCredentials: true,
      json: true
    };
  }

  async me() {
    return rp.post(this.url, {
      ...this.options,
      body: {
        query: `
        {
          me {
            id
            email
          }
        }`
      }
    });
  }

  async login(email: string, password: string) {
    return rp.post(this.url, {
      ...this.options,
      body: {
        query: `
        mutation {
            login(email: "${email}", password:"${password}") {
              path
              message
            }
        }`
      }
    });
  }

  async logout() {
    return rp.post(this.url, {
      ...this.options,
      body: {
        query: `
          mutation {
            logout
          }`
      }
    });
  }

  async register(email: string, password: string) {
    return rp.post(this.url, {
      ...this.options,
      body: {
        query: `
          mutation {
              register(email: "${email}", password:"${password}") {
                path
                message
              }
          }`
      }
    });
  }
}
