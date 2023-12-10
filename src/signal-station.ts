/**
 * Signal Station
 * Strongly typed pub/sub or Event Emitter. Autocompletion friendly.
 *
 * Design choices:
 * - Signal names and payload types are defined on construction via type generics and constructor arguments.
 * - Payload is always a single argument only if defined. If you need to send more, use an object, array, map, set, whatever you fancy.
 * - Subscribe and publish without payload is supported, for that truly stateless experience.
 * - Subscriber callbacks are called immediately with no timeout or deferral. (may reconsider this)
 */


// Helper for determining if a type is specifically "any" or not. Don't ask why and how it works, unless you don't value your sanity.
type IsAny<Match> = (Match extends never ? true : false) extends false ? false : true;


/** Defines allowed callback signatures.
 * If callback type is defined as void, then no payload is allowed.
 * If callback type is defined as any, then any payload is allowed, and it is optional. (This happens when we create a station without providing a signals collection type.)
 * If callback type is defined as a specific type, then only that type is allowed, and it is mandatory.
 */
type SignalCallback<PayloadType> =
    IsAny<PayloadType> extends true
        ? (payload?: any) => void
        : PayloadType extends void
            ? () => void
            : (payload: PayloadType) => void;

/**
 * Defines allowed subscribe function signatures.
 * Subscribe function always takes a single callback function as an argument, and returns a subscriber object, which can be used later to unsubscribe, or for debugging.
 */
type SubscribeFunction<PayloadType> = (onSignal: SignalCallback<PayloadType>) => Subscriber<PayloadType>;

/**
 * Defines allowed unsubscribe function signatures.
 * Unsubscribe function always takes a subscriber object that was returned from Subscribe function as an argument.
 */
type UnsubscribeFunction<PayloadType> = (subscription: Subscriber<PayloadType>) => void;

/**
 * Defines allowed publish function signatures.
 * Publish function always takes a single payload argument, and sends it to all subscribers.
 * If payload type is defined as void, then no payload is allowed.
 * If payload type is defined as any, then any payload is allowed, and it is optional. (This happens when we create a station without providing a signals collection type.)
 * If payload type is defined as a specific type, then only that type is allowed, and it is mandatory.
 */
type PublishFunction<PayloadType> = IsAny<PayloadType> extends true ? (payload?: any) => void : (payload: PayloadType) => void;

// Wrapper around a callback function, contains metadata and minimal state needed for executing signals once.
type Subscriber<payloadType> = {
    signalCallback: SignalCallback<payloadType>;
    signalName: string | number | symbol;
    singleSignalOnly?: boolean;
}

// Signal, AKA Topic or Event. Main exposed API structure.
type Signal<payloadType> = {
    subscribe: SubscribeFunction<payloadType>;
    unsubscribe: UnsubscribeFunction<payloadType>;
    publish: PublishFunction<payloadType>;
    subscribeOnce: SubscribeFunction<payloadType>;
}

// Default signal collection type, used when no type is provided on station creation.
type DefaultSignalTypesCollection = {
    [SignalName: string | number | symbol]: any;
};

// Collection of signals. May seem redundant, but it's useful for checking and validating externally, hence the export.
export type Signals<SignalTypesCollection = DefaultSignalTypesCollection> = {
    [SignalName in keyof SignalTypesCollection]: Signal<IsAny<SignalTypesCollection[SignalName]> extends true ? any : SignalTypesCollection[SignalName]>
};

/**
 * Creates a signal station.
 * @param signalNames - Names of signals to create. Must be unique strings, numbers or symbols.
 * @generic SignalTypesCollection - Collection of signals to create. Must be a type with keys matching signalNames, and values matching payload types.
 * @returns Signal station object, including all signals and station-level methods.
 */
export function createSignalStation<SignalsCollectionType>(
    ...signalNames: (keyof SignalsCollectionType)[]
) {

    const signals: Signals<SignalsCollectionType> = {} as Signals<SignalsCollectionType>;

    // Populate on construction. Signals are immutable, we can't add them later.
    for (const signalName of signalNames) {
        if (signals[signalName]) {
            throw new Error(`Signal name ${String(signalName)} is already defined. Use unique signal names (or symbols with the same description if you feel adventurous).`);
        }
        signals[signalName] = registerSignal(signalName);
    }

    // Shorthand for determining the payload type for unique signals, mapped type magic based on provided SignalsCollectionType. Without provided SignalsCollectionType, it defaults to "any".
    type PayloadType = IsAny<SignalsCollectionType[keyof SignalsCollectionType]> extends true ? any : SignalsCollectionType[keyof SignalsCollectionType];


    function registerSignal(signalName: keyof SignalsCollectionType): Signal<PayloadType> {

        const subscribers: Subscriber<PayloadType>[] = [];

        /**
         * Subscribes to a signal. Callback is called when a signal is published.
         * @param signalCallback - Callback function to be called when signal is published.
         */
        const subscribe: SubscribeFunction<PayloadType> = (signalCallback) => {
            const subscriber: Subscriber<PayloadType> = {
                signalCallback,
                signalName: signalName
            };
            subscribers.push(subscriber);
            return subscriber;
        };

        /**
         * Subscribes to a signal, but only once. After the first signal is received, the subscription is automatically removed.
         * @param signalCallback - Callback function to be called when signal is published.
         */
        const subscribeOnce: SubscribeFunction<PayloadType> = (signalCallback: SignalCallback<PayloadType>) => {
            const singleSubscriber = subscribe(signalCallback);
            singleSubscriber.singleSignalOnly = true;
            return singleSubscriber;
        };

        /**
         * Unsubscribes from a signal. Callback passed to given subscriber will no longer be called when signal is published.
         * @param subscriber - Subscriber object returned from subscribe() or subscribeOnce() function.
         */
        const unsubscribe: UnsubscribeFunction<PayloadType> = (subscriber: Subscriber<PayloadType>): void => {
            const indexToDelete = subscribers.indexOf(subscriber);
            subscribers.splice(indexToDelete, 1);
        };

        /**
         * Publishes a signal. All subscribers are called with the provided payload.
         * @param payload - Payload to send to all registered subscribers.
         */
        const publish: PublishFunction<PayloadType> = (payload: PayloadType): void => {
            for (const subscriber of subscribers) {
                subscriber.signalCallback(payload);
                if (subscriber.singleSignalOnly) {
                    unsubscribe(subscriber);
                }
            }
        };

        return {
            subscribe,
            subscribeOnce,
            unsubscribe,
            publish,
        };
    }

    return {
        ...signals
        // any future station-level methods go here, so don't go overzealous with simplifying, please.
    };

}
