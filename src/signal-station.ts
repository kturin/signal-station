function keyStringifier(keyValue: string | number | symbol): string {
    switch (typeof keyValue) {
        case 'string':
            return keyValue as string;
        case 'number':
            return '' + keyValue;
        case "symbol":
            return keyValue.toString();
        default:
            return 'impossible';
    }
}

type SignalCallback<payloadType> = (signalPayload: payloadType) => void;

interface Subscriber<payloadType> {
    onSignal: SignalCallback<payloadType>;
    uniqueSubscriberId: number;
    signalName: string;
    singleSignalOnly?: boolean;
}

type SubscribeFunction<payloadType> = (onSignal: SignalCallback<payloadType>) => Subscriber<payloadType>;
type UnsubscribeFunction<payloadType> = (subscription: Subscriber<payloadType>) => void;
type EmitFunction<payloadType> = (payload: payloadType) => void;

console.log('hello signal station');

interface Signal<payloadType> {
    subscribe: SubscribeFunction<payloadType>;
    unsubscribe: UnsubscribeFunction<payloadType>;
    emit: EmitFunction<payloadType>;
    subscribeOnce: SubscribeFunction<payloadType>;
}

export type SignalStation<SignalDefinition> = {
    [SignalName in keyof SignalDefinition]: Signal<SignalDefinition[SignalName]>
};

export function makeSignalStation<SignalDefinition>(...signalNames: (keyof SignalDefinition)[]) {

    console.log(typeof signalNames);
    const subscriberIdCounter = 1;

    const signals: SignalStation<SignalDefinition> = {} as SignalStation<SignalDefinition>;

    for (const signalName of signalNames) {
        signals[signalName] = register<SignalDefinition[keyof SignalDefinition]>(signalName);
    }

    function register<payloadType extends SignalDefinition[keyof SignalDefinition]>(signalName: keyof SignalDefinition): Signal<payloadType> {

        const subscribers: Subscriber<payloadType>[] = [];

        const subscribeToSignal: SubscribeFunction<payloadType> = (onSignal) => {
            const subscriber: Subscriber<payloadType> = {
                onSignal,
                signalName: keyStringifier(signalName),
                uniqueSubscriberId: subscriberIdCounter,
            };
            subscribers.push(subscriber);
            return subscriber;
        };

        const subscribeToSignalOnce: SubscribeFunction<payloadType> = (onSignal) => {
            const singleSubscription = subscribeToSignal(onSignal);
            singleSubscription.singleSignalOnly = true;
            return singleSubscription;
        };

        const unsubscribeFromSignal: UnsubscribeFunction<payloadType> = (subscriber) => {
            const indexToDelete = subscribers.indexOf(subscriber);
            subscribers.splice(indexToDelete, 1);
        };

        const emitSignal: EmitFunction<payloadType> = (signalPayload: payloadType) => {
            for (const subscription of subscribers) {
                subscription.onSignal(signalPayload);
                if (subscription.singleSignalOnly) {
                    unsubscribeFromSignal(subscription);
                }
            }
        };
        return {
            subscribe: subscribeToSignal,
            subscribeOnce: subscribeToSignalOnce,
            unsubscribe: unsubscribeFromSignal,
            emit: emitSignal
        };
    }

    return {
        ...signals
    };

}
