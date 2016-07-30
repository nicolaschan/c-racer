const async = require('async');
const SimpleColoredLogger = require('./simple-colored-logger');
const logger = new SimpleColoredLogger('autocompiler');
const fs = require('fs');
const table = require('table');
const chalk = require('chalk');
const config = require('./config.json');

const correct = config.correct;
var scores = {};

const deleteCurrentCompiled = (callback) => {
  const deleteFile = (file, callback) => {
    fs.unlink(`compiled/${file}`, callback);
  };
  fs.mkdir('compiled', (err) => {
    logger.info('Created \'compiled\'');
    fs.readdir('compiled', (err, files) => {
      async.each(files, deleteFile, function() {
        logger.info(`Deleted all ${files.length} files from 'compiled'`);
        logger.gap();
        callback();
      });
    });
  });
};

const compileSubmissions = (callback) => {
  var successfulCompiles = 0;
  var totalCompileAttempts = 0;

  const compileFile = (file, callback) => {
    var error = false;
    var fileName = file.split('.')[0];
    const spawn = require('child_process').spawn;
    const compiler = spawn('gcc', [`submissions/${file}`, '-o', `compiled/${fileName}`]);
    compiler.stderr.on('data', (data) => {
      if (!error) {
        error = true;
        totalCompileAttempts++;
        logger.failure(`Not compiled ${fileName}`);
        callback();
      }
    });
    compiler.on('exit', (data) => {
      if (!error) {
        successfulCompiles++;
        totalCompileAttempts++;
        logger.success(`Compiled ${fileName}`);
        callback();
      }
    });
  };

  fs.readdir('submissions', (err, files) => {
    logger.info(`Compiling ${files.length} files...`);
    async.each(files, compileFile, (err) => {
      logger.info(`${successfulCompiles} of ${totalCompileAttempts} files compiled successfully`);
      logger.gap();
      callback();
    });
  });
};

const runSubmissions = (callback) => {
  const runSubmission = (file, callback) => {
    var isCorrect = false;
    var result;
    var time;
    var fileName = file.split('.')[0];
    const spawn = require('child_process').spawn;
    logger.info(`Running ${fileName}...`);
    const runner = spawn('time', [`./compiled/${fileName}`]);
    runner.stdout.on('data', (data) => {
      result = data.toString();
      isCorrect = (data.toString() == correct.toString());
    });
    runner.stderr.on('data', (data) => {
      const removeEmptyString = (array) => {
        var newArray = [];
        for (var i in array) {
          if (array[i] != '')
            newArray.push(array[i]);
        }
        return newArray;
      };

      time = parseFloat(removeEmptyString(data.toString().split(' '))[2]);
      scores[fileName] = {};
      scores[fileName].time = time;
      scores[fileName].correct = isCorrect;
      scores[fileName].result = result;
    });
    runner.on('exit', (data) => {
      if (isCorrect)
        logger.success(`${fileName} is correct`);
      else
        logger.failure(`${fileName} is incorrect`);
      callback();
    });
  };

  fs.readdir('compiled', (err, files) => {
    logger.info(`Running ${files.length} files...`);
    async.eachSeries(files, runSubmission, (err) => {
      logger.info('All compiled submissions finished running');
      callback();
    });
  });
};

const displayTable = (callback) => {
  const winner = (string) => {
    return chalk.yellow.bold('★ ') + chalk.green.bold(string);
  };

  var array = [
    ['File Name', 'Time (sec)', 'Output']
  ];
  var lowest = -1;

  const removeControlCharacters = (string) => {
    var out = '';
    for (var i = 0; i < string.length; i++) {
      if (string[i] != '\n')
        out += string[i];
    }

    if (out.length > 20)
      out = out.substring(0, 20) + '...';

    return out;
  };

  for (var fileName in scores) {
    if (scores[fileName].time < lowest || lowest == -1)
      lowest = scores[fileName].time;
    array.push([fileName, scores[fileName].time, removeControlCharacters(scores[fileName].result)]);
  }

  var scoreTableNoColor = table.default(array, {
    border: table.getBorderCharacters('norc')
  });

  array[0] = [chalk.bold('File Name'), chalk.bold('Time (sec)'), chalk.bold('Output')];
  for (var i = 1; i < array.length; i++) {
    if (!scores[array[i][0]].correct) {
      array[i][0] = chalk.red(array[i][0]);
      continue;
    }
    if (array[i][1] == lowest) {
      array[i][0] = winner(array[i][0]);
    } else {
      array[i][0] = chalk.yellow(array[i][0]);
    }
  }

  var scoreTable = table.default(array, {
    border: table.getBorderCharacters('norc')
  });

  fs.writeFile('table.txt', scoreTableNoColor, (err) => {
    logger.info('Score table saved as \'table.txt\'');
    console.log(scoreTable);
    callback();
  });
};

async.series([deleteCurrentCompiled, compileSubmissions, runSubmissions, displayTable]);