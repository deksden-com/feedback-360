import {
  type ClientSetActiveCompanyOutput,
  type DispatchOperationInput,
  type OperationContext,
  type OperationResult,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseClientSetActiveCompanyInput,
  parseClientSetActiveCompanyOutput,
  parseDispatchOperationInput,
  parseOperationContext,
  parseOperationResult,
} from "@feedback-360/api-contract";
import { dispatchOperation } from "@feedback-360/core";

export type OperationTransport = {
  invoke(request: DispatchOperationInput): Promise<unknown>;
};

type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<{ json(): Promise<unknown> }>;

export type CreateHttpTransportOptions = {
  baseUrl: string;
  endpointPath?: string;
  fetchFn?: FetchLike;
};

export type InvokeOperationParams<Output> = {
  operation: string;
  input: unknown;
  context?: OperationContext;
  parseOutput: (value: unknown) => Output;
};

export type ClientRuntime = {
  invokeOperation: <Output>(
    params: InvokeOperationParams<Output>,
  ) => Promise<OperationResult<Output>>;
  setActiveContext: (context: OperationContext) => OperationResult<OperationContext>;
  getActiveContext: () => OperationContext;
  setActiveCompany: (companyId: string) => OperationResult<ClientSetActiveCompanyOutput>;
  getActiveCompany: () => string | undefined;
};

export const createInprocTransport = (): OperationTransport => {
  return {
    invoke: async (request) => dispatchOperation(request),
  };
};

export const createHttpTransport = (options: CreateHttpTransportOptions): OperationTransport => {
  const endpointPath = options.endpointPath ?? "/api/v1/operations";
  const normalizedBaseUrl = options.baseUrl.endsWith("/")
    ? options.baseUrl.slice(0, -1)
    : options.baseUrl;
  const endpointUrl = `${normalizedBaseUrl}${endpointPath}`;
  const fetchImpl: FetchLike = options.fetchFn ?? ((input, init) => fetch(input, init));

  return {
    invoke: async (request) => {
      const response = await fetchImpl(endpointUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(request),
      });

      return response.json();
    },
  };
};

export const createClientRuntime = (transport: OperationTransport): ClientRuntime => {
  let activeContext: OperationContext = {};

  const withActiveContext = (context?: OperationContext): OperationContext => {
    if (!context) {
      return { ...activeContext };
    }

    return {
      ...activeContext,
      ...context,
    };
  };

  return {
    invokeOperation: async <Output>({
      operation,
      input,
      context,
      parseOutput,
    }: InvokeOperationParams<Output>): Promise<OperationResult<Output>> => {
      let request: DispatchOperationInput;
      try {
        request = parseDispatchOperationInput({
          operation,
          input,
          context: withActiveContext(context),
        });
      } catch (error) {
        return errorResult(errorFromUnknown(error, "invalid_input", "Invalid operation request."));
      }

      let rawResult: unknown;
      try {
        rawResult = await transport.invoke(request);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Operation transport invocation failed."),
        );
      }

      try {
        return parseOperationResult(rawResult, parseOutput);
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid operation result payload."),
        );
      }
    },

    setActiveContext: (context) => {
      try {
        const parsedContext = parseOperationContext(context);
        activeContext = {
          ...activeContext,
          ...parsedContext,
        };
        return okResult({ ...activeContext });
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid active context payload."),
        );
      }
    },

    getActiveContext: () => ({ ...activeContext }),

    setActiveCompany: (companyId) => {
      try {
        const parsedInput = parseClientSetActiveCompanyInput({ companyId });
        activeContext = {
          ...activeContext,
          companyId: parsedInput.companyId,
        };
        return okResult(parseClientSetActiveCompanyOutput(parsedInput));
      } catch (error) {
        return errorResult(
          errorFromUnknown(error, "invalid_input", "Invalid active company payload."),
        );
      }
    },

    getActiveCompany: () => activeContext.companyId,
  };
};

export const invalidInputResult = (error: unknown, message: string) =>
  errorResult(
    createOperationError(
      "invalid_input",
      errorFromUnknown(error, "invalid_input", message).message,
    ),
  );
