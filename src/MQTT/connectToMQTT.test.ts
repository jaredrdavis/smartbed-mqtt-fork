import { logError, logInfo } from '@utils/logger';
import EventEmitter from 'events';
import mqtt from 'mqtt';
import { connectToMQTT } from './connectToMQTT';

jest.mock('mqtt', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
  },
}));

jest.mock('@utils/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

class MockMqttClient extends EventEmitter {
  off(eventName: string | symbol, listener: (...args: any[]) => void): this {
    return this.removeListener(eventName, listener);
  }
}

const mockedConnect = mqtt.connect as jest.MockedFunction<typeof mqtt.connect>;
const mockedLogError = logError as jest.MockedFunction<typeof logError>;
const mockedLogInfo = logInfo as jest.MockedFunction<typeof logInfo>;

describe('connectToMQTT', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps waiting for connect after an initial connection error', async () => {
    const client = new MockMqttClient();
    mockedConnect.mockReturnValue(client as never);

    const connectionPromise = connectToMQTT();
    const error = new Error('connect ECONNREFUSED');

    client.emit('error', error);
    await new Promise((resolve) => setImmediate(resolve));
    client.emit('connect');

    await expect(connectionPromise).resolves.toBeDefined();
    expect(mockedConnect).toHaveBeenCalledTimes(1);
    expect(mockedLogInfo).toHaveBeenNthCalledWith(1, '[MQTT] Connecting...');
    expect(mockedLogError).toHaveBeenCalledWith('[MQTT] Connect Error', error);
    expect(mockedLogInfo).toHaveBeenCalledWith('[MQTT] Connected');
  });
});
