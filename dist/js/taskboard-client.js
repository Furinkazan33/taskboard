var socket = io.connect('http://localhost:8080');
var debug = false;
function log (item) { if (debug) { console.log(item); } }


/* Global events initialisations when DOM fully loaded*/
$(function() {
  initDom();

  $('#trash').hide();

  /* Navigation */
  initOnClickNav        ( ".navtab" );

  /* Utils bar */
  initOnClickNew        ( "#btn" );

  /* Tasks interactions */
  initOnClickRestore    ( ".panel .panel-heading .toolbar .restore" );
  initOnClickSave       ( ".panel .panel-heading .toolbar .save" );
  initOnClickToggle     ( ".panel .panel-heading .toolbar .toggle" );
  initOnClickDelete     ( ".panel .panel-heading .toolbar .delete" );
  initOnclickColor      ( ".panel .panel-body .palette .color" );

  initDraggable         ( ".panel" );
});


/* Generate each task in the corresponding col */
function initDom() {
  var inactive = 0;

  /* Utils bar */
  var bar = '<form class="form-inline pull-xs-right">';
        bar += '<input class="title form-control" type="text" placeholder="Titre">';
        bar += '<input class="text form-control" type="textarea" placeholder="Contenu">';
        bar += '<button id="btn" class="btn btn-success-outline" type="button">New</button>';
      bar += '</form>';

  var bar = '<form class="col s12">';
        bar += '<div class="input-field col s2">';
          bar += '<textarea class="materialize-textarea title"></textarea>';
          bar += '<label for="title">Titre</label>';
        bar += '</div>';
        bar += '<div class="input-field col s3">';
          bar += '<textarea class="materialize-textarea text"></textarea>';
          bar += '<label for="text">Contenu</label>';
        bar += '</div>';
        bar += '<button id="btn" class="btn col s1" type="button">New</button>';
      bar += '</form>';

  $("#bar").append(bar);

  /* Content */
  var content = '<div id="tasks" class="tabcontent col s12">';
    var w = Math.floor(12 / data.cols.length);

    for (var i = 0; i < data.cols.length; i++) {
      content += '<div class="col s'+w+'" id="'+data.cols[i]._id+'">';
        content += '<p class="center-align">' + data.cols[i].title +'</p>';
      content += '</div>';
    }
  content += '</div>';
  content += '<div id="trash" class="tabcontent col s12">';
    for (var i = 0; i < data.cols.length; i++) {
      content += '<div class="col s'+w+'" id="'+data.cols[i]._id+'">';
        content += '<p class="center-align">'+data.cols[i].title+'</p>';
      content += '</div>';
    }
  content += '</div>';

  $("#content").append(content);

  /* Tasks */
  for (var i = 0; i < data.tasks.length; i++) {
    var taskJson = data.tasks[i];
    var task = json2dom(taskJson);

    if( taskJson.g_context.active) {
      $("#"+taskJson.g_context.col).append(task);
    }
    else {
      $("#trash #"+taskJson.g_context.col).append(task);
      $('#'+taskJson._id).children(".panel-heading").children(".toolbar").children(".restore").css("visibility", "visible");
      inactive++;
    }
  }

  /* Navigation bar */
    var nav = '';
    nav += '<nav>';
      nav += '<div class="nav-wrapper">';
        nav += '<a href="" class="brand-logo">' + data.title + '</a>';
        nav += '<ul class="right hide-on-med-and-down">';
          nav += '<li>';
            nav += '<a id="#navhome", class="navtab", data-target="#tasks"><i class="material-icons">home</i></a>';
          nav += '</li>';
          nav += '<li>';
            nav += '<a id="#navtrash", class="navtab", data-target="#trash"><i class="material-icons">delete</i></a>';
          nav += '</li>';
          nav += '<li>';
            nav += '<a id="#navrefresh"><i class="material-icons">refresh</i></a>';
          nav += '</li>';
          nav += '<li>';
            nav += '<a href="#!" class="dropdown-button" data-activates="dropdown1"><i class="material-icons">more_vert</i></a>';
          nav += '</li>';
        nav += '</ul>';
      nav += '</div>';
    nav += '</nav>';

    nav += '<ul id="dropdown1" class="dropdown-content">';
      nav += '<li><a href="#!">options</a></li>';
      nav += '<li><a href="#!">options</a></li>';
    nav += '</ul>';

  $("#navigation").append(nav);

  $('.dropdown-button').dropdown({
      hover: false,
      inDuration: 300, outDuration: 225,
      constrain_width: false, gutter: 0, belowOrigin: false, alignment: 'left'
    }
  );
}

/* Returns the json object corresponding to task selector and the wanted options */
function dom2json (selector, options)
{
  var task = $( selector );
  var position = task.position();
  var json = "{ \"_id\": \"" + task.attr('id') + "\"";
  var comma = false;

  if (!options) {
    json += " }";
    return json;
  }

  if (options.indexOf("title") != -1) {
    json += ", \"title\": \""+task.children(".panel-title").text() + "\"";
  }
  if (options.indexOf("text") != -1) {
    json += ", \"text\": \""+task.children('.panel-body').children('.text').val() + "\"";
  }
  if (options.indexOf("geometry") != -1 || options.indexOf("col") != -1 || options.indexOf("colors") != -1) {
    json += ", \"g_context\": { ";
    if (options.indexOf("geometry") != -1) {
      if(comma) { json += ", "; } else { comma = true; }
      var w = task.width();
      var h = task.height();
      json += "\"left\": " + position.left + ", ";
      json += "\"top\": " + position.top + ", ";
      json += "\"width\": " + w + ", ";
      json += "\"height\": " + h + ", ";
      if(task.hasClass("active"))
      {
        json += "\"active\": true";
      }
      else {
        json += "\"active\": false";
      }
    }
    if (options.indexOf("col") != -1) {
      if(comma) { json += ", "; } else { comma = true; }
      json += "\"col\": " + getCol(selector);
    }
    if (options.indexOf("colors") != -1) {
      if(comma) { json += ", "; } else { comma = true; }
      json += "\"colors\": { ";
        json += "\"color1\": \"" + task.children('.panel-heading').css("backgroundColor") + "\", ";
        json += "\"color2\": \"" + task.children('.panel-body').css("backgroundColor") + "\", ";
        json += "\"color3\": \"" + task.children('.panel-heading').css("color") + "\"";
      json += " }";
    }
    json += " }";
  }
  json += " }";

  return JSON.parse(json);
}





/* Returns the dom object corresponding to json task */
function json2dom (taskJson) {
  var colors = data.g_context.task_palette;
  var style = "";

  style = 'height: ' + (taskJson.g_context.visible ? taskJson.g_context.height : data.g_context.task.hiddenHeight) + "px";
  style += '; width: ' + data.g_context.task.width+'px; position: relative; left: ' + data.g_context.task.left+'px;';
  style += 'top: ' + data.g_context.task.top+'px';

  var card = '';
  card += '<div id="'+taskJson._id+'" class="panel panel-default ui-draggable ui-draggable-handle card lighten-3';
  if(taskJson.g_context.active) { card += ' active'; }
  card += '" style="'+style+'">';

  style = "background-color: "+taskJson.g_context.colors.color1+"; color: "+taskJson.g_context.colors.color3;
  style += taskJson.g_context.visible ? "" : "; height: "+data.g_context.task.headHeight+"px";

    card += '<div class="panel-heading card-action lighten-2" style="'+style+'">';
      card += '<div class="panel-title">'+taskJson.title+'</div>';
      card += '<div class="toolbar">';
        card += '<i class="restore tiny material-icons" style="visibility: hidden">restore</i>';
        card += '<i class="save tiny material-icons">save</i>';
        card += '<i class="toggle tiny material-icons">call_received</i>';
        card += '<i class="delete tiny material-icons">delete</i>';
      card += '</div>';
    card += '</div>';

    style = "background-color: "+taskJson.g_context.colors.color2 + "; background-color: "+taskJson.g_context.colors.color2;
    style += taskJson.g_context.visible ? "" : "; display: none";

    card += '<div class="panel-body card-content" style="'+style+'">';
    style = "background-color: "+taskJson.g_context.colors.color2 + "; color: " + taskJson.g_context.colors.color3;
      card += '<textarea class="text" style="'+style+'">' + taskJson.text + '</textarea>'


    card += '<div class="palette">';
      for (var i = 0; i < colors.length; i++) {
        card += '<div class="color">';
          card += '<div class="color1" style="background: '+colors[i].color1+';color:'+colors[i].color3+'"></div>';
          card += '<div class="color2" style="background: '+colors[i].color2+'"></div>';
        card += '</div>';
      }
    card += '</div>';
  card += '</div>';

  return card;
}

/* Returns the col identified by the center position of the task */
function getCol (selector) {
  var total = parseInt($('body').css('margin-left'));
  var cols = $(".col");

  for (var i = 0; i < cols.length; i++) {
    total += $('#'+i).width();

    if (total > $(selector).position().left + $(selector).width()/2) {
      break;
    }
  }
  if (i >= cols.length) { i-- ; }

  return i;
}

/* Returns the position centered in the corresponding col */
function centerPosition(selector) {
  //return { "top": g_context_default.panel.top, "left": g_context_default.task.left };

  var col = getCol(selector);
  var cols = $(".col");
  var bodyleft = parseInt($('body').css('margin-left'));
  var position = $(selector).position();

  position.left = bodyleft;

  for (var i = 0; i < col; i++) {
    position.left += $('#'+i).width() + parseInt($('#'+i).css("border-left-width"));
  }
  position.left += ($('#'+i).width() - $(selector).width())/2;
  log(position);
  return position;
}

/* Create a json object task and upsate the position so that it is col centered */
function centertask(selector) {
  var centertask = dom2json(selector, ["title", "text", "geometry", "col"]);
  var position = centerPosition(selector)
  centertask.g_context.left = position.left;
  centertask.g_context.top = position.top;

  return centertask;
}

/* Navigation tabs */
function initOnClickNav (selector) {
  $(selector).click(function (e) {
    e.preventDefault();
    var target = $(this).attr('data-target');

    log("E:socket_nav " + target);
    socket.emit('socket_nav', target);
  });
}

/* Top bar button New */
function initOnClickNew (selector) {
  $( selector ).click(function() {
    var n = $(".col:first > .panel").length + 1;
    var json = {  "title": $( "#bar .title").val(),
                  "text": $( "#bar .text").val(),
                  "position": n };
    log("E:socket_new"); log(json);
    socket.emit('socket_new', json);
  });
}

/* Toolbar button restore */
function initOnClickRestore (selector) {
  $( selector ).click(function() {
    var taskId = $(this).parent().parent().parent().attr('id');

    log("E:socket_restore " + taskId);
    socket.emit('socket_restore', taskId);
  });
}

/* Toolbar button save */
function initOnClickSave (selector) {
  $( selector ).click(function() {
    var id = $(this).parent().parent().parent().attr('id');
    var task = dom2json('#'+id, ["title", "text"]);
    log("E:socket_update"); log(task);
    socket.emit('socket_update', { "task": task, "tasks": [] } );
  });
}

/* Toolbar button toggle */
function initOnClickToggle (selector)  {
  $( selector ).click(function() {
    var taskId = $(this).parent().parent().parent().attr('id');
    log("E:socket_toggle " + taskId);
    socket.emit('socket_toggle', taskId);
  });
}

/* Toolbar button delete */
function initOnClickDelete (selector) {
  $( selector ).click(function() {
    var id = $(this).parent().parent().parent().attr('id');
    log("E:socket_delete " + id);
    socket.emit('socket_delete', id);
  });
}

/* Changing task colors (palette) */
function initOnclickColor (selector) {
  $( selector ).click(function() {
    var color1 = $(this).children('.color1').css("background-color");
    var color2 = $(this).children('.color2').css("background-color");
    var color3 = $(this).children('.color1').css("color");

    var taskbody = $(this).parent().parent();
    var task = taskbody.parent();
    task.children('.panel-heading').css({backgroundColor: color1, color: color3});
    taskbody.css({backgroundColor: color2});
    taskbody.children('.text').css({backgroundColor: color2, color: color3})

    var json = dom2json('#'+task.attr('id'), ["colors"]);

    log("E:socket_update"); log(json);
    socket.emit('socket_update', { "task": json, "tasks": [] } );
  });
}

/* To limit the number of socket.emit */
function limitEmissions(func, milliseconds) {
var lastCall = 0;
return function () {
    var now = Date.now();
    if (lastCall + milliseconds < now) {
        lastCall = now;
        return func.apply(this, arguments);
    }
  };
}

