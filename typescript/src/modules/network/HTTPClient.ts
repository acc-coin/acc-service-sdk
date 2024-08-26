import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { CreateAxiosDefaults } from "axios/index";

export class HTTPClient {
    private client: AxiosInstance;
    constructor(config?: CreateAxiosDefaults) {
        this.client = axios.create(config);
    }

    public get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        return new Promise<AxiosResponse>((resolve, reject) => {
            this.client
                .get(url, config)
                .then((response: AxiosResponse) => {
                    resolve(response);
                })
                .catch((reason: any) => {
                    reject(handleNetworkError(reason));
                });
        });
    }

    public delete(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        return new Promise<AxiosResponse>((resolve, reject) => {
            this.client
                .delete(url, config)
                .then((response: AxiosResponse) => {
                    resolve(response);
                })
                .catch((reason: any) => {
                    reject(handleNetworkError(reason));
                });
        });
    }

    public post(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        return new Promise<AxiosResponse>((resolve, reject) => {
            this.client
                .post(url, data, config)
                .then((response: AxiosResponse) => {
                    resolve(response);
                })
                .catch((reason: any) => {
                    reject(handleNetworkError(reason));
                });
        });
    }

    public put(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
        return new Promise<AxiosResponse>((resolve, reject) => {
            this.client
                .put(url, data, config)
                .then((response: AxiosResponse) => {
                    resolve(response);
                })
                .catch((reason: any) => {
                    reject(handleNetworkError(reason));
                });
        });
    }
}

export class NetworkError extends Error {
    /**
     * The status code
     */
    public status: number;

    /**
     * The status text
     */
    public statusText: string;

    /**
     * The message of response
     */
    public statusMessage: string;

    /**
     * Constructor
     * @param status        The status code
     * @param statusText    The status text
     * @param statusMessage The message of response
     */
    constructor(status: number, statusText: string, statusMessage: string) {
        super(statusText);
        this.name = "NetworkError";
        this.status = status;
        this.statusText = statusText;
        this.statusMessage = statusMessage;
    }
}

/**
 *  When status code is 404
 */
export class NotFoundError extends NetworkError {
    /**
     * Constructor
     * @param status        The status code
     * @param statusText    The status text
     * @param statusMessage The message of response
     */
    constructor(status: number, statusText: string, statusMessage: string) {
        super(status, statusText, statusMessage);
        this.name = "NotFoundError";
    }
}

/**
 *  When status code is 400
 */
export class BadRequestError extends NetworkError {
    /**
     * Constructor
     * @param status        The status code
     * @param statusText    The status text
     * @param statusMessage The message of response
     */
    constructor(status: number, statusText: string, statusMessage: string) {
        super(status, statusText, statusMessage);
        this.name = "BadRequestError";
    }
}

/**
 * It is a function that handles errors that occur during communication
 * with a server for easy use.
 * @param error This is why the error occurred
 * @returns The instance of Error
 */
export function handleNetworkError(error: any): Error {
    if (
        error.response !== undefined &&
        error.response.status !== undefined &&
        error.response.statusText !== undefined
    ) {
        let statusMessage: string;
        if (error.response.data !== undefined) {
            if (typeof error.response.data === "string") statusMessage = error.response.data;
            else if (typeof error.response.data === "object" && error.response.data.statusMessage !== undefined)
                statusMessage = error.response.data.statusMessage;
            else if (typeof error.response.data === "object" && error.response.data.errorMessage !== undefined)
                statusMessage = error.response.data.errorMessage;
            else statusMessage = error.response.data.toString();
        } else statusMessage = "";

        switch (error.response.status) {
            case 400:
                return new BadRequestError(error.response.status, error.response.statusText, statusMessage);
            case 404:
                return new NotFoundError(error.response.status, error.response.statusText, statusMessage);
            default:
                return new NetworkError(error.response.status, error.response.statusText, statusMessage);
        }
    } else {
        if (error.message !== undefined) return new Error(error.message);
        else return new Error("An unknown error has occurred.");
    }
}
