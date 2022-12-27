import { IthoStatusPayload } from '@/types';
import { sanitizeStatusPayload } from '@/utils/api';
import EventEmitter from 'events';
import { Logger } from 'homebridge';
import { request } from 'undici';

export const DEFAULT_POLLING_INTERVAL = 5000; // every 5 seconds

interface HttpApiOptions {
  ip: string;
  username?: string;
  password?: string;
  logger: Logger;
}

export class HttpApi {
  private readonly url: URL;
  private readonly eventEmitter: EventEmitter;
  private readonly log: Logger;
  protected isPolling: Record<string, boolean> = {};

  constructor(options: HttpApiOptions) {
    this.url = new URL(`http://${options.ip}/api.html`);

    if (options.username) {
      this.url.searchParams.set('username', options.username);
    }

    if (options.password) {
      this.url.searchParams.set('password', options.password);
    }

    this.eventEmitter = new EventEmitter();

    this.log = options.logger;
  }

  on<T>(event: 'response', listener: (response: T) => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, listener: (...args: any[]) => void) {
    return this.eventEmitter.on(event, listener);
  }

  async setSpeed<T extends number>(speed: number): Promise<T> {
    // Make a copy of the URL so we don't modify the original
    const requestUrl = new URL(this.url.toString());
    requestUrl.searchParams.set('speed', speed.toString());

    this.log.debug(`[API] -> Setting speed to ${speed} at ${requestUrl}`);

    const response = await request(requestUrl, {
      method: 'GET',
    });

    const text = await response.body.text();

    if (text === 'NOK') {
      throw new Error(`Failed to get the speed: ${text}`);
    }

    // Response text will be "OK" when the request is successful
    // We'll just return the speed that was set
    return speed as T;
  }

  async getSpeed<T extends number>(): Promise<T> {
    // Make a copy of the URL so we don't modify the original
    const requestUrl = new URL(this.url.toString());
    requestUrl.searchParams.set('get', 'currentspeed');

    this.log.debug(`[API] -> Getting speed at ${requestUrl}`);

    const response = await request(requestUrl, {
      method: 'GET',
    });

    const text = await response.body.text();

    if (text === 'NOK') {
      throw new Error(`Failed to get the speed: ${text}`);
    }

    const currentSpeed = parseInt(text, 10);

    if (Number.isNaN(currentSpeed)) {
      throw new Error(`Failed to parse the speed: ${text}`);
    }

    return currentSpeed as T;
  }

  async getStatus<T extends IthoStatusPayload>(): Promise<T> {
    // Make a copy of the URL so we don't modify the original
    const requestUrl = new URL(this.url.toString());
    requestUrl.searchParams.set('get', 'ithostatus');

    this.log.debug(`[API] -> Getting status at ${requestUrl}`);

    const response = await request(requestUrl, {
      method: 'GET',
    });

    const text = await response.body.text();

    if (text === 'NOK') {
      throw new Error(`Failed to get the speed: ${text}`);
    }

    try {
      // Parse the JSON string to an object
      const sanitizedStatusPayload = sanitizeStatusPayload<T>(text);

      return sanitizedStatusPayload;
    } catch (err) {
      throw new Error(`Failed to parse the status: ${text}`);
    }
  }

  get polling() {
    const getSpeed = 'getSpeed';
    const getStatus = 'getStatus';

    return {
      [getSpeed]: {
        start: () => this.startPolling(getSpeed, this[getSpeed].bind(this)),
        stop: () => this.stopPolling(getSpeed),
        on: this.on.bind(this),
      },
      [getStatus]: {
        start: () => this.startPolling(getStatus, this[getStatus].bind(this)),
        stop: () => this.stopPolling(getStatus),
        on: this.on.bind(this),
      },
    };
  }

  /**
   * Stops polling for a specific method.
   */
  protected stopPolling(method: string): void {
    if (!this.isPolling[method]) {
      //   this.log(`Polling for "${method}" is not started or already stopped.`);
      return;
    }

    this.isPolling[method] = false;

    // this.log(`Stopping polling for "${method}".`);
  }

  protected async startPolling(method: string, apiMethod: () => Promise<unknown>): Promise<void> {
    // const stopOnError = !!this.pollingOptions?.stopOnError;

    this.isPolling[method] = true;

    while (this.isPolling[method]) {
      try {
        const response = await apiMethod();

        // this.log(
        //   `Received response while polling "${method}". Emitting "response": ${JSON.stringify(
        //     response,
        //   )}`,
        // );

        this.eventEmitter.emit('response', response);
      } catch (error) {
        // this.log(`Received error while polling "${method}": ${JSON.stringify(error)}`);

        // If the user wants to stop polling on error, we stop polling
        // if (stopOnError) {
        //   this.stopPolling(method);
        // }

        this.eventEmitter.emit('error', error);
      } finally {
        // this.log(`Waiting for next polling interval for "${method}"...`);
        await new Promise(resolve => setTimeout(resolve, DEFAULT_POLLING_INTERVAL));
      }
    }
  }
}
