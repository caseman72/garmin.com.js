(function($) {

	var get_ids = function(monday_date_string, open_dialog) {
		var params = {
			"_": new Date().getTime()
		};

		// if we pass in a date - use the monday - prev to find ids
		if (monday_date_string) {
			params = {
				previous: 1,
				datWorkoutWeek: monday_date_string,
				"_": params._ 
			};
		}

		return $.ajax({
				type: "GET",
				xhrFields: {
					withCredentials: true
				},
				url: "http://173.203.199.228/log/athlete/workoutlog-week.cfm?{0}".format($.param(params))
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

	var get_activity = function() {
		var garmin_date_string = "{mm}/{dd}/{yy}".format($.globals.garmin.mm_dd_yy);
		var garmin_activity = $.hash_get($.globals.label_to_activity, $.globals.garmin.activity, "");
		var garmin_url = $.globals.garmin.url; 

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

	var add_activity = function(date_string, open_dialog) {
		return $.ajax({
			type: "POST",
			xhrFields: {
				withCredentials: true
			},
			url: "http://173.203.199.228/log/athlete/workoutlog-week.cfm",
			data: "adddate={0}&datWorkoutWeek={0}&StartDate={0}&Add.x=24&Add.y=10".format(encodeURIComponent(date_string))
		}).
		then(function() {
			var monday_date_string = "{monday_mm}/{monday_dd}/{monday_yy}".format($.globals.garmin.mm_dd_yy);
			return get_ids(monday_date_string, open_dialog);
		});
	};

	var update_activity = function(data, activity) {
		return $.ajax({
			type: "POST",
			xhrFields: {
				withCredentials: true
			},
			url: "http://173.203.199.228/log/athlete/workoutlog-week.cfm",
			data: data
		}).
		then(function() {
			return activity;
		});
	};

	var upload_tcx = function(tcx_data, activity) {
		// upload the file to api
		return $.ajax({
			type: "GET",
			xhrFields: {
				withCredentials: true
			},
			url: "http://173.203.199.228/log/athlete/gpsfiles/selectGarminUploadMethod.cfm?woLogID={0}".format(activity.id)
		}).
		then(function(/* html */) {
			var fd = new FormData();
			fd.append("statusText", "");
			fd.append("filename", new Blob([tcx_data], {type: "application/octet-stream"}), "activity_{0}.tcx".format($.globals.garmin.id));
			fd.append("workoutType", activity.wol_activity_id);
			fd.append("uploadStatus", "Upload in progress, please wait...");

			return $.ajax({
				type: "POST",
				xhrFields: {
					withCredentials: true
				},
				url: "http://173.203.199.228/log/athlete/gpsfiles/uploadFromGarmin.cfm",
				cache: false,
				contentType: false,
				processData: false,
				data: fd
			}).
			then(function(html) {
				if (/returnStatus\s*=\s*"0"/.test(html)) {
					var params = {};

					// find params in code ... sketchy
					html.
						replace(/document\.forms\[0\]\.([^.]+)\.value\s*=\s*(["']?)([\s\S]*?)\2;/g, function(str, key, quote_not_used, value) {
							params[key] = value;
							return str;
						});

					return $.ajax({
						type: "POST",
						xhrFields: {
							withCredentials: true
						},
						url: "http://173.203.199.228/log/athlete/gpsfiles/uploadFromGarmin.cfm?mode=add",
						data: params
					}).
					then(function() {
						return activity;
					});
				}
				return activity;
			});
		});
	};

	var login = function(data) {
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

	var logout = function(e) {
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

	// properties as methods
	var workoutlog = {
		get_ids: get_ids,
		add_activity: add_activity,
		update_activity: update_activity,
		upload_tcx: upload_tcx,
		login: login,
		logout: logout
	};

	Object.defineProperty(workoutlog, "activity", { get: get_activity });

	/**
	 * global object to store garmin specific items in
	 */
	$.globals = $.globals || {};
	$.extend($.globals, {
		workoutlog: workoutlog
	});

})(window.jQuery);
