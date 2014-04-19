(function($) {

	var get_element = function() {
		// if the toolbar print button exists ... we can try
		var $print = $(".toolbar a.print.button-text");

		if ($print.length) {
			// go up to 'li'
			$print = $print.parent();

			// up to 'ul' then remove 'li' for room and what I like
			$print.parent().find("a.save-to-myconnect.button-text").parent().remove();
		}

		// this is not in the toolbar but remove anyways
		$(".facebook-like-button").remove();

		return $print;
	};

	var get_activity = function() {
		return $("#activityTypeValue").text().trim();
	};

	var get_distance = function() {
		var distance = $("td.summaryTableLabel:contains('Distance')").next("td").text().trim().split(" ");
		var units = distance.length > 1 ? distance[1].trim() : "";

		// 50 or less use 2 digits, else round to int
		distance = distance[0].trim().replace(/[^0-9.]+/g, "");
		distance = distance ? parseFloat(distance) : 0;

		return {
			value: distance < 50 ? distance.toFixed(2) : Math.round(distance),
			units: units
		};
	};

	var get_date = function() {
		var garmin_date_string = injectScript(function(){ return BEGIN_TIMESTAMP });
		var garmin_date = new Date(garmin_date_string);

		var monday_date = new Date(garmin_date_string);
		if (monday_date.getDay() === 1) {
			// if monday - go to tuesday
			monday_date.setDate(monday_date.getDate()+7);
		}
		else {
			// find the next week's monday
			while (monday_date.getDay() !== 1) {
				monday_date.setDate(monday_date.getDate()+1);
			}
		}

		return {
			monday_mm: "0{0}".format(monday_date.getMonth()+1).slice(-2),
			monday_dd: "0{0}".format(monday_date.getDate()).slice(-2),
			monday_yy: "{0}".format(monday_date.getFullYear()),
			mm: "0{0}".format(garmin_date.getMonth()+1).slice(-2),
			dd: "0{0}".format(garmin_date.getDate()).slice(-2),
			yy: "{0}".format(garmin_date.getFullYear())
		};
	};

	var get_time = function() {
		var time_table = $("#timeSummary");
		var time = time_table.find("td:contains('Time:'):first").next("td").text().trim();

		// Use summary time if no time in time_table
		if (!time) {
			time = $("td.summaryTableLabel:contains('Time'):first").next("td").text().trim();
		}

		// use moving time if there
		var moving_time = time_table.find("td:contains('Moving Time:'):first").next("td").text().trim();
		if (moving_time) {
			time = moving_time;
		}

		// make sure we have 3 values
		time = time.split(":");
		while (time.length < 3) {
			time.unshift("");
		}

		// hh_mm_ss
		return {
			hh: +time[0] ? time[0] : "",
			mm: +time[0] || +time[1] ? time[1] : "",
			ss: +time[1] || +time[2] ? time[2] : ""
		};
	};

	var get_comments = function() {
		var comment = $("#discriptionValue").text().trim();
		return "{0}\n\nLink:\n{1}".format(comment, get_url());
	};

	var get_url = function () {
		return "{0}".format(window.location.href).replace(/#.*$/, "");
	};

	var get_id = function() {
		return "{0}".format(window.location.href).replace(/^.*?\/activity\/([0-9]+).*$/, "$1");
	}

	var get_tcx_file = function() {
		var garmin_id = get_id();

		return $.ajax({
			type: "GET",
			url: "http://connect.garmin.com/proxy/activity-service-1.1/tcx/activity/{0}?full=true".format(garmin_id),
			dataType: "text"
		});
		// then(function(tcx) { });
	};

	// properties as methods
	var garmin = {tcx_data: ""};
	Object.defineProperty(garmin, "id",       { get: get_id });
	Object.defineProperty(garmin, "url",      { get: get_url });
	Object.defineProperty(garmin, "element",  { get: get_element });
	Object.defineProperty(garmin, "distance", { get: get_distance });
	Object.defineProperty(garmin, "comments", { get: get_comments });
	Object.defineProperty(garmin, "activity", { get: get_activity });
	Object.defineProperty(garmin, "mm_dd_yy", { get: get_date });
	Object.defineProperty(garmin, "hh_mm_ss", { get: get_time });
	Object.defineProperty(garmin, "tcx_blob", { get: get_tcx_file });

	/**
	 * global object to store garmin specific items in
	 */
	$.globals = $.globals || {};
	$.extend($.globals, {
		garmin: garmin
	});

})(window.jQuery);
