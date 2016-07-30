const chalk = require('chalk');

const Logger = function(processName) {
  this.processName = processName;
};

Logger.prototype.log = function(level, color, message) {
  console.log(chalk.gray(this.processName + ' - ') + chalk[color].bold(`${level}: `) + message);
};

Logger.prototype.info = function(message) {
  this.log('info', 'cyan', message);
};

Logger.prototype.success = function(message) {
  this.log('success', 'green', message + ' ✓');
};

Logger.prototype.failure = function(message) {
  this.log('failure', 'red', message + ' ✘');
};

Logger.prototype.error = function(message) {
  this.log('error', 'red', message);
};

Logger.prototype.debug = function(message) {
  this.log('debug', 'white', message);
};

Logger.prototype.gap = function() {
  console.log();
};

module.exports = Logger;