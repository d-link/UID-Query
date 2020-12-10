const chalk = require("chalk");
const white = chalk.white;
const blue = chalk.blue;
const green = chalk.green;
const orange = chalk.yellow;
const red = chalk.bold.red;
const gray = chalk.gray;
const magenta = chalk.magenta;
const cyan = chalk.cyan;

const log_info = function (...str) {
  console.log(white(...str));
};
const log_warn = function (...str) {
  console.log(orange(...str));
};
const log_error = function (...str) {
  console.log(red(...str));
};
const light = function (...str) {
  console.log(magenta(...str));
};
const log = function (...str) {
  console.log(white(...str));
};
const info = function (...str) {
  console.log(green(...str));
};
const warn = function (...str) {
  console.log(orange(...str));
};
const error = function (...str) {
  console.log(red(...str));
};
const debug = function (...str) {
  console.log(blue(...str));
};
const time = function (str) {
  console.time(str);
};
const timeEnd = function (str) {
  console.timeEnd(str);
};

module.exports = {
  log_info,
  log_warn,
  log_error,
  light,
  log,
  info,
  warn,
  error,
  debug,
};
