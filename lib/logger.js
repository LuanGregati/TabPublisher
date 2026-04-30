function pad(value) {
  return String(value).padStart(2, "0");
}

function getTimestamp() {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function formatLogEntry(message) {
  return `${getTimestamp()} - ${message}`;
}

function formatErrorEntry(message) {
  return `${getTimestamp()} - ERRO: ${message}`;
}

module.exports = {
  formatLogEntry,
  formatErrorEntry,
};
module.exports.default = module.exports;
