var config = {
  filename: __filename
, scripts: {
    new: require('./new'),
    list: require('./list')
  }
};

exports.lib = function(app, options) {
  app.createLibrary(config, options);
};

exports.route = function(app) {
  var enter = function(model) {
    var links = [
      {"title": "New", "url": "#new"},
      {"title": "List", "url": "#list"}
    ];
    model.set('_page.sidebar.day', links)
  };
  var today = function(page, model, params, next) {
    var userId = model.get('_session.userId');
    var user = model.at('users.' + userId);
    model.subscribe(user, function(err) {
      if (err) return next(err);
      model.ref('_page.user', user);
      page.render('today');
    });
  }
  var days = function(page, model, params, next) {
    var userId = model.get('_session.userId');
    var user = model.at('users.' + userId);
    var itemsQuery = model.query('items', {userId: userId});
    model.subscribe(user, itemsQuery, function(err) {
      if (err) return next(err);
      model.ref('_page.user', user);
      itemsQuery.ref('_page.items');
      page.render('days');
    });
  }
  app.get('/days/today', today);
  app.get('/days', days);
  app.enter('/days/*', enter);
}
