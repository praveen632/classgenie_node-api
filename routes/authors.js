/**
 * Get the author page
 */
 module.exports.list = function (req, res){
 	 req.app.get('connection').query("SELECT * FROM authors ORDER BY id DESC", function(err, rows, fields){
        if(err){
           req.app.get('global').fclog("Error Selecting : %s ",err);
        }
        res.render('author/list_authors', {
	        page_title: 'Author listing',
            data:rows
	    });  
    });
 }

 /**
  * Show author add page
  */
 module.exports.add = function (req, res){
    res.render('author/add_author',{page_title:"Add Author - Node.js"});
 }

 /**
  * Save author
  * @param name, bio
  */
 module.exports.save = function(req, res){
    var input = JSON.parse(JSON.stringify(req.body));
     req.app.get('connection').query("INSERT into authors SET name=?, bio=?", [input.name, input.bio], function(err, rows, fields){
         if(err){
           req.app.get('global').fclog("Error Adding : %s ",err);
         }
         res.redirect('/authors');
     });
 }

 /**
  * Show author 
  * @params id
  */
  module.exports.edit = function(req, res){
     var id = req.params.id;
     req.app.get('connection').query("SELECT * FROM authors WHERE id=?", [id], function(err, rows, fields){
        if(err){
           req.app.get('global').fclog("Error Selecting : %s ",err);
        }
        res.render('author/edit_authors', {
	        page_title: 'Edit Author - Node.js',
            data:rows
	    });  
    });
  }

  /**
   * Update author 
   * @params id
   */
   module.exports.save_edit = function(req, res){
   	  var id = req.params.id;
   	  var input = JSON.parse(JSON.stringify(req.body));
   	  req.app.get('connection').query("UPDATE authors SET name=?, bio=? WHERE id=?", [input.name, input.bio, id], function(err, rows, fields){
         if(err){
           req.app.get('global').fclog("Error Updating : %s ",err);
         }
         res.redirect('/authors');
      });
   }

   /**
    * Delete author
    * @params id
    */
    module.exports.delete_author = function(req, res){
       var id = req.params.id; 
        req.app.get('connection').query("DELETE FROM authors WHERE id=?", [id], function(err, rows, fields){
         if(err){
           req.app.get('global').fclog("Error Deleting : %s ",err);
         }
         res.redirect('/authors');
       });
    }