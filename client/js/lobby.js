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
				$('.overlay').hide();

				SOCKET.onopen = function(){
					$('.overlay').text('Connected');
				};

				SOCKET.onmessage = function(msg) {
					var msg = JSON.parse(msg.data);

					if( msg.type == "all_games" ) {
						$(".game_list").html(Lobby.template.game_list({
							games: msg.games
						}));
					} else if ( msg.type == "game_start" ) {
						Lobby.token = msg.token;
						$('.game_list').addClass('not-shown');
						$('.current_game').delay(800).queue(function(next) {
							$(this).addClass('started');

							var addr = document.domain;
							var prot = document.location.protocol;
							if( document.domain == 'localhost' ) {
								addr += ':8000';
							}
							addr = prot + "//" + addr + "/#" + Lobby.token;

							$("button.launch").magnificPopup({
								items: {
									src: addr,
									type: "iframe",
									closeOnBgClick: false,
								}
							});
							next();
						});
					} else if ( msg.type == "current_game" ) {
						$(".game_info").html(Lobby.template.current_game({
							game: msg.game
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

		return false;
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

	$("button.ready").live("click", function() {
		$.ajax({
			url: "ready",
			type: "POST",
		});
	});

	$(document).ready(function() {
		Lobby.template = {};

		Lobby.template.game_list = Handlebars.compile($("#template-game_list").html());
		Lobby.template.current_game = Handlebars.compile($("#template-current_game").html());
		// Handlebars.registerPartial("game", $("#template-game").html());

		$(".game_list").html(Lobby.template.game_list({}));
		$(".game_info").html(Lobby.template.current_game({}));
	});


}(window.Lobby = window.Lobby || {}, jQuery));