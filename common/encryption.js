var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    key = 'afore@#pK@y#@#d1';

 var iv = '1234567890123456';
 var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
 var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);

 /**
 * Common encryption class
 */
 module.exports = {
	encrypt: function(text){
	   var cipher = crypto.createCipher(algorithm,key)
	   var crypted = cipher.update(text,'utf8','hex')
	   crypted += cipher.final('hex');
	   return crypted;
	},
	decrypt: function(text){
	   var decipher = crypto.createDecipher(algorithm,key)
	   var dec = decipher.update(text,'hex','utf8')
	   dec += decipher.final('utf8');
	   return dec;
	},
	encryptnew: function(value){
	    var encrypted = cipher.update(value, 'utf8', 'binary');
			encrypted += cipher.final('binary');
			hexVal = new Buffer(encrypted, 'binary');
			encrypted = hexVal.toString('hex');
			return encrypted;
	   },
	   decryptnew: function(value){
			var decrypted = decipher.update(value, 'hex', 'binary');
				decrypted += decipher.final('binary');
				return decrypted;
	   }
}