WebSvr: Version 0.012
==============
Lincense: MIT

version: 0.020
--------------
- Filter: A Request will mapping all the filters first, and then pass to the Handler;
- Handler: When a request matched a handler, it will returned, so only one handler will be matched;
- Session: Stored in file, with JSON format;
- Form Data: Support upload files, integrate https://github.com/felixge/node-formidable/

version: 0.005
--------------
- MIME: Suppor mime header, integrate https://github.com/broofa/node-mime

Sample:
--------------

    //Start WebSVr, runnting at parent folder, default port is 8054, directory browser enabled;
    //Trying at: http://localhost:8054
    var webSvr = new WebSvr({root:"./../"});
    webSvr.start();


    var	fs = require("fs"),
        querystring = require("querystring");


    /*
    Filter: test/* => (session validation function);
      parse:parse the post data and stored to req.body;
      session: init the session and stored in req.session; 
    */
    webSvr.filter(/test\/[\w\.]+/, function(req, res){
      //It's not index.htm/login.do, do the session validation
      if(req.url.indexOf("index.htm") < 0 && req.url.indexOf("login.do") < 0){
        !req.session.get("username") && res.end("You must login, first!");
      }

      //Link to next filter
      req.filter.next(req, res);
    }, {parse: true, session: true});


    /*
    Handler: login.do => (validate the username & password)
      username: admin
      password: 12345678
    */
    webSvr.url(/login.do/, function(req, res){
      //TODO: Add an parameter to auto-complete querystring.parse(req.body);
      var qs = querystring.parse(req.body);
      if(qs.username == "admin" && qs.password == "12345678"){
        //Put key/value pair in session
        //TODO: Support put JSON object directly
        req.session.set("username", qs.username, function(session){
          //TODO: Add req.redirect / req.forward functionalities;
          res.writeHead(200, {"Content-Type": "text/html"});
          res.writeFile("/test/setting.htm");
        });
      }else{
        res.writeHead(401);
        res.end("Wrong username/password");
      }
    });


    /*
    Uploader: upload.do => (receive handler)
    */
    webSvr.file(/upload.do/, function(req, res){
      res.writeHead(200, {"Content-Type": "text/plain"});
      //Upload file is stored in req.files
      //form fields is stored in req.body
      res.write(JSON.stringify(req.body));
      res.end(JSON.stringify(req.files));
    });


    /*
    Simple redirect API:
    */
    //Mapping "combine" to tool/Combine.js, trying at: http://localhost:8054/combine
    webSvr.url(/combine/, ["svr/tool/Combine.js"]);
    //Mapping "hello" to a string, trying at http://localhost:8054/hello
    webSvr.url(/hello/, "Hello WebSvr!");
    //Mapping "post" and parse the post in the request, trying at: http://localhost:8054/post
    webSvr.post(/post/, function(req, res){
      res.writeHead(200, {"Content-Type": "text/html"});
      //Need session support
      res.write("You username is " + req.session.get("username"));
      res.write('<form action="" method="post"><input name="input" /></form><br/>');
      res.end('Received : ' + req.body);
    }, {session: true});