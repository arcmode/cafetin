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
  var controller = function(page, model, params, next) {
    var userId = model.get('_session.userId');
    var user = model.at('users.' + userId);
    var itemsQuery = model.query('items', {userId: userId});
    model.subscribe(user, itemsQuery, function(err) {
      if (err) return next(err);
      model.ref('_page.user', user);
      itemsQuery.ref('_page.items');
      user.increment('visits');
      page.render('day');
    });
  }
  app.get('/day', controller);
  app.enter('/day', enter);
}
