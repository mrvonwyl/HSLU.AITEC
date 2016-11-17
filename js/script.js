$(document).ready(function(){
	
	// Run the init method on document ready:
	chat.init();
	
});
var chat = {
	
	// data holds variables for use in the class:
	
	data : {
		lastID 		: 0,
		noActivity	: 0
	},
	
	// Init binds event listeners and sets up timers:
	
	init : function(){
		// Converting the #chatLineHolder div into a jScrollPane,
		// and saving the plugin's API in chat.data:
		
		chat.data.jspAPI = $('#chatLineHolder').jScrollPane({
			verticalDragMinHeight: 12,
			verticalDragMaxHeight: 12
		}).data('jsp');
		
		// We use the working variable to prevent
		// multiple form submissions:
		
		var working = false;
		
		// Logging a person in the chat:
		
		$('#loginForm').submit(function(){
			
			if(working) return false;
			working = true;
			
			// Using our chatPOST wrapper function
			// (defined in the bottom):
			
			$.chatPOST('login',$(this).serialize(),function(r){
				working = false;
				
				if(r.error){
					chat.displayError(r.error);
				}
				else chat.login(r.name,r.gravatar);

				chat.getAllUsers();
			});
			
			return false;
		});
		
		$('#registerForm').submit(function(){
			
			if(working) return false;
			working = true;
			
			// Using our chatPOST wrapper function
			// (defined in the bottom):
			
			$.chatPOST('register',$(this).serialize(),function(r){
				working = false;
				
				if(r.error){
					chat.displayError(r.error);
				}
				else{
					$('#registerForm').fadeOut(function(){
						$('#loginForm').fadeIn();
						$('#registerLink').fadeIn();
					});
				}
			});
			
			return false;
		});

		// Submitting a new chat entry:
		
		$('#submitForm').submit(function(){
			
			var text = $('#chatText').val();
			
			if(text.length == 0){
				return false;
			}
			
			if(working) return false;
			working = true;
			
			// Assigning a temporary ID to the chat:
			var tempID = 't'+Math.round(Math.random()*1000000),
				params = {
					id			: tempID,
					author		: chat.data.name,
					gravatar	: chat.data.gravatar,
					text		: text.replace(/</g,'&lt;').replace(/>/g,'&gt;')
				};

			// Using our addChatLine method to add the chat
			// to the screen immediately, without waiting for
			// the AJAX request to complete:
			
			chat.addChatLine($.extend({},params));
			
			// Using our chatPOST wrapper method to send the chat
			// via a POST AJAX request:
			
			$.chatPOST('submitChat',$(this).serialize(),function(r){
				working = false;
				
				$('#chatText').val('');
				$('div.chat-'+tempID).remove();
				
				params['id'] = r.insertID;
				chat.addChatLine($.extend({},params));
			});
			
			return false;
		});


		$('#registerLink').click(function(){
			$(this).fadeOut();
			$('#loginForm').fadeOut(function(){
				$('#registerForm').fadeIn();
			});
		});

		
		// Logging the user out:
		
		$('a.logoutButton').live('click',function(){
			
			$('#chatTopBar > span').fadeOut(function(){
				$(this).remove();
			});
			
			$('#admin').fadeOut();
			$('#submitForm').fadeOut(function(){
				$('#loginForm').fadeIn();
				$('#registerLink').fadeIn();
			});
			
			$.chatPOST('logout');
			chat.getAllUsers();
			
			return false;
		});
		
		// Checking whether the user is already logged (browser refresh)
		
		$.chatGET('checkLogged',function(r){
			if(r.logged){
				chat.login(r.loggedAs.name,r.loggedAs.gravatar);
			}
		});

		chat.getAllUsers();

		// Self executing timeout functions
		
		(function getChatsTimeoutFunction(){
			chat.getChats(getChatsTimeoutFunction);
		})();
		
		(function getUsersTimeoutFunction(){
			chat.getUsers(getUsersTimeoutFunction);
		})();
		
		(function getAllUsersTimeoutFunction(){
			chat.getAllUsersTimeout(getAllUsersTimeoutFunction);
		})();
	},

	// The login method hides displays the
	// user's login data and shows the submit form
	
	login : function(name,gravatar){
		chat.data.name = name;
		chat.data.gravatar = gravatar;
		$('#chatTopBar').html(chat.render('loginTopBar',chat.data));
		
		$('#registerForm').fadeOut();
		$('#registerLink').fadeOut();
		$('#loginForm').fadeOut(function(){
			$('#submitForm').fadeIn();
			$('#chatText').focus();

			$.chatGET('isAdmin', function(r){
				if(r == 1){
					$('#admin').fadeIn();
				}
			});
		});
		
	},
	
	// The render method generates the HTML markup 
	// that is needed by the other methods:
	
	render : function(template,params){
		
		var arr = [];
		switch(template){
			case 'loginTopBar':
				arr = [
				'<span><img src="',params.gravatar,'" width="23" height="23" />',
				'<span class="name">',params.name,
				'</span><a href="" class="logoutButton rounded">Logout</a></span>'];
			break;
			
			case 'chatLine':
				arr = [
					'<div class="chat chat-',params.id,' rounded"><span class="gravatar"><img src="',params.gravatar,
					'" width="23" height="23" onload="this.style.visibility=\'visible\'" />','</span><span class="author">',params.author,
					':</span><span class="text">',params.text,'</span><span class="time">',params.time,'</span></div>'];
			break;
			
			case 'user':
				arr = [
					'<div class="user" title="',params.name,'"><img src="',
					params.gravatar,'" width="30" height="30" onload="this.style.visibility=\'visible\'" /></div>'
				];
			break;
		}
		
		// A single array join is faster than
		// multiple concatenations
		
		return arr.join('');
		
	},
	
	// The addChatLine method ads a chat entry to the page
	
	addChatLine : function(params){
		
		// All times are displayed in the user's timezone
		
		var d = new Date();
		if(params.time) {
			
			// PHP returns the time in UTC (GMT). We use it to feed the date
			// object and later output it in the user's timezone. JavaScript
			// internally converts it for us.
			
			d.setUTCHours(params.time.hours,params.time.minutes);
		}
		
		params.time = (d.getHours() < 10 ? '0' : '' ) + d.getHours()+':'+
					  (d.getMinutes() < 10 ? '0':'') + d.getMinutes();
		
		var markup = chat.render('chatLine',params),
			exists = $('#chatLineHolder .chat-'+params.id);

		if(exists.length){
			exists.remove();
		}
		
		if(!chat.data.lastID){
			// If this is the first chat, remove the
			// paragraph saying there aren't any:
			
			$('#chatLineHolder p').remove();
		}
		
		// If this isn't a temporary chat:
		if(params.id.toString().charAt(0) != 't'){
			var previous = $('#chatLineHolder .chat-'+(+params.id - 1));
			if(previous.length){
				previous.after(markup);
			}
			else chat.data.jspAPI.getContentPane().append(markup);
		}
		else chat.data.jspAPI.getContentPane().append(markup);
		
		// As we added new content, we need to
		// reinitialise the jScrollPane plugin:
		
		chat.data.jspAPI.reinitialise();
		chat.data.jspAPI.scrollToBottom(true);
		
	},
	
	// This method requests the latest chats
	// (since lastID), and adds them to the page.
	
	getChats : function(callback){
		$.chatGET('getChats',{lastID: chat.data.lastID},function(r){
			
			for(var i=0;i<r.chats.length;i++){
				chat.addChatLine(r.chats[i]);
			}
			
			if(r.chats.length){
				chat.data.noActivity = 0;
				chat.data.lastID = r.chats[i-1].id;
			}
			else{
				// If no chats were received, increment
				// the noActivity counter.
				
				chat.data.noActivity++;
			}
			
			if(!chat.data.lastID){
				chat.data.jspAPI.getContentPane().html('<p class="noChats">No chats yet</p>');
			}
			
			// Setting a timeout for the next request,
			// depending on the chat activity:
			
			var nextRequest = 1000;
			
			// 2 seconds
			if(chat.data.noActivity > 3){
				nextRequest = 2000;
			}
			
			if(chat.data.noActivity > 10){
				nextRequest = 5000;
			}
			
			// 15 seconds
			if(chat.data.noActivity > 20){
				nextRequest = 15000;
			}
		
			setTimeout(callback,nextRequest);
		});
	},
	
	// Requesting a list with all the users.
	
	getUsers : function(callback){
		$.chatGET('getUsers',function(r){
			
			var users = [];
			
			for(var i=0; i< r.users.length;i++){
				if(r.users[i]){
					users.push(chat.render('user',r.users[i]));
				}
			}
			
			var message = '';
			
			if(r.total<1){
				message = 'No one is online';
			}
			else {
				message = r.total+' '+(r.total == 1 ? 'person':'people')+' online';
			}
			
			users.push('<p class="count">'+message+'</p>');
			
			$('#chatUsers').html(users.join(''));
			
			setTimeout(callback,10000);
		});
	},

	getAllUsersTimeout : function(callback){
		chat.getAllUsers();

		setTimeout(callback, 15000);
	},

	getAllUsers : function(){
		$.chatGET('isAdmin', function(r){
			if(r == 1){
				$.chatGET('getAllUsers',function(r){
					if(r.error){
						chat.displayError(r.error);
					}
					else{
						$('#users tr:not(:first)').remove();

						$.each(r.users, function(i, e){
							var isActive = $("<input/>",{
								class: "ckbIsActive",
								type: "checkbox",
								checked: e.isActive == 1 ? "checked" : ""
							});

							var isAdmin = $("<input>",{
								class: "ckbIsAdmin",
								type: "checkbox",
								checked: e.isAdmin == 1 ? "checked" : ""
							});

							var isLoggedIn = $("<input>",{
								type: "checkbox",
								disabled: "disabled",
								checked: e.isLoggedIn == 1 ? "checked" : ""
							});

							var btnUpdate = $("<div/>", {class: "blueButton"}).text("update").click(function(){
								
								var isActiveVal = $(this).parents('tr').find('.ckbIsActive').is(':checked') ? 1 : 0;
								var isAdminVal = $(this).parents('tr').find('.ckbIsAdmin').is(':checked') ? 1 : 0;

								$.chatPOST('updateUser', "username=" + e.name + "&isActive=" + isActiveVal + "&isAdmin=" + isAdminVal, function(r){
									if(r.error){
										chat.displayError(r.error);
									}
								});
							});

							var btnDelete = $("<div/>", {class: "blueButton"}).text("delete").click(function(){
								$.chatPOST('deleteUser', "username=" + e.name, function(r){
									if(r.error){
										chat.displayError(r.error);
									}									
								});

								$(this).parents('tr').remove();
							});

							// <td>" + isActive + "</td><td>" + e.isAdmin + "</td><td>" + e.isLoggedIn + "</td>
							var row = $("<tr><td>" + e.name + "</td></tr>");
							row.append($("<td/>").html(isActive));
							row.append($("<td/>").html(isAdmin));
							row.append($("<td/>").html(isLoggedIn));

							row.append($("<td/>").html(btnUpdate));
							row.append($("<td/>").html(btnDelete));

							$('#users').append(row);
							console.log(row);
						});
					}
				});
			}
		});
	},
	
	// This method displays an error message on the top of the page:
	
	displayError : function(msg){
		var elem = $('<div>',{
			id		: 'chatErrorMessage',
			html	: msg
		});
		
		elem.click(function(){
			$(this).fadeOut(function(){
				$(this).remove();
			});
		});
		
		setTimeout(function(){
			elem.click();
		},5000);
		
		elem.hide().appendTo('body').slideDown();
	}
};

// Custom GET & POST wrappers:

$.chatPOST = function(action,data,callback){
	$.post('php/ajax.php?action='+action,data,callback,'json');
}

$.chatGET = function(action,data,callback){
	$.get('php/ajax.php?action='+action,data,callback,'json');
}

// A custom jQuery method for placeholder text:

$.fn.defaultText = function(value){
	
	var element = this.eq(0);
	element.data('defaultText',value);
	
	element.focus(function(){
		if(element.val() == value){
			element.val('').removeClass('defaultText');
		}
	}).blur(function(){
		if(element.val() == '' || element.val() == value){
			element.addClass('defaultText').val(value);
		}
	});
	
	return element.blur();
}