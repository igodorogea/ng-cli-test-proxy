var proxyMiddleware = require('http-proxy-middleware');
var path = require('path');
var fs = require('fs');
var url = require('url');
var util = require('util');

var conf = {
  baseDir: 'src',
  localDomain: 'http://localhost:4200',
  remoteDomain: 'https://demo.muume.com',
  startPath: '/cockpit'
}

function fileExists(baseDir, request) {
  if (util.isArray(baseDir)) {
    baseDir.reverse();
    for (var i = 0, len = baseDir.length; i < len; i++) {
      var uri = url.parse(request.url).pathname.replace(conf.startPath, ''),
        filename = path.join(process.cwd(), baseDir[i], uri),
        status,
        index = '/index.html';

      try {
        status = fs.statSync(filename);

        if (status.isDirectory()) {
          status = fs.statSync(filename + index);

          request.url += index;
        }

        return true;
      } catch (err) {
      }
    }
  }
  return false;
}

const PROXY_CONFIG = {
  [conf.startPath]: {
    target: conf.remoteDomain,
    changeOrigin: true,
    bypass: function (req, res, proxyOptions) {
      if (fileExists([conf.baseDir], req)) {
        // if exists call next()
        console.log(req.url, url.parse(req.url).pathname.replace(conf.startPath, ''))
        return url.parse(req.url).pathname.replace(conf.startPath, '')
      } else {
        // else call proxy()
        return false
      }
    },
    onError: function (err, req, res) {
      console.log('onError');
    },
    onProxyReq: function (proxyReq, req, res) {
      if (req.headers && req.headers.referer) {
        // console.log(JSON.stringify(req.headers.referer));
        req.headers.referer = req
          .headers.referer.replace(conf.localDomain + conf.startPath, conf.remoteDomain + conf.startPath);
      }
    },
    onProxyRes: function (proxyRes, req, res) {
      // console.log('onProxyRes');
      // console.log(JSON.stringify(proxyRes.headers));

      if (proxyRes.headers && proxyRes.headers.location) {
        proxyRes.headers.location = proxyRes
          .headers.location.replace(conf.remoteDomain, conf.localDomain);
      }
    }
  }
}

module.exports = PROXY_CONFIG;
