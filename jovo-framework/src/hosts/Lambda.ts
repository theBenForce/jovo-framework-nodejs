import { Host, Log } from 'jovo-core';

if (process.env.LAMBDA_TASK_ROOT && process.env.AWS_EXECUTION_ENV) {
  // tslint:disable-next-line:no-string-literal
  if (Log.config.appenders['console']) {
    Log.config.appenders['console'].ignoreFormatting = true; // tslint:disable-line:no-string-literal
  }
}

export class Lambda implements Host {
  headers: any; // tslint:disable-line
  event: any; // tslint:disable-line
  context: any; // tslint:disable-line
  callback: any; // tslint:disable-line
  isApiGateway = false;
  $request: any; // tslint:disable-line

  responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
  };

  hasWriteFileAccess = false;

  // tslint:disable-next-line:no-any
  constructor(event: any, context: any, callback: Function) {
    this.event = event;
    this.context = context;
    this.callback = callback;
    if (typeof event.body !== 'undefined') {
      this.isApiGateway = true;
      this.headers = event.headers;
      this.$request = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      this.$request = event;
    }
  }

  getQueryParams(): Record<string, string> {
    return this.event.queryStringParameters || {};
  }

  getRequestObject() {
    return this.$request;
  }

  setResponse(obj: any) {
    // tslint:disable-line
    return new Promise<void>((resolve) => {
      if (this.isApiGateway) {
        this.callback(null, {
          body: typeof obj === 'object' ? JSON.stringify(obj) : obj,
          headers: this.responseHeaders,
          isBase64Encoded: false,
          statusCode: 200,
        });
      } else {
        this.callback(null, obj);
      }
      resolve();
    });
  }

  fail(error: Error) {
    const responseObj: any = {
      // tslint:disable-line
      code: 500,
      msg: error.message,
    };

    if (process.env.NODE_ENV === 'production') {
      responseObj.stack = error.stack;
    }

    if (this.isApiGateway) {
      this.callback(error, {
        body: JSON.stringify(responseObj),
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        isBase64Encoded: false,
        statusCode: 500,
      });
    } else {
      this.callback(error, responseObj);
    }
  }
}
