function CustomKeyboard(place, config, translations, callback) {
	this.place = null;
	this.config = {
		id: 'default',
		layoutPath: 'numpad.html.snippet',
		decimalSeparator: ',',
		alwaysOn: false
	};
	this.translations = {};
	
	console.log(this);
	this.initialize(place, config, translations, callback);
};

CustomKeyboard.prototype.VK_ESCAPE = 'VK_ESCAPE';
CustomKeyboard.prototype.VK_BACKSPACE = 'VK_BACKSPACE';
CustomKeyboard.prototype.VK_RETURN = 'VK_RETURN';
CustomKeyboard.prototype.VK_DECIMAL_SEPARATOR = 'VK_DECIMAL_SEPARATOR';

CustomKeyboard.prototype.initialize = function(place, config, translations, callback) {
	var self = this;
	this.place = place;

	if (typeof(config) === 'object') for (var item in config) this.config[item] = config[item];
	if (typeof(translations) === 'object') for (var item in translations) this.translations[item] = translations[item];
	
	if (this.config.alwaysOn || Modernizr.touch) {
		$.get(this.config.layoutPath, function(responseText, status, xhr) {
			self.config.layout = responseText;
			
			self.draw();
			$('body').on('blur.customKeyboard', 'input[data-keyboard="' + self.config.id + '"]', function(ev) { self.handleBlur(ev); });
			$('body').on('focus.customKeyboard', 'input[data-keyboard="' + self.config.id + '"]', function(ev) { self.handleFocus(ev); });
			$('body').on('click.customKeyboard', 'input[data-keyboard="' + self.config.id + '"]', function(ev) { self.handleClick(ev); });
			self.place.find('.key[data-value]').on('click', function(ev) { self.handleVirtualKeyPress(ev); });
			
			if (typeof(callback) === 'function') callback();
		});
	}
	else if (typeof(callback) === 'function') callback();
};

CustomKeyboard.prototype.handleClick = function(ev) {
	console.log('click', ev);
}

CustomKeyboard.prototype.handleBlur = function(ev) {
	console.log('blur', ev);
}

CustomKeyboard.prototype.handleFocus = function(ev) {
	var self = this;
	//console.log('focus', ev);
	//setTimeout(function() { // Makes android work but flashes the keyboard. Horrible.
		self.latestSelected = $(ev.currentTarget);
		self.lastCaret = self.getCaret(ev.currentTarget);
		self.latestSelected.blur();
		self.show();
	//}, 1);
	
}

CustomKeyboard.prototype.getCaret = function(el) { 
	
	if (el.selectionStart) return el.selectionStart; 
	else if (document.selection) { 
		el.focus(); 
		
		var r = document.selection.createRange(); 
		if (r === null) return 0;
		
		var re = el.createTextRange(), 
		rc = re.duplicate(); 
		re.moveToBookmark(r.getBookmark()); 
		rc.setEndPoint('EndToStart', re); 
		
		return rc.text.length; 
	}  
	return 0;
}

CustomKeyboard.prototype.customKeyPress = function(keyValue) {
	if (
		!((typeof(this.latestSelected) === 'undefined') ||
		(typeof(this.latestSelected) === 'null'))
	) {
		switch (keyValue) {
			case this.VK_BACKSPACE:
				var currentVal = this.latestSelected.val();
				this.latestSelected.val(
					currentVal.substring(0, this.lastCaret - 1) +
					currentVal.substring(this.lastCaret, currentVal.length)
				);
				--this.lastCaret;
				if (this.lastCaret < 0) this.lastCaret = 0;
			break;
			case this.VK_ESCAPE:
				this.hide();
			break;
			case this.VK_RETURN:
				var currentVal = this.latestSelected.val();
				this.latestSelected.val(
					currentVal.substring(0, this.lastCaret) +
					'\n' +
					currentVal.substring(this.lastCaret, currentVal.length)
				);
				this.lastCaret += keyValue.length;
			break;
			case this.VK_DECIMAL_SEPARATOR:
			default:
				var currentVal = this.latestSelected.val();
				keyValue = keyValue === this.VK_DECIMAL_SEPARATOR ? this.config.decimalSeparator : keyValue;
				this.latestSelected.val(
					currentVal.substring(0, this.lastCaret) +
					keyValue +
					currentVal.substring(this.lastCaret, currentVal.length)
				);
				this.lastCaret += keyValue.length;
			break;
		}
	}
}



CustomKeyboard.prototype.handleVirtualKeyPress = function(ev) {
	var current = $(ev.currentTarget);
	var keyValue = current.attr('data-value');
	//console.log('virtualkeypress', ev, keyValue);
	this.customKeyPress(keyValue);
}

CustomKeyboard.prototype.handleActualKeyboard = function(ev, keyUp) {
	
	var handleKey = false;
	var keyValue = null;
	
	if (keyUp) { // Keys that are handled on key up.
		if (ev.which === 27) {
			keyValue = this.VK_ESCAPE;
			handleKey = true;
		}
	}
	else { // Keys that are handled on key press.
		if (ev.which === 13) {
			keyValue = this.VK_RETURN;
			handleKey = true;
		}
		else if (ev.which === 8) {
			keyValue = this.VK_BACKSPACE;
			handleKey = true;
		}
		else {
			keyValue = String.fromCharCode(ev.which);
			handleKey = ev.which > 0;
		}
	}
	
	//console.log('handleActualKeyboard', ev.which, keyValue);
	if (handleKey) {
		ev.stopPropagation();
		ev.preventDefault();
		this.customKeyPress(keyValue);
	}
}

CustomKeyboard.prototype.draw = function() {
	this.place.empty().addClass('CustomKeyboard').append(this.config.layout);
	var self = this;
	
	// We need both to handle special keys like Escape key.
	$(document).on('keypress.customKeyboard', function(ev) { self.handleActualKeyboard(ev, false); });
	$(document).on('keyup.customKeyboard', function(ev) { self.handleActualKeyboard(ev, true); });
};

CustomKeyboard.prototype.show = function() {
	var self = this;
	$('body').append('<div class="plasticWrap"></div>');
	
	$('.plasticWrap').mousedown(function(ev) {
		self.hide();
		//console.log(ev);
		var underlyingElement = document.elementFromPoint(ev.clientX, ev.clientY);
		//	$('body').append(underlyingElement.tagName);
		if (underlyingElement.tagName === 'INPUT') $(underlyingElement).focus();
	});
	
	this.place.addClass('visible');
}

CustomKeyboard.prototype.hide = function() {
	this.place.removeClass('visible');
	$('body').find('.plasticWrap').remove();
	this.latestSelected = null;
}
