(function($) {

	var get_element = function() {
		// if the toolbar print button exists ... we can try
		var $print = $(".toolbar a.print.button-text");

		if ($print.length) {
			// remove this for room and what I like
			$print.parent().parent().find("a.save-to-myconnect.button-text").parent().remove();
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
		distance = parseFloat(distance[0].trim().replace(/[^0-9.]+/g, ""));

		return {
			value: distance < 50 ? distance.toFixed(2) : Math.round(distance),
			units: units
		};
	};

	var get_date = function() {
		var garmin_date_string = injectScript(function(){ return BEGIN_TIMESTAMP });
		var garmin_date = new Date(garmin_date_string);

		return {
			mm: "0{0}".format(garmin_date.getMonth()+1).slice(-2),
			dd: "0{0}".format(garmin_date.getDate()).slice(-2),
			yy: "{0}".format(garmin_date.getFullYear())
		};
	};

	var get_time = function() {
		var time_table = $("#timeSummary");
		var time = time_table.find("td:contains('Time:'):first").next("td").text().trim().split(":");
		var moving_time = time_table.find("td:contains('Moving Time:'):first").next("td").text().trim().split(":");

		// use moving time if there
		if (moving_time.length > 1) {
			time = moving_time;
		}

		// make sure we have 3 values
		while (time.length < 3) {
			time.unshift("");
		}

		// hh_mm_ss
		return {
			hh: +time[0] ? time[0] : "",
			mm: +time[1] ? time[1] : "",
			ss: +time[2] ? time[2] : ""
		};
	};

	var get_comments = function() {
		var comment = $("#discriptionValue").text().trim();
		var url = "{0}".format(window.location.href);

		return "{0}\n\nLink:\n{1}".format(comment, url);
	};

	// properties as methods
	var garmin = {};
	Object.defineProperty(garmin, "element",  { get: get_element });
	Object.defineProperty(garmin, "distance", { get: get_distance });
	Object.defineProperty(garmin, "comments", { get: get_comments });
	Object.defineProperty(garmin, "activity", { get: get_activity });
	Object.defineProperty(garmin, "mm_dd_yy", { get: get_date });
	Object.defineProperty(garmin, "hh_mm_ss", { get: get_time });

	/**
	 * global object to store garmin specific items in
	 */
	$.globals = $.globals || {};
	$.extend($.globals, {
		garmin: garmin
	});

})(window.jQuery);
