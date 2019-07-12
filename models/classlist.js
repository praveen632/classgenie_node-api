var _ = require('underscore');
var url = require('url');
var fs = require('fs');
var serialize = require('node-serialize');
var config = require('../common/config');
var config_constant = require('../common/config_constant');
var message = require('../assets/json/'+(config.env == 'development' ? 'message' : 'message.min')+'.json');
var mongo_connection = require('../common/mongo_connection');
var md5 = require('../node_modules/js-md5'); 
var _global = require('../common/global');
var listdata = require('../assets/json/'+(config.env == 'development' ? 'classlist' : 'classlist.min')+'.json');
var positiweight = require('../assets/json/'+(config.env == 'development' ? 'positiweight' : 'positiweight.min')+'.json');
var negativeweight = require('../assets/json/'+(config.env == 'development' ? 'negativeweight' : 'negativeweight.min')+'.json');
var chaticon = require('../assets/json/'+(config.env == 'development' ? 'chaticon' : 'chaticon.min')+'.json');
module.exports = {
      
      /**
       * Display listing of resources.
       *
       * @param req, res
       * @return response
       */
      classlist:function (req, res){  	
               res.json(listdata);        
      },

       positivepointweight:function (req, res){   
               res.json(positiweight);        
      },

       negativepointweight:function (req, res){   
               res.json(negativeweight);        
      },
      chaticon:function (req, res){   
               res.json(chaticon);        
      }
    }  