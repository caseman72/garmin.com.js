(function($) {
	var dialog_text = [
		'<div id="workoutlog-dialog" title="WorkoutLog Export">',
		'<div style="float:right"><a class="logout" href="#logout" title="Logout">Logout</a></div>',
		'<form name="f" method="post" data-action="http://my.workoutlog.com/log/athlete/workoutlog-week.cfm">',
		'	<input name="workoutlogid" value="{id}" type="hidden">',
		'	<select name="WorkoutTypeID_{id}">',
		'		<option value="">Type</option>',
		'		<option value="Bike">Bike</option>',
		'		<option value="CrossTrain">CrossTrain</option>',
		'		<option value="Rest">Rest</option>',
		'		<option value="Run">Run</option>',
		'		<option value="Spin">Spin</option>',
		'		<option value="Strength">Strength</option>',
		'		<option value="Stretch">Stretch</option>',
		'		<option value="Swim">Swim</option>',
		'	</select>',
		'	<br>',
		'',
		'	<input name="distance_{id}" value="" size="6" maxlength="8" type="text">',
		'	<select name="unitsid_{id}">',
		'		<option></option>',
		'		<option value="4">mi</option>',
		'		<option value="2">km</option>',
		'		<option value="3">yd</option>',
		'		<option value="1">m</option>',
		'		<option value="5">steps</option>',
		'	</select>',
		'	<br>',
		'',
		'	<input name="hours_{id}" value="hh" size="2" maxlength="2" onfocus="if(document.f.hours_{id}.value==\'hh\'){document.f.hours_{id}.value=\'\';document.f.hours_{id}.select();}" type="text">&nbsp;:',
		'	<input name="minutes_{id}" value="mm" size="2" maxlength="2" onfocus="if(document.f.minutes_{id}.value==\'mm\'){document.f.minutes_{id}.value=\'\';document.f.minutes_{id}.select();}" type="text">&nbsp;:',
		'	<input name="seconds_{id}" value="ss" size="2" maxlength="2" onfocus="if(document.f.seconds_{id}.value==\'ss\'){document.f.seconds_{id}.value=\'\';document.f.seconds_{id}.select();}" type="text">',
		'	<div style="float:right; margin-top: 5px;"><input id="include_tcx" type="checkbox" /><label for="include_tcx">Upload TCX file</label></div>',
		'	<br>',
		'	<br>',
		' <label>Comments:</label>',
		'	<br>',
		'	<textarea wrap="soft" name="Comments_{id}" rows="6" style="width: 90%; resize: none;"></textarea>',
		'	<br>',
		'</form>',
		'</div>',
	].join("").format({id: ""});

	/**
	 * global object to store garmin specific items in
	 */
	$.globals = $.globals || {};
	$.extend($.globals, {
		dialog_text: dialog_text
	});
})(window.jQuery);

