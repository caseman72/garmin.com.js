(function() {
	/**
	 * A dictionary of header settings, keyed using the URLs supplied in the Options page
	 */
	var headersPerUrl = {"https://www.workoutlog.com/log/":[{"name":"Access-Control-Allow-Origin","value":"HTTP_ORIGIN"},{"name":"Access-Control-Allow-Credentials","value":"true"}]};

	/**
	 * Cache with of request specific data
	 */
	var requestIds = [];

	/**
	 * Returns the index of a given header object in the provided array
	 * @param headerArray The Array to search in
	 * @param newHeader The header to find
	 * @return {int} The index of the header, or -1 if not found in the Array
	 */
	function getHeaderIndex(headerArray, newHeader) {
		for (var i = 0, len = headerArray.length; i < len; i++) {
			var currentHeader = headerArray[i];
			if (currentHeader.hasOwnProperty('name') && currentHeader.name == newHeader.name) {
				return i;
			}
		}

		return -1;
	}

	function mergeNewHeaders(originalHeaders, newHeaders, origin) {
		//copy the headers for our own usage
		var mergedHeaders = originalHeaders.slice();
		for (var i = 0, len = newHeaders.length; i < len; i++) {
			var thisHeader = newHeaders[i];

			//skip if both are blank
			if (thisHeader.name || thisHeader.value) {
				var index = getHeaderIndex(mergedHeaders, thisHeader);

				//issue #9 - fix - use new object to not over-write passed in reference
				if (thisHeader.value === "HTTP_ORIGIN") {
					thisHeader = {
						name: thisHeader.name,
						value: origin
					};
				}

				//if a matching header is defined, replace it
				//if not, add the new header to the end
				if (index > -1) {
					mergedHeaders[index] = thisHeader;
				} else {
					mergedHeaders.push(thisHeader);
				}
			}
		}

		return mergedHeaders;
	}

	/**
	 * Looks for a set of headers that match the provided URL
	 * @param url {String} The URL of the currently executing request
	 * @param headersPerUrl {Object} dictionary object using URL as key
	 */
	function matchUrlToHeaders(url, headersPerUrl) {
		for (var key in headersPerUrl) {
			//this match is expecting that the user will specify URL domain
			//so key==http://www.foo.com && url==http://www.foo.com/?x=bar&whatever=12
			//maybe support regex in the future
			if (url.indexOf(key) > -1) {
				return headersPerUrl[key];
			}
		}
		return null;
	}

	/**
	 * Responds to Chrome's onHeadersReceived event and injects all headers defined for the given URL
	 * @param info {Object} Contains the request info
	 * @see http://code.google.com/chrome/extensions/webRequest.html#event-onHeadersReceived
	 */
	function onHeadersReceivedHandler(info) {
		var desiredHeaders = matchUrlToHeaders(info.url, headersPerUrl);

		if (!desiredHeaders)
			return {};

		if (displayCount) {
			chrome.browserAction.setBadgeText({ text:(++alteredCount).toString()});
		}

		var request = getRequestAndCleanUp(info);
		var origin = request ? request.origin : "*"; // default to all if nothing is found

		return { responseHeaders: mergeNewHeaders(info.responseHeaders, desiredHeaders, origin) };
	}

	/**
	 * Responds to Chrome's onBeforeSendHeaders event and finds 'origin' or 'referer' header for use later
	 * @param info {Object} Contains the request info
	 * @see http://code.google.com/chrome/extensions/webRequest.html#event-onBeforeSendHeaders
	 */
	function onBeforeSendHeadersHandler(info) {
		var origin = null;

		for (var i = 0, len = info.requestHeaders.length; i < len; i++) {
			var header = info.requestHeaders[i];
			if (header.name === "Origin") { // be done
				origin = header.value;
				break;
			}
			if (header.name === "Referer") { // keep going
				origin = header.value;
			}
		}

		//push on to stack
		if (origin) {
			requestIds.push({
				requestId: info.requestId,
				origin: origin,
				expiration: Math.round(info.timeStamp) + 10E3
			});
		}

		return {requestHeaders: info.requestHeaders};
	};

	/**
	 * Find the request and garbage collect the other requests. This should clean up orphan requests.
	 * @param info {Object} Contains the request info
	 */
	function getRequestAndCleanUp(info) {

		var requestId = info.requestId;
		var now = Math.ceil(info.timeStamp);

		var request = null;

		// Array.prototype.filter method
		// - callback ~ return true (keep) or false (remove)
		//  - finds the current element - fitlered
		//  - return true (keep) if now is less than expiration
		//
		requestIds = requestIds.filter(function(elem) {
			if (elem.requestId === requestId) {
				request = elem;
				return false;
			}
			return (now < elem.expiration);
		});

		return request;
	}

	/**
	 * Responds to Chrome's onErrorOccurred event
	 * @param info {Object} Contains the request info
	 * @see http://code.google.com/chrome/extensions/webRequest.html#event-onErrorOccurred
	 */
	function onErrorOccurredHandler(info) {
		//still works but Chrome still complains ... this is the only property that is different from a normal request
		if (info.type !== "xmlhttprequest") {
			console.log('ForceCORS was unable to modify headers for: '+info.url +' - '+info.error);
		}
	}

	function init() {
		//when the user updates the settings via the Options page, we need to remove and re-add the listener
		//especially to update the URL filters
		if (chrome.webRequest.onHeadersReceived.hasListener(onHeadersReceivedHandler)) {
			chrome.webRequest.onHeadersReceived.removeListener(onHeadersReceivedHandler)
		}
		chrome.webRequest.onHeadersReceived.addListener(onHeadersReceivedHandler, {urls: ["https://www.workoutlog.com/log/*"] }, ["blocking", "responseHeaders"]);

		//same logic
		if (chrome.webRequest.onBeforeSendHeaders.hasListener(onBeforeSendHeadersHandler)) {
				chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeadersHandler)
		}
		chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeadersHandler, {urls: ["https://www.workoutlog.com/log/*"] }, ["requestHeaders"]);

		//dido
		if (chrome.webRequest.onErrorOccurred.hasListener(onErrorOccurredHandler)) {
			chrome.webRequest.onErrorOccurred.removeListener(onErrorOccurredHandler);
		}
		chrome.webRequest.onErrorOccurred.addListener(onErrorOccurredHandler, {urls: ["https://www.workoutlog.com/log/*"] });

		//let chrome know
		chrome.webRequest.handlerBehaviorChanged();
	}
	init();

})();