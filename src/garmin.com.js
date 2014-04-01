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

	var workoutlog_get_ids = function() {
		return $.ajax({
				type: "GET",
				xhrFields: {
					withCredentials: true
				},
				url: "http://173.203.199.228/log/athlete/workoutlog-week.cfm?_={0}".format(new Date().getTime())
			}).
			then(function(rsp) {
				// remove scripts and stop image from loading
				rsp = rsp.
					replace(/(<img[^>]*)src=/g, "$1data-").
					replace(/<script[\s\S]+?<\/script>/g, "");

				var $rsp = $(rsp);
				$.globals.logged_in = (!$rsp.find("form[name='frmParam']").length && $rsp.find("input[name='logout']").length);

				// check for not logged in
				if (!$.globals.logged_in) {
					return "Not Authorized";
				}

				// reset on each call
				$.globals.id_to_object = {};

				// else
				$rsp.find("select[onchange^='selectMore']").each(function(i_not_used, select) {
					var $attr = $(select).attr("onchange");
					var id_date = $attr.
							replace(/\\/g, "").
							replace(/^.*\.value,([0-9]+),'([0-9/]+)'.*$/, "$1,$2").
							split(",");

					var id = id_date[0].trim();
					var date_string = id_date[1].trim();

					var url = "";
					var comments = "{0}".format($rsp.find("textarea[name='Comments_{0}']".format(id)).val());
					var parts = /http:\/\/connect.garmin.com\/activity\/[0-9]+/.exec(comments);
					if (parts) { url = parts[0]; }

					// workout log activity
					var wol_act = $rsp.find("select[name='WorkoutTypeID_{0}']".format(id));

					// make hash of activity_to_id ~ everyone is different
					var activity_to_id = {};
					wol_act.find("option").each(function(i_not_used, option) {
						var $option = $(option);
						var id = "{0}".format($option.val()).trim();
						if (id) {
							activity_to_id["{0}".format($option.text()).trim()] = id;
						}
					});

					$.globals.id_to_object[id] = {
						id: id,
						url: url,
						activity: "{0}".format(wol_act.val()),
						to_id: activity_to_id,
						date_string: date_string
					}
				});

				return $.globals.id_to_object;
			}).
			then(function(id) {
				if (id === "Not Authorized") {
					open_dialog(id)
					return $.Deferred().reject({error:true});
				}
				return id;
			});
	};

	var find_activity = function() {
		var garmin_date_string = "{mm}/{dd}/{yy}".format($.globals.garmin.mm_dd_yy);
		var garmin_activity = $.hash_get($.globals.label_to_activity, $.globals.garmin.activity, "");
		var garmin_url = "{0}".format(window.location.href);

		var activity = "Not Found";
		$.each($.globals.id_to_object, function(wol_id_not_used, obj) {
			var wol_date = $.hash_get(obj, "date_string", "");
			var wol_act = $.hash_get(obj, "activity", "");
			var wol_url = $.hash_get(obj, "url", "");

			// MUST workoutlog date matches our date ... and
			if (wol_date === garmin_date_string &&
					(!wol_act || (wol_url && wol_url === garmin_url) || (wol_act && wol_act === garmin_activity))) {
					// no workoutlog activity - blank one
					//  - or -
					//            workoutlog has url and it matches
					//  - or -
					//                                                   workoutlog has activity and it matches
				activity = obj;
				return false; // stops the loop but returns id after
			}
		});

		return activity;
	};

	//
	var request = workoutlog_get_ids();

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
			find("a.logout").click(workoutlog_logout).end().
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
				// position: ["center", 250],
				buttons: {
					Log: function() {
						$status.text("Finding Activity on WorkoutLog.").removeClass("error");

						var $self = $(this);
						var $form = $self.find("form");

						workoutlog_get_ids().
							then(function() {
								var activity = find_activity();
								if (activity === "Not Found") {
									$status.text("Creating Activity on WorkoutLog");

									var garmin_date_string = "{mm}/{dd}/{yy}".format($.globals.garmin.mm_dd_yy);
									return workoutlog_post(garmin_date_string).
										then(function() {
											var activity = find_activity();
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
								// all the data from the form
								var data = "{0}".format($form.serialize()).
									replace(/WorkoutTypeID_=([^&]+)/, function(str, garmin_activity) {
										return "WorkoutTypeID_={0}".format($.hash_get(activity.to_id, garmin_activity, ""));
									}).
									replace(/_=/g, "_{0}=".format(activity.id)).
									replace(/workoutlogid=[&]/, "workoutlogid={0}&".format(activity.id));

								return workoutlog_log(data); // primse
							}).
							then(function() {
								$self.dialog("close");
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
				$widget.find("a.logout").blur();
			}).
			on("dialogclose", function() {
				$.globals.button_pushed = false;
				$(this).dialog("destroy").remove();
			}).
			dialog("open");
	};

	var workoutlog_post = function(date_string) {
		return $.ajax({
			type: "POST",
			xhrFields: {
				withCredentials: true
			},
			url: "http://173.203.199.228/log/athlete/workoutlog-week.cfm",
			data: "adddate={0}&datWorkoutWeek={0}&StartDate={0}&Add.x=24&Add.y=10".format(encodeURIComponent(date_string))
		}).
		then(function() {
			return workoutlog_get_ids();
		});
	};

	var workoutlog_log = function(data) {
		return $.ajax({
			type: "POST",
			xhrFields: {
				withCredentials: true
			},
			url: "http://173.203.199.228/log/athlete/workoutlog-week.cfm",
			data: data
		});
	};

	var workoutlog_login = function(data) {
		return $.ajax({
			type: "POST",
			xhrFields: {
				withCredentials: true
			},
			url: "http://173.203.199.228/log/login-confirm.cfm",
			data: data
		}).
		then(function(rsp) {
			// remove scripts and stop image from loading
			rsp = rsp.
				replace(/(<img[^>]*)src=/g, "$1data-").
				replace(/<script[\s\S]+?<\/script>/g, "");

			var $rsp = $(rsp);
			$.globals.logged_in = (!$rsp.find("form[name='frmParam']").length && $rsp.find("input[name='logout']").length);

			return $.globals.logged_in
				? "Not Authorized"
				: "OK";
		});
	};

	var workoutlog_logout = function(e) {
		e.preventDefault();

		return $.ajax({
			type: "GET",
			xhrFields: {
				withCredentials: true
			},
			url: "http://173.203.199.228/log/logout.cfm?_={0}".format(new Date().getTime())
		}).
		then(function() {
			$(".ui-dialog-content").dialog("close");
			$.globals.logged_in = false;
		});
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
				width: 375,
				buttons: {
					Login: function() {
						$status.text("Please wait.").removeClass("error");

						// login
						workoutlog_login($(this).find("form").serialize()).
							then(function() {
								$.globals.logged_in
									? build_dialog()
									: $status.text("Error: Login Failed.").addClass("error");
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

	// clone the buttons to be added
	var $clone = $print.clone().
		removeAttr("onclick").
		removeClass("print").
		addClass("export").
		attr("title", "WorkoutLog").
		text("WorkoutLog").
		click(function() {
			open_dialog(); // no params
		});

	// add to toolbar
	$print.parent().parent().append( $clone.wrap("<li></li>") );

});
