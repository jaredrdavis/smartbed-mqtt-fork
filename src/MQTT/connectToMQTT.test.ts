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

  it('keeps waiting across repeated connection errors and cleans up after connect', async () => {
    const client = new MockMqttClient();
    mockedConnect.mockReturnValue(client as never);

    const connectionPromise = connectToMQTT();
    const firstError = new Error('connect ECONNREFUSED');
    const secondError = new Error('connect ETIMEDOUT');
    const postConnectError = new Error('post-connect error');

    client.emit('error', firstError);
    client.emit('error', secondError);
    await new Promise((resolve) => setImmediate(resolve));
    client.emit('connect');
    client.emit('error', postConnectError);

    await expect(connectionPromise).resolves.toBeDefined();
    expect(mockedConnect).toHaveBeenCalledTimes(1);
    expect(mockedLogInfo).toHaveBeenNthCalledWith(1, '[MQTT] Connecting...');
    expect(mockedLogError).toHaveBeenNthCalledWith(1, '[MQTT] Connect Error', firstError);
    expect(mockedLogError).toHaveBeenNthCalledWith(2, '[MQTT] Connect Error', secondError);
    expect(mockedLogError).toHaveBeenNthCalledWith(3, '[MQTT] Error', postConnectError);
    expect(mockedLogInfo).toHaveBeenCalledWith('[MQTT] Connected');
  });
});
