/**
 * Signal Station
 * Strongly typed pub/sub or Event Emitter. Autocompletion friendly.
 *
 * Design choices:
 * - Signal names and payload types are defined on construction via type generics and constructor arguments.
 * - Payload is a single argument (or undefined). If you need to send more, use an object or an array.
 * - Subscriber callbacks are called immediately with no timeout or deferral.
 */


type SignalCallback<payloadType> = (signalPayload: payloadType) => void;
type SubscribeFunction<payloadType> = (onSignal: SignalCallback<payloadType>) => Subscriber<payloadType>;
type UnsubscribeFunction<payloadType> = (subscription: Subscriber<payloadType>) => void;
type PublishFunction<payloadType> = (payload: payloadType) => void;

type Subscriber<payloadType> = {
    signalCallback: SignalCallback<payloadType>;
    signalName: string | number | symbol;
    singleSignalOnly?: boolean;
}

type Signal<payloadType> = {
    subscribe: SubscribeFunction<payloadType>;
    unsubscribe: UnsubscribeFunction<payloadType>;
    publish: PublishFunction<payloadType>;
    subscribeOnce: SubscribeFunction<payloadType>;
}

type DefaultSignalDefinition = {
    [signalName: string | number | symbol]: any;
};


export type SignalStation<SignalDefinition> = {
    [SignalName in keyof SignalDefinition]: Signal<SignalDefinition[SignalName]>
};

export function makeSignalStation<SignalDefinition = DefaultSignalDefinition>(
    ...signalNames: (keyof SignalDefinition)[]
) {

    const signals: SignalStation<SignalDefinition> = {} as SignalStation<SignalDefinition>;

    for (const signalName of signalNames) {
        if (signals[signalName]){
            throw new Error(`Signal name ${String(signalName)} is already defined. Use unique signal names (or symbols with the same description if you feel adventurous).`);
        }
        signals[signalName] = registerSignal<SignalDefinition[keyof SignalDefinition]>(signalName);
    }

    function registerSignal<payloadType = SignalDefinition[keyof SignalDefinition]>(signalName: keyof SignalDefinition): Signal<payloadType> {

        const subscribers: Subscriber<payloadType>[] = [];

        const subscribe: SubscribeFunction<payloadType> = (signalCallback) => {
            const subscriber: Subscriber<payloadType> = {
                signalCallback,
                signalName: signalName
            };
            subscribers.push(subscriber);
            return subscriber;
        };

        const subscribeOnce: SubscribeFunction<payloadType> = (onSignal) => {
            const singleSubscriber = subscribe(onSignal);
            singleSubscriber.singleSignalOnly = true;
            return singleSubscriber;
        };

        const unsubscribe: UnsubscribeFunction<payloadType> = (subscriber) => {
            const indexToDelete = subscribers.indexOf(subscriber);
            subscribers.splice(indexToDelete, 1);
        };

        const publish: PublishFunction<payloadType> = (signalPayload: payloadType) => {
            for (const subscriber of subscribers) {
                subscriber.signalCallback(signalPayload);
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
    };

}
