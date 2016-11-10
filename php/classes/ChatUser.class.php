<?php

class ChatUser extends ChatBase{
	
	protected $name = '',
	$gravatar = '',
	$password = '',
	$isActive = 0,
	$isAdmin = 0,
	$isLoggedIn = 0;
	
	public function save(){
		
		DB::query("
			INSERT INTO webchat_users (name, gravatar, password)
			VALUES (
				'".DB::esc($this->name)."',
				'".DB::esc($this->gravatar)."',
				'".DB::esc($this->password)."'
		)");
		
		return DB::getMySQLiObject();
	}
	
	public function update(){
		DB::query("
			INSERT INTO webchat_users (name, gravatar, password)
			VALUES (
				'".DB::esc($this->name)."',
				'".DB::esc($this->gravatar)."',
				'".DB::esc($this->password)."'
			) ON DUPLICATE KEY UPDATE last_activity = NOW()");
	}
}

?>