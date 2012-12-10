/*
Http Filter: Execute all the rules that matched,
Filters will be always called before a handler. 
*/
var Filter = {
  //filter list
  filters: [],
  
  /*
  filter: add a new filter
  expression: string/regexp [optional]
  handler:    function      [required]
  options:    object        [optional]
  */
  filter: function(expression, handler, options) {
    //The first parameter is Function => (handler, options)
    if (expression.constructor == Function) {
      options = handler;
      handler = expression;
      expression = null;
    }

    var mapper = new Mapper(expression, handler, options);
    Filter.filters.push(mapper);
  },

  /*
  file receiver: it's a specfic filter,
  this filter should be always at the top of the filter list
  */
  file: function(expression, handler, options) {
    var mapper = new Mapper(expression, handler, {file: true}); 
    //insert at the top of the filter array
    Filter.filters.splice(0, 0, mapper);
  }
};

/*
Filter Chain
*/
var FilterChain = function(cb, req, res) {
  var self = this;

  self.idx = 0;
  self.cb = cb;

  self.req = req;
  self.res = res;
};

FilterChain.prototype = {
  next: function() {
    var self = this,
        req  = self.req,
        res  = self.res;

    var mapper = Filter.filters[self.idx++];

    //filter is complete, execute callback;
    if (!mapper) return self.cb && self.cb();

    /*
    If not Matched go to next filter
    If matched need to execute the req.next() in callback handler,
    e.g:
    webSvr.filter(/expression/, function(req, res) {
      //filter actions
      req.next(req, res);
    }, options);
    */
    if (mapper.match(req)) {
      console.log("filter matched", self.idx, mapper.expression, req.url);

      //filter matched, parse the request and then execute it
      Parser(req, res, mapper);
    }else{
      //filter not matched, validate next filter
      self.next();
    }
  }
};