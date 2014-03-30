(function($) {
	var login_text = [
		'<div id="workoutlog-login" title="WorkoutLog Login">',
		'<form name="l" method="post" data-action="http://my.workoutlog.com/log/login-confirm.cfm">',
		'	<input name="frompage" value="/log/index.cfm" type="hidden">',
		' <label>Username:</label>',
		'	<br>',
		'	<input name="username" value="" type="text" style="width: 90%;">',
		'	<br>',
		' <label>Password:</label>',
		'	<br>',
		'	<input name="password" value="" type="password" style="width: 90%;">',
		'	<br>',
		'	<input name="x" value="25" type="hidden">',
		'	<input name="y" value="8" type="hidden">',
		'</form>',
		'</div>',
	].join("");

	/**
	 * global object to store garmin specific items in
	 */
	$.globals = $.globals || {};
	$.extend($.globals, {
		login_text: login_text
	});
})(window.jQuery);
