// Generated by CoffeeScript 1.7.1
(function() {
  var bl, config, crypto, currentDir, hexoDir, hexoPostsDir, http, key, listenPort, nodeVersion, shelljs;

  http = require("http");

  shelljs = require("shelljs");

  crypto = require("crypto");

  bl = require('bl');

  config = require('./config');

  key = config.webhook_secret;

  currentDir = '' + shelljs.pwd();

  hexoPostsDir = "" + currentDir + "/" + config.path.posts_path;

  hexoDir = "" + currentDir + "/" + config.path.hexo_path;

  nodeVersion = config.nodejs_version;

  listenPort = config.listen_port;

  http.createServer(function(request, response) {
    request.pipe(bl(function(err, blob) {
      var event, hexoCmd, id, nvmCmd, pullCmd, result, sig, signBlob, statusCode;
      signBlob = function(key) {
        return 'sha1=' + crypto.createHmac('sha1', key).update(blob).digest('hex');
      };
      sig = request.headers['x-hub-signature'];
      event = request.headers['x-github-event'];
      id = request.headers['x-github-delivery'];
      statusCode = 400;
      result = {
        success: false,
        errMsg: ''
      };
      if (!(sig && id && event && signBlob(key) === sig + '')) {
        statusCode = 401;
        result = {
          success: false,
          errMsg: 'vertify failed'
        };
      } else {
        shelljs.cd(hexoPostsDir);
        pullCmd = shelljs.exec("ls & git pull origin master ");
        if (pullCmd.code === 0) {
          console.log("pull successed!");
          if (!(shelljs.which('node'))) {
            if (shelljs.which('nvm')) {
              nvmCmd = shelljs.exec("nvm use " + nodeVersion);
            }
          }
          if (shelljs.which('node')) {
            shelljs.cd(hexoDir);
            hexoCmd = shelljs.exec("hexo clean & hexo generate");
            if (hexoCmd.code !== 0) {
              console.log("hexo generate failed!");
              statusCode = 500;
              result = {
                success: false,
                errMsg: "hexo generage failed:" + hexoCmd.output
              };
            } else {
              console.log("hexo generate successed!");
              statusCode = 200;
              result = {
                success: true,
                errMsg: ''
              };
            }
          } else {
            result = {
              success: false,
              errMsg: "node is broken!"
            };
          }
        } else {
          console.log("pull posts failed");
          statusCode = 500;
          result = {
            success: false,
            errMsg: "pull posts failed:" + pullCmd.output
          };
        }
      }
      shelljs.cd(currentDir);
      response.writeHead(statusCode, {
        "Content-Type": "application/json"
      });
      response.end(JSON.stringify(result));
    }));
  }).listen(listenPort);

}).call(this);
