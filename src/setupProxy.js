const proxy = require('http-proxy-middleware');

const options = {
  target: 'http://localhost:8081/',
  xfwd: true,
  headers: {
    'Access-Control-Allow-Origin': 'https://localhost:*'
  }
}
module.exports = function(app) {
  app.use(proxy('/varda-rekisterointi/api', options));
  app.use(proxy('/varda-rekisterointi/hakija/j_spring_cas_security_check', options));
  app.use(proxy('/varda-rekisterointi/hakija/logout', options));
  app.use(proxy('/varda-rekisterointi/hakija/valtuudet', options));
  app.use(proxy('/varda-rekisterointi/hakija/api', options));
  app.use(proxy('/varda-rekisterointi/virkailija/api', options));
  app.use(proxy('/varda-rekisterointi/virkailija/j_spring_cas_security_check', options));
};
