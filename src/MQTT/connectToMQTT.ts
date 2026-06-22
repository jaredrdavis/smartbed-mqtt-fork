import { logError, logInfo } from '@utils/logger';
import mqtt from 'mqtt';
import { IMQTTConnection } from './IMQTTConnection';
import MQTTConfig from './MQTTConfig';
import { MQTTConnection } from './MQTTConnection';

export const connectToMQTT = (): Promise<IMQTTConnection> => {
  logInfo('[MQTT] Connecting...');
  const client = mqtt.connect(MQTTConfig);

  return new Promise((resolve) => {
    const onError = (error: Error) => {
      logError('[MQTT] Connect Error', error);
    };

    client.once('connect', () => {
      client.off('error', onError);
      logInfo('[MQTT] Connected');
      resolve(new MQTTConnection(client));
    });

    client.on('error', onError);
  });
};
