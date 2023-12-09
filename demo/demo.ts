import {makeSignalStation, SignalStation} from "../src/signal-station";

console.log('Demo cases loaded');

type SignalDef = {
    testSignal: string,
    testSignal2: string,
};
const testSignalStation:SignalStation<SignalDef> = makeSignalStation('testSignal', 'testSignal2');

testSignalStation.testSignal.emit('testPayload');

testSignalStation.testSignal.subscribe((payload) => {
    console.log('testSignal received:', payload);
});