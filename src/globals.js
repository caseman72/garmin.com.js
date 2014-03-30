(function($) {
	/**
	 * global object to store garmin specific items in
	 */
	$.globals = $.globals || {};
	$.extend($.globals, {
		units_to_id: {
			"mi": "4",
			"km": "2",
			"yd": "3",
			"m": "1",
			"steps": "5"
		},
		activity_to_id: {
			"Bike"       : "149931",
			"CrossTrain" : "150662",
			"Rest"       : "149936",
			"Run"        : "149933",
			"Spin"       : "178280",
			"Strength"   : "149932",
			"Stretch"    : "149934",
			"Swim"       : "149935"
		},
		label_to_activity: {
			// running
			"Running": "Run",
			"Street Running": "Run",
			"Track Running": "Run",
			"Trail Running": "Run",
			"Treadmill Running": "Run",

			// cross train
			"Hiking": "CrossTrain",
			"Walking": "CrossTrain",
			"Casual Walking": "CrossTrain",
			"Speed Walking": "CrossTrain",

			// bike
			"Cycling": "Bike",
			"Cyclocross": "Bike",
			"Downhill Biking": "Bike",
			"Mountain Biking": "Bike",
			"Road Cycling": "Bike",
			"Track Cycling": "Bike",

			// spin
			"Recumbent Cycling": "Spin",
			"Indoor Cycling": "Spin",

			// crosstrain
			"Fitness Equipment": "CrossTrain",
			"Elliptical": "CrossTrain",
			"Indoor Cardio": "CrossTrain",
			"Stair Climbing": "CrossTrain",

			// strength
			"Indoor Rowing": "Strength",
			"Strength Training": "Strength",

			// swim
			"Swimming": "Swim",
			"Lap Swimming": "Swim",
			"Open Water Swimming": "Swim"
		}
	});

})(window.jQuery);
