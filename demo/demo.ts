import {createSignalStation} from "../src/signal-station";

console.log('Demo cases loaded');

type testSignalSetType = {
    testSignal1: string,
    testSignal2: number,
    testSignal3: void,
};

// typed station
const testSignalStation = createSignalStation<testSignalSetType>('testSignal1', 'testSignal2', 'testSignal3');

// const testSignalStation: Signals<testSignalSetType> = createSignalStation('testSignal1', 'testSignal2', 'testSignal3'); // alternatively


// untyped station
const noTypeDefinedSignalStation = createSignalStation('testUntypedSignal');


// subscribe: good typed station cases
testSignalStation.testSignal1.subscribe((payload) => {  // okay, payload is string as intended
    console.log('testSignal received:', payload);
    payload.toUpperCase();
});
testSignalStation.testSignal2.subscribe((payload) => { //okay, payload is number as intended
    console.log('testSignal2 received:', payload);
    Math.sqrt(payload);
});
testSignalStation.testSignal3.subscribe(() => { // okay, no payload as intended
    console.log('testSignal2 received:');
});
testSignalStation.testSignal2.subscribe(() => { // okay, you can subscribe to signal with payload with an empty callback, that's not forbidden
    console.log('testSignal2 received:');
});


// subscribe: bad typed station cases
// testSignalStation.testSignal3.subscribe((payload) => { // error, no payload allowed in testSignal3 type
//     console.log('testSignal3 received', payload);
// });
// testSignalStation.testSignal1.subscribe((payload1, payload2) => { // error, multiple payloads are never allowed
//     console.log('testNoDefSignal received with multiple payloads (this shall never happen):', payload1, payload2);
// });
// testSignalStation.testSignal1.subscribe((payload) => { // error, no square-rooting strings.
//     Math.sqrt(payload);
// });

// subscribe: good untyped station cases
noTypeDefinedSignalStation.testUntypedSignal.subscribe((payload) => { // okay, payload is any as intended
    console.log('testNoDefSignal received:', payload);
});
noTypeDefinedSignalStation.testUntypedSignal.subscribe(() => { // okay, payload is any as intended and no payload is allowed
    console.log('testNoDefSignal received with no payload');
});

// subscribe: bad untyped station cases
// noTypeDefinedSignalStation.testUntypedSignal.subscribe((payload1, payload2) => { // wrong, payload is any as intended and multiple payloads are allowed
//     console.log('testNoDefSignal received with multiple payloads (this shall never happen):', payload1, payload2);
// });

// publish: good typed station cases
testSignalStation.testSignal1.publish('testPayload');   // okay, payload is string as intended
testSignalStation.testSignal2.publish(1234);            // okay, payload is number as intended
testSignalStation.testSignal3.publish(); // okay, "undefined" is allowed because testsignal3 has void type in testSignalSetType

// publish: bad typed station cases
// testSignalStation.testSignal1.publish(1234); // error, wrong payload type
// testSignalStation.testSignal1.publish('testPayload1', 'testPayload2'); // error, multiple payload arguments are never allowed
// testSignalStation.testSignal2.publish(); // error, wrong payload type ("undefined" when should be "number")
// testSignalStation.wrongSignalName.publish('testPayload'); // error, wrong signal name

// publish: good untyped station cases
noTypeDefinedSignalStation.testUntypedSignal.publish('testPayload'); // okay, payload is string as intended
noTypeDefinedSignalStation.testUntypedSignal.publish(1234);  // okay, payload is number as intended
noTypeDefinedSignalStation.testUntypedSignal.publish(); // okay, "undefined" is allowed when no type is defined for whole signal station

// publish: bad untyped station cases
// noTypeDefinedSignalStation.testUntypedSignal.publish('testPayload1', 'testPayload2'); // error, multiple payload arguments are never allowed
// noTypeDefinedSignalStation.wrongSignalName.publish('testPayload'); // error, wrong signal name