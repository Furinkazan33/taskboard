var taskboard = config => {

  /* Load default configuration file */
  if(!config) { var config = require ('./config.json'); }

  const mongo = require ('my-mongo'),
      mongo = new mongo (config.mongo.url, config.mongo.collection),
      ObjectID = require ('mongodb').ObjectID;

  this.debug = false;
  this.g_context = config.g_context;
  this.cols = config.cols;

  /* Not yet used */
  this.behavior = config.behavior;

  function log(item) {
    if (debug) {
      console.log(item);
    }
  }

  this.setDebug = function (bool) {
    this.debug = bool;
  }

  /* Compare cols and positions in col */
  let compColPos = (a, b) => {
    return a.g_context.col > b.g_context.col ? 
      1 : a.g_context.col == b.g_context.col ?
      (a.g_context.position > b.g_context.position ? 1 : -1) : 
      -1
  }

  this.getTasks = callback => {
      mongo.find( { "type": "task" }, {}, (err, results) => {
        var tasks = results.sort(compColPos);
        log(tasks);

        callback(this.g_context, this.cols, tasks);
      }.bind(this));
  }

  /* Update tasks positions */
  this.updateCols = (tasks, callback) => {
    tasks.forEach((task, index) => {
      let taskId = task.id
      mongo.update( { "type": "task", "_id": new ObjectID(taskId) }, { "g_context.position": task.position }, (err, results) => {
        log(results.result);
      });
    }
  }

  /* Update what is present in json object */
  this.updateTask = (task, callback) => {
    mongo.findById( task._id, (err, result) => {
      let comma = false,
          update = "";
      
      if (task.text != null) {
        if (comma) { update += ", "; } else { comma = true; }
        update += `"text": "${task.text}"`;
      }
      if (task.g_context != null) {
        if (task.g_context.width != null) {
          if (comma) { update += ", "; } else { comma = true; }
          update += "\"g_context.width\": "+task.g_context.width;
        }
        if (task.g_context.left != null) {
          if (comma) { update += ", "; } else { comma = true; }
          update += "\"g_context.left\": "+task.g_context.left;
        }
        if (task.g_context.top != null) {
          if (comma) { update += ", "; } else { comma = true; }
          update += "\"g_context.top\": "+task.g_context.top;
        }
        if (task.g_context.col != null) {
          if (comma) { update += ", "; } else { comma = true; }
          update += "\"g_context.col\": "+task.g_context.col;
        }
        if (task.g_context.colors != null) {
          if (task.g_context.colors.color1 != null) {
            if (comma) { update += ", "; } else { comma = true; }
            update += "\"g_context.colors.color1\": \""+task.g_context.colors.color1+"\"";
          }
          if (task.g_context.colors.color2 != null) {
            if (comma) { update += ", "; } else { comma = true; }
            update += "\"g_context.colors.color2\": \""+task.g_context.colors.color2+"\"";
          }
          if (task.g_context.colors.color3 != null) {
            if (comma) { update += ", "; } else { comma = true; }
            update += "\"g_context.colors.color3\": \""+task.g_context.colors.color3+"\"";
          }
        }
        if(result.g_context.visible == true) {
          if (task.g_context.height != null) {
            if (comma) { update += ", "; } else { comma = true; }
            update += "\"g_context.height\": "+task.g_context.height;
          }
        }
      }

      log(JSON.parse("{" + update + "}"));

      if (update != "") {
        mongo.update( { "type": "task", "_id": new ObjectID(task._id) }, JSON.parse("{ " + update + " }"), function(err, results) {
          log(results.result);
        });
      }

      callback();
    });
  }

  /* Either move to trash (set indicator "active" to false) or delete */
  this.deleteTask = function(taskId, callback) {
    mongo.findById (taskId, function(err, task) {
      if (task && task.g_context.active)
      {
        mongo.update ({ "type": "task", "_id": new ObjectID(taskId) }, { "g_context.active": false }, function (err, result) {
          log(result.result);
        });
      }
      else {
        mongo.remove ( { "type": "task", "_id": new ObjectID(taskId) }, function (err, result) {
          log(result.result);
        });
      }
      callback();
    });
  }

  /* Set indicator "active" to true */
  this.restoreTask = function(taskId, callback) {
    mongo.findById (taskId, function(err, task) {
      if (task && !task.g_context.active)
      {
        mongo.update ({ "type": "task", "_id": new ObjectID(taskId) }, { "g_context.active": true }, function (err, result) {
          log(result.result);
        });
      }
      callback();
    });
  }

  /* Create a new task from json */
  this.newTask = function(json, callback) {
    var task = { "type": "task",
                  "title": json.title,
                  "text": json.text,
                  "g_context": this.g_context.task  };
    task.g_context.position = json.position;

    mongo.insert (task, function (err, result) {
      log(result);
      log(task);

      callback(task);
    });
  }

  /* Toggle indicator "visible" */
  this.toggleTask = function(id, callback) {
    mongo.findById( id, function(err, task) {
      log(task);

      if(!task || !task.g_context) { return; }

      var json = { "id": id, "visible": true, "height": task.g_context.height };

      if(task.g_context.visible) {
        json.visible = false;
        json.height = 50;
      }

      mongo.update (  { "type": "task", "_id": new ObjectID(id) }, { "g_context.visible": json.visible }, function(err, result) {
        log(json);

        callback(json);
      });
    });
  }

  /* taskboard module */
  return this;
}

module.exports = taskboard;
