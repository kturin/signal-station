import {makeSignalStation, SignalStation} from "../src/signal-station";

console.log('Demo cases loaded');

type testSignalType = {
    testSignal: string,
    testSignal2: number,
};
const testSignalStation:SignalStation<testSignalType> = makeSignalStation('testSignal', 'testSignal2');

testSignalStation.testSignal.subscribe((payload) => {
    console.log('testSignal received:', payload);
});

testSignalStation.testSignal2.subscribe((payload) => {
    console.log('testSignal2 received:', payload);
});

testSignalStation.testSignal.publish('testPayload');
testSignalStation.testSignal2.publish(1234);
// testSignalStation.testSignal.publish(1234); // error, wrong payload type


// testSignalStation.wrongSignalName.publish('testPayload'); // error, wrong signal name

const noTypeDefinedSignalStation = makeSignalStation('testUntypedSignal');

noTypeDefinedSignalStation.testUntypedSignal.subscribe((payload) => {
    console.log('testNoDefSignal received:', payload);
});

noTypeDefinedSignalStation.testUntypedSignal.publish('testPayload');
noTypeDefinedSignalStation.testUntypedSignal.publish(1234);
// noTypeDefinedSignalStation.wrongSignalName.publish('testPayload'); // error, wrong signal name