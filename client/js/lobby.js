(function( Lobby, $, undefined ) {
	"use strict";

	var SOCKET;

	$(window).load(function() {
		$.ajax({
			url: "heartbeat",
			type: "POST",
			success: function() {
				if( !('WebSocket' in window) ) {
					$('.overlay').text('Browser not supported');
					return;
				}

				var sockaddr = document.domain;
				var sockprot = 'ws:';
				if( document.domain == 'localhost' ) {
					sockaddr += ':8001';
				}
				if (document.location.protocol === "https:") {
					sockprot = "wss:";
				}

				SOCKET = new WebSocket(sockprot+"//"+sockaddr+document.location.pathname+"socket");

				$('.overlay').text('Connecting');

				SOCKET.onopen = function(){
					$('.overlay').text('Connected');
				};

				SOCKET.onmessage = function(msg) {
					var msg = JSON.parse(msg.data);

					if( msg.type == "all_games" ) {
						$("#game_list").html(Lobby.template({
							games: msg.games
						}));
					}
				};
			}
		});
	});

	$("button.create").live("click", function() {
		var game_name = $("#input_game_name").val();
		var max_players = $("#select_max_players").val();
		$.ajax({
			url: "create",
			type: "POST",
			data: {
				"name": game_name,
				"max_players": max_players
			}
		});
	});

	$("button.join").live("click", function() {
		var game_name = $(this).attr("game_name");
		$.ajax({
			url: "join",
			type: "POST",
			data: {
				"name": game_name
			}
		});
	});

	$("button.start").live("click", function() {
		$.ajax({
			url: "start",
			type: "POST",
		});
	});

	$(document).ready(function() {
		Lobby.template = Handlebars.compile($("#template-game_list").html());
		Handlebars.registerPartial("game", $("#template-game").html());



		$("#game_list").html(Lobby.template({}));
	});


}(window.Lobby = window.Lobby || {}, jQuery));