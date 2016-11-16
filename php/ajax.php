<?php

/* Database Configuration. Add your details below */

$dbOptions = array(
	'db_host' => 'remote-mysql4.servage.net',
	'db_user' => 'aitec',
	'db_pass' => 'Detwodeleutanzt5',
	'db_name' => 'aitec'
);

/* Database Config End */

//report everything except notice
error_reporting(E_ALL ^ E_NOTICE);

require "classes/DB.class.php";
require "classes/Chat.class.php";
require "classes/ChatBase.class.php";
require "classes/ChatLine.class.php";
require "classes/ChatUser.class.php";

session_name('webchat');
session_start();

try{
	
	// Connecting to the database
	DB::init($dbOptions);
	
	$response = array();
	
	// Handling the supported actions:
	
	switch($_GET['action']){
		case 'isAdmin':
			$response = Chat::isAdmin();
		break;

		case 'login':
			$response = Chat::login($_POST['name'],$_POST['password']);
		break;
		
		case 'register':
			$response = Chat::register($_POST['name'],$_POST['email'],$_POST['password']);
		break;

		case 'checkLogged':
			$response = Chat::checkLogged();
		break;
		
		case 'logout':
			$response = Chat::logout();
		break;
		
		case 'submitChat':
			$response = Chat::submitChat($_POST['chatText']);
		break;
		
		case 'getUsers':
			$response = Chat::getUsers();
		break;

		case 'getAllUsers':
			$response = Chat::getAllUsers();
		break;
		
		case 'getChats':
			$response = Chat::getChats($_GET['lastID']);
		break;
		
		default:
			throw new Exception('Wrong action');
	}
	
	echo json_encode($response);
}
catch(Exception $e){
	die(json_encode(array('error' => $e->getMessage())));
}

?>