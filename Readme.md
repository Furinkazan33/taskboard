A client-side javascript file is provided using materialize, jquery, jquery-ui and socket.io.
Socket.io is used so that everything done on a navigator is sync on other navigators.
Feel free to ask for help : furinkazanspirit@free.fr

Installation
--------------

    npm install taskboard

Dependencies :
--------------

    my-mongo

How-to use :
--------------

In your app.js (here i use socket.io) :

    app.use('/taskboard',  express.static(__dirname + '/node_modules/taskboard/dist'));
    var taskBoard = require ('taskboard')(optional_config_file);
    //see node_modules/taskboard/config.json

    app.get('/', function (req, res) {
      taskBoard.getTasks(function (g_context, cols, tasks) {
        res.render('index', { "data": { "title": "TaskBoard",
                                        "g_context": g_context,
                                        "cols": cols,
                                        "tasks": tasks } });
      });
    });
    io.sockets.on('connection', function (socket) {
      socket.on('socket_nav', function (tab) {
        socket.broadcast.emit('socket_nav', tab);
      });
      socket.on('socket_update', function (json) {
        taskBoard.updateCols(json.tasks, function() {});

        taskBoard.updateTask(json.task, function() {
          socket.broadcast.emit('socket_update', json.task);
        });
      });
      socket.on('socket_delete', function (id) {
        taskBoard.deleteTask(id, function() {
          socket.emit('socket_delete', id);
          socket.broadcast.emit('socket_delete', id);
        });

      });
      socket.on('socket_new', function (json) {
        taskBoard.newTask(json, function(task) {
          socket.emit('socket_new', task);
          socket.broadcast.emit('socket_new', task);
        })
      });
      socket.on('socket_toggle', function (id) {
        taskBoard.toggleTask(id, function(json) {
          socket.emit( 'socket_toggle', json );
          socket.broadcast.emit( 'socket_toggle', json );
        });
      });
    })



Example with materialize, jquery and Jade :

    link(rel='stylesheet', href='https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.5/css/materialize.min.css')
    link(rel='stylesheet', href='http://fonts.googleapis.com/icon?family=Material+Icons')
    link(rel='stylesheet', href='/taskboard/css/taskboard.css')

    script(src='https://ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js')
    script(src='https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.5/js/materialize.min.js')
    script(src='https://code.jquery.com/ui/1.12.0-beta.1/jquery-ui.min.js')
    script(src='https://cdn.socket.io/socket.io-1.4.5.js')
    script(src='/taskboard/js/taskboard-client.js')

    script(type="text/javascript").
      var data = !{JSON.stringify(data)};

    body
      h1= title

      div#navigation

      div#bar(class="row")

      div#content(class="row")

TODO :
--------------

- Customizable behaviors
