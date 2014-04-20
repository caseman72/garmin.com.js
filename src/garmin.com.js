$(function() {
	/**
	 * global object to store garmin specific items in
	 */
	$.globals = $.globals || {};
	$.extend($.globals, {
		logged_in: false,
		button_pushed: false,
		id_to_object: {},
	});

	var $print = $.globals.garmin.element;
	if (!$print.length) return;

	var request = $.globals.workoutlog.get_ids(null, open_dialog);
	var open_dialog = function(id) {
		// from initial call do nothing
		if ((request && request.readyState > 0 && request.readyState < 4) || (id && !$.globals.button_pushed)) {
			return;
		}
		request = null;

		$.globals.logged_in ? build_dialog() : build_login();
	};

	var build_dialog = function() {
		// close the other ones
		$(".ui-dialog-content").dialog("close");

		// distance
		var distance_units = $.globals.garmin.distance;
		var units_id = $.hash_get($.globals.units_to_id, distance_units.units, "");

		// activity
		var activity = $.hash_get($.globals.label_to_activity, $.globals.garmin.activity, "");

		// time
		var hh_mm_ss = $.globals.garmin.hh_mm_ss;

		// status
		var $status_elem = $('<span style="float:left;">Status:<br><span class="status"></span>');
		var $status = $status_elem.find(".status");

		$($.globals.dialog_text).
			find("a.logout").click($.globals.workoutlog.logout).end().
			find("#include_tcx").click(function(e) {
				if (e.currentTarget.checked) {
					if ($.globals.garmin.tcx_data) {
						$status.text("Downloaded TCX data. Ready");
					}
					else {
						var log_button = $(".ui-dialog:visible").find(".ui-dialog-buttonpane button:first");
						log_button.button("disable");
						$status.text("Downloading TCX data");
						$.globals.garmin.tcx_blob.
							then(function(tcx_data) {
								$.globals.garmin.tcx_data = tcx_data;
								log_button.button("enable");
								$status.text("Downloaded TCX data. Ready");
							});
					}
				}
				else {
					$status.text("");
				}
			}).end().
			find("textarea[name='Comments_']").val($.globals.garmin.comments).end().
			find("select[name='WorkoutTypeID_']").val(activity).end().
			find("select[name='unitsid_']").val(units_id).end().
			find("input[name='distance_']").val(distance_units.value).end().
			find("input[name='hours_']").val(hh_mm_ss.hh).end().
			find("input[name='minutes_']").val(hh_mm_ss.mm).end().
			find("input[name='seconds_']").val(hh_mm_ss.ss).end().
			appendTo("body").
			dialog({
				autoOpen: false,
				width: 475,
				position: ["center", 275],
				buttons: {
					Log: function() {
						$status.text("Finding Activity on WorkoutLog").removeClass("error");

						var $self = $(this);
						var $form = $self.find("form");

						var monday_date_string = "{monday_mm}/{monday_dd}/{monday_yy}".format($.globals.garmin.mm_dd_yy);
						$.globals.workoutlog.get_ids(monday_date_string, open_dialog).
							then(function() {
								var activity = $.globals.workoutlog.activity;
								if (activity === "Not Found") {
									$status.text("Creating Activity on WorkoutLog");

									var garmin_date_string = "{mm}/{dd}/{yy}".format($.globals.garmin.mm_dd_yy);
									return $.globals.workoutlog.add_activity(garmin_date_string, open_dialog).
										then(function() {
											var activity = $.globals.workoutlog.activity;
											if (activity === "Not Found") {
												$status.text("Failed to create activity").addClass("error");
												return $.Deferred().reject({error:true});
											}
											else {
												$status.text("Found {0}".format(activity.id));
												return activity;
											}
										});
								}
								else {
									$status.text("Found {0}".format(activity.id));
									return activity;
								}
							}).
							then(function(activity) {
								$status.text("Updating Activity {0}".format(activity.id));

								// all the data from the form
								var data = "{0}".format($form.serialize()).
									replace(/WorkoutTypeID_=([^&]+)/, function(str_not_used, garmin_activity) {
										activity.wol_activity_id = $.hash_get(activity.to_id, garmin_activity, "");
										return "WorkoutTypeID_={0}".format(activity.wol_activity_id);
									}).
									replace(/_=/g, "_{0}=".format(activity.id)).
									replace(/workoutlogid=[&]/, "workoutlogid={0}&".format(activity.id));

								return $.globals.workoutlog.update_activity(data, activity); // promise
							}).
							then(function(activity) {
								if ($.globals.garmin.tcx_data && $form.find("#include_tcx").get(0).checked) {
									$status.text("Uploading TCX file to WorkoutLog");
									return $.globals.workoutlog.upload_tcx($.globals.garmin.tcx_data, activity); // promise
								}

								return activity;
							}).
							then(function(activity) {
								$status.text("Complete");
								return activity
							}).
							then(function(activity) {
								$self.dialog("close");
								return activity
							});
					},
					Cancel: function() {
						$status.text("");
						$(this).dialog("close");
					}
				}
			}).
			on("dialogopen", function() {
				$.globals.button_pushed = true;

				var $widget = $(this).dialog("widget");
				$widget.find(".ui-dialog-buttonpane").prepend($status_elem);
				$widget.find("a.logout").blur();
			}).
			on("dialogclose", function() {
				$.globals.button_pushed = false;
				$(this).dialog("destroy").remove();
			}).
			dialog("open");
	};

	var build_login = function() {
		// close the other ones
		$(".ui-dialog-content").dialog("close");

		// status
		var $status_elem = $('<span style="float:left;">Status:<br><span class="status"></span>');
		var $status = $status_elem.find(".status");

		$($.globals.login_text).
			find("input[type='text'],input[type='password']").on("keypress", function(e) {
				var enter_key = $.ui.keyCode.ENTER;
				if ((e.which && e.which === enter_key) || (e.keyCode && e.keyCode === enter_key)) {
					e.preventDefault();
					$(".ui-dialog:visible").find(".ui-dialog-buttonpane button:first").click();
				}
			}).end().
			appendTo("body").
			dialog({
				autoOpen: false,
				position: ["center", 275],
				width: 375,
				buttons: {
					Login: function() {
						$status.text("Please wait").removeClass("error");

						// login
						$.globals.workoutlog.login($(this).find("form").serialize()).
							then(function() {
								$.globals.logged_in
									? build_dialog()
									: $status.text("Error: Login Failed").addClass("error");
							});
					},
					Cancel: function() {
						$(this).dialog("close");
					}
				}
			}).
			on("dialogopen", function() {
				$.globals.button_pushed = true;

				var $widget = $(this).dialog("widget");
				$widget.find(".ui-dialog-buttonpane").prepend($status_elem);
			}).
			on("dialogclose", function() {
				$(this).dialog("destroy").remove();
			}).
			dialog("open");
	};

	// clone the button to be added - the hard way
	var $clone = $("<li></li>").
		addClass($print.prop("class") || "").
		append(
			$print.
				find("a").
				clone(false).
				removeAttr("onclick").
				removeClass("print").
				addClass("export").
				attr("title", "WorkoutLog").
				text("WorkoutLog").
				prop("outerHTML")
		).
		on("click", function(e) {
			e.preventDefault()
			open_dialog();
		});

	// 'ul' then add 'li' to toolbar
	$print.parent().append( $clone );
});
