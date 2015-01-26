(function(window, document) {

	// Object with items of errors
	var errorLog = {
		allErrorsCount: 0
	};

	// 'Error item' constructor
	function ErrorLog(token, fileUrl, message, line, column, fileName) {
		var self = this;

		self.mg = message;
		self.fn = fileName;
		self.fu = fileUrl;
		self.ln = line;
		self.cn = column;
		self.tn = token;

		self.ct = 1;
		self._increaseCount = function() {
			self.ct += 1;
		};
	}

	// Set 'error' handlers
	// IE8-IE10
	if (typeof (window.attachEvent) == 'function') {
		window.attachEvent('onerror', errorHandlerOldBrowsers);
	// Modern browsers, except Opera 12.17-
	} else if (typeof (window.addEventListener) == 'function' && !window.opera) {
		window.addEventListener('error', errorHandler, false);
	// Other browsers
	} else {
		window.onerror = errorHandlerOldBrowsers;
	}

	// Function-wrap for error handler in old browsers
	function errorHandlerOldBrowsers(){
		var errorMessage = {
			message: arguments[0],
			filename: arguments[1],
			lineno: arguments[2],
			colno: arguments[3] || 0
		};
		errorHandler(errorMessage);
	}

	// Parse error message and create new 'error item'
	function errorHandler(errorMessage) {

		// Filter to avoid logging unnecessary errors
		switch (errorMessage.message) {
			// 'same-origin policy' (http://stackoverflow.com/questions/5913978/cryptic-script-error-reported-in-javascript-in-chrome-and-firefox) and 'AdBlock' errors
			case 'Script error.':
				return;
		}

		// Stop logging if the page occurred more than 20 errors
		if (errorLog.allErrorsCount > 20) return;

		// Get token
		var token = '';
		var tokenElement = document.getElementById('token_js');
		if (tokenElement) token = tokenElement.getAttribute('content');

		// Parse full url to file and get filename
		var fileName = '';
		var regEx = /^http\:\/\/[a-z0-9\.\/-_]+\/([a-z0-9_\.-]+)\.(js|html)/i; 
		var fileNameArr = regEx.exec(errorMessage.filename);
		if (fileNameArr) fileName = fileNameArr[1] + '.' + fileNameArr[2];

		// Compose unique 'errorID'
		var errorID = fileName + '---' + errorMessage.lineno + '---' + errorMessage.colno;

		// Stop logging if the error continues more than 2 times (e.c. in loops)
		if (typeof(errorLog[errorID]) == 'object' && errorLog[errorID].counts >= 2) {
			return;
		// If the current error has been repeated
		} else if (typeof errorLog[errorID] == 'object') {
			errorLog[errorID]._increaseCount();
			errorLog.allErrorsCount += 1;
		// If the current error had appeared for the first time
		} else {
			errorLog[errorID] = new ErrorLog(token, errorMessage.filename, errorMessage.message, errorMessage.lineno, errorMessage.colno, fileName);
			errorLog.allErrorsCount += 1;
		}

		// Encode current error
		var postData = JSON.stringify(errorLog[errorID]);
		// Send current error to server
		sendRequest(errorID + '=' + postData);

		// When return true, error alerts (like in older versions of Internet Explorer) will be suppressed
		return true;
	}

	// Send data to server
	function sendRequest(data) {
		new Image().src = '/ajx/error_log.php?' + data;
	}

})(window, document);