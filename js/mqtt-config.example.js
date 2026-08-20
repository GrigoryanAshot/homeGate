// Copy to mqtt-config.js and fill in (mqtt-config.js is gitignored if you prefer).
// Or paste values in the phone Settings sheet — they save to localStorage.
window.HOMEGATE_MQTT = {
  host: "xxxxxxxx.s1.eu.hivemq.cloud",
  username: "",
  password: "",
  // Secure WebSockets (HiveMQ Cloud)
  port: 8884,
  path: "/mqtt",
  topicCommand: "home/gate/command",
  topicStatus: "home/gate/status",
};
