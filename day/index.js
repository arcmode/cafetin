var config = {
  filename: __filename
, scripts: {
    new: require('./new'),
    list: require('./list')
  }
};

module.exports = function(app, options) {
  app.createLibrary(config, options);
};