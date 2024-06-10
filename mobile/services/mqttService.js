import mqtt from 'mqtt';

// Configure the connection URL of the MQTT broker
//const MQTT_SERVER = 'wss://79f5b3f715504ec5a7fd41a1eba9fe6a.s1.eu.hivemq.cloud:8884/mqtt'; // Use WebSocket URL for client connections
const MQTT_SERVER = 'mqtt://localhost:1883';
const client = mqtt.connect(MQTT_SERVER, {
  clientId: `mqtt_${Math.random().toString(16).slice(3)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
});

client.on('connect', () => console.log('Connected to MQTT Broker!'));
client.on('error', (error) => console.error('Connection error:', error));
//client.on('reconnect', () => console.log('Reconnecting...'));

// Function to subscribe to a topic
export const subscribeToTopic = (topic) => {
  client.subscribe(topic, (error) => {
    if (!error) {
      console.log(`Subscribed to ${topic}`);
    } else {
      console.log('Subscribe error:', error);
    }
  });
};

// Function to unsubscribe from a topic
export const unsubscribeFromTopic = (topic) => {
  client.unsubscribe(topic, (error) => {
    if (!error) {
      console.log(`Unsubscribed from ${topic}`);
    } else {
      console.log('Unsubscribe error:', error);
    }
  });
};

// Function to publish messages
export const publishMessage = (topic, message) => {
  client.publish(topic, message, { qos: 0, retain: false }, (error) => {
    if (!error) {
      console.log(`Message published to ${topic}`);
    } else {
      console.log('Publish error:', error);
    }
  });
};

client.on('message', (topic, message) => {
  console.log(`Received message from ${topic}: ${message.toString()}`);
  // Additional handling based on the topic and message
});

export default client;
