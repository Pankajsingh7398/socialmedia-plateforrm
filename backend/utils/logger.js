const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `${timestamp} [${level}] ${message}`;
};

const logger = {
  info: (message) => console.log(`${colors.green}${formatMessage('INFO', message)}${colors.reset}`),
  warn: (message) => console.warn(`${colors.yellow}${formatMessage('WARN', message)}${colors.reset}`),
  error: (message) => console.error(`${colors.red}${formatMessage('ERROR', message)}${colors.reset}`),
  debug: (message) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${colors.blue}${formatMessage('DEBUG', message)}${colors.reset}`);
    }
  },
};

module.exports = logger;