/* When moving and stopping task */
function initDraggable (selector) {
  $( selector ).draggable({
      drag: limitEmissions(function(event, ui) {
        var id = $(this).attr('id');
        var taskJson = centertask('#'+id);

        log("E:socket_update"); log(taskJson);
        socket.emit('socket_update', { "task": taskJson, "tasks": [] });
      }, 10),
      stop: function(event, ui) {
        var id = $(this).attr('id');
        var taskJson = centertask('#'+id);
        var tasks = null;

        $('#' + id).css( { left:data.g_context.task.left, top:data.g_context.task.top } );
        if(taskJson.g_context.active)
        {
          $( "#"+taskJson.g_context.col).append($('#' + id));
          tasks = $( "#"+taskJson.g_context.col).children(".panel");
        }
        else {
          $( "#trash #"+taskJson.g_context.col).append($('#' + id));
          tasks = $( "#trash #"+taskJson.g_context.col).children(".panel");
        }
        log(tasks);

        var tasksArray = [];
        for (var i = 0; i < tasks.length; i++) {
          tasksArray.push({ "id": tasks[i].id, "position": i });
        }
        log(tasksArray);

        log("E:socket_update"); log(taskJson);
        socket.emit('socket_update', { "task": taskJson, "tasks": tasksArray });
      },
      /* Not draggable by clicking on the content or the toolbar */
      cancel: '.panel-body, .toolbar'
  });
}


/* Navigate to the tab */
socket.on('socket_nav', function(selector) {
  log("R:socket_nav " + selector);
  $('.tabcontent').hide();
  $(selector).show();
});

/* Update position and text received */
socket.on('socket_update', function(taskJson) {
  log("R:socket_update"); log(taskJson);
  var task = $( "#" + taskJson._id );
  //task.css( { left:data.g_context.task.left, top:data.g_context.task.top } );

  if (taskJson.text != null) {
    task.children(".panel-body").children(".text").val(taskJson.text)
  }
  if (taskJson.g_context != null && taskJson.g_context.colors != null) {
    task.children('.panel-heading').css({backgroundColor: taskJson.g_context.colors.color1, color: taskJson.g_context.colors.color3});
    task.children(".panel-body").css({backgroundColor: taskJson.g_context.colors.color2});
    task.children(".panel-body").children('.text').css({backgroundColor: taskJson.g_context.colors.color2, color: taskJson.g_context.colors.color3})
  }
  if(taskJson.g_context.active) {
    $( "#"+taskJson.g_context.col).append(task);
  }
  else {
    $( "#trash #"+taskJson.g_context.col).append(task);
  }
});

/* Restore task */
socket.on('socket_restore', function(id) {
  log("R:socket_restore " + id);
  var task = $( '#'+id);

  task.addClass("active");
  task.children(".panel-heading").children(".toolbar").children(".restore").css("visibility", "hidden");
  var colId = task.parent().attr('id');
  $("#tasks #"+colId).append(task);

  var n = $('ul.nav li span.badge').text();
  $('ul.nav li span.badge').text(n - 1);
});

/* Delete task */
socket.on('socket_delete', function(id) {
  log("R:socket_delete " + id);
  var task = $( '#'+id);

  if(task.hasClass("active"))
  {
    task.removeClass("active");
    task.children(".panel-heading").children(".toolbar").children(".restore").css("visibility", "visible");
    var colId = task.parent().attr('id');
    $("#trash #"+colId).append(task);
    var n = $('ul.nav li span.badge').text();
    $('ul.nav li span.badge').text(parseInt(n) + 1);
  }
  else {
    task.remove();
    var n = $('ul.nav li span.badge').text();
    $('ul.nav li span.badge').text(n - 1);
  }
});

/* Toggle task content */
socket.on('socket_toggle', function(json) {
  log("R:socket_toggle " + json);

  if(json.visible == true) {
    log("show");
    $( '#' + json.id ).children(".panel-body").show(300);
    $( '#' + json.id ).height(json.height);
  }
  else {
    log("hide");
    log($( '#' + json.id ));
    var headHeight = $( '#' + json.id ).children(".panel-heading").height();
    $( '#' + json.id ).children(".panel-body").hide(300);
    $( '#' + json.id ).height(data.g_context.task.hiddenHeight);
    $( '#' + json.id ).children(".panel-heading").height(headHeight);
  }
});

/* Create a new task and append to the #tasks div */
socket.on('socket_new', function(taskJson) {
  log("R:socket_new"); log(taskJson);

  /* Events initialisations */
  $("#tasks .col:first").append(json2dom(taskJson));

  initOnClickRestore  ( "#" + taskJson._id + " .panel-heading .toolbar .restore" );
  initOnClickSave     ( "#" + taskJson._id + " .panel-heading .toolbar .save"    );
  initOnClickToggle   ( "#" + taskJson._id + " .panel-heading .toolbar .toggle"  );
  initOnClickDelete   ( "#" + taskJson._id + " .panel-heading .toolbar .delete"  );
  initOnclickColor    ( "#" + taskJson._id + " .panel-body .palette .color"      );

  initDraggable       ( "#" + taskJson._id                                       );
});
