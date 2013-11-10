
exports.remove = function(e) {
  var item = e.get(':item');
  this.model.parent(2).del('items.' + item.id);
};