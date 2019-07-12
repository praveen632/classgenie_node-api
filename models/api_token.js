var url = require('url');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');

module.exports = {      
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
      tokengen: function (req, res){
              mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(req.query)}, 'api_url');
              var query_str = url.parse(req.url,true).query;
                var output={};
                output.token = config.token;
                output.status = message.success;
                output.comments = message.success;
                mongo_connection.save({request_ip:req.ip, request_url:req.originalUrl, request_method:'GET', text:serialize.serialize(output)}, 'api_url');
                res.json(output);
          
      }
   }