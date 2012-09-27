(function() {

    "use strict";

    function debug(obj) {
        var str = '';

        if (obj === null) {
            str = 'null';
        }
        else {
            switch (typeof(obj)) {
                case 'undefined':
                    str = 'undefined';
                    break;
                case 'boolean':
                    str = obj ? 'true' : 'false';
                    break;
                case 'number':
                case 'string':
                    str = obj;
                    break;
                default:
                    if (obj instanceof Array) {
                        str = obj.toSource();
                    }
                    else {
                        for (var a in obj) {
                            try {
                                if (obj[a] instanceof Function) {
                                    str += a +'()\n';
                                }
                                else {
                                    str += a +': '+ obj[a] +'\n';
                                }
                            }
                            catch (e) {
                                str += a +': unknown\n';
                            }
                        }
                    }
            }
        }

        return str;
    }

	var typeAhead = {
		bindEvents: function(node) {
			node.addEventListener('keyup', typeAhead.keyup, true);
			node.addEventListener('keypress', typeAhead.keypress, true);
			node.addEventListener('keydown', typeAhead.keypress, true);
			node.addEventListener('blur', typeAhead.blur, true);
		},

		blur: function(evt) {
			var previewNode = evt.target.parentNode.getElementsByClassName('typeahead-preview')[0];
			typeAhead.cancel(previewNode);
		},

		keypress: function(evt) {
			switch (evt.keyCode) {
				case 13: //RETURN
				case 14: //ENTER
					evt.preventDefault();
					evt.stopPropagation();
                    break;

				case 40: //KEY_DOWN
				case 38: //KEY_UP
                    var previewNode = evt.target.parentNode.getElementsByClassName('typeahead-preview')[0];
					typeAhead.selection(evt, previewNode);
					break;
			}
		},

		selection: function(evt, previewNode) {
            if (evt.type != "keypress") {
                return;
            }

			var selected = previewNode.getElementsByClassName('selected')[0];

			if (evt.keyCode == 38 && selected.previousSibling) {
				selected.removeAttribute('class');
				selected.previousSibling.setAttribute('class', 'selected');
			}
			else if (evt.keyCode == 40 && selected.nextSibling) {
				selected.removeAttribute('class');
				selected.nextSibling.setAttribute('class', 'selected');
			}
		},

		cancel: function(previewNode) {
			previewNode.style.display = 'none';
		},

		select: function(evt, previewNode) {
			var selected = previewNode.getElementsByClassName('selected')[0].textContent;
			var elem = evt.target.value.substring(0, evt.target.selectionStart).split(',').length - 1;
			var pieces = evt.target.value.split(',');

			pieces[elem] = selected;

			var out = [];
			pieces.forEach(function(a) { out.push(a.trim()); });

			evt.target.value = out.join(', ');

			typeAhead.cancel(previewNode);
		},

		type: function(evt, pieces, type, previewNode) {
			var xhr = new XMLHttpRequest();

			xhr.onreadystatechange = function() {
			    if (xhr.readyState == 4 && xhr.status == 200) {
					var tags = JSON.parse(xhr.responseText).data;
					var suggestions = [];

					for (var i = 0; i < tags.length; i++) {
						if (tags[i].substring(0, type.length) == type) {
							suggestions.push(tags[i]);
						}
					}

					if (suggestions.length) {
						previewNode.style.display = 'block';

						while (previewNode.childNodes.length) {
							previewNode.removeChild(previewNode.childNodes[0]);
						}

						for (var i = 0; i < suggestions.length; i++) {
							var li = previewNode.appendChild(document.createElement('li'));

							var m = suggestions[i].indexOf(type);

                            if (m > 0) {
                                li.appendChild(document.createTextNode(suggestions[i].substring(0, m)));
                            }

                            var em = li.appendChild(document.createElement('em'));
                            em.appendChild(document.createTextNode(type));

                            li.appendChild(document.createTextNode(suggestions[i].substring(m + type.length)));

							if (i == 0) {
								li.setAttribute('class', 'selected');
							}
						}
					}
					else {
						typeAhead.cancel(previewNode);
					}

					document.getElementById('preview').innerHTML = type +' '+ suggestions.toSource() +' '+ evt.keyCode;
			    }
			};

			xhr.open('GET', '/tags/typeahead/'+ type);
			xhr.send(null);
		},

		keyup: function(evt) {
			var pieces = evt.target.value.substring(0, evt.target.selectionStart).split(',');
			var type = pieces[pieces.length - 1].trim();
			var previewNode = evt.target.parentNode.getElementsByClassName('typeahead-preview')[0];

			if (!type) {
				typeAhead.cancel(previewNode);
				return;
			}

			switch (evt.keyCode) {
				case 13:
				case 14:
					typeAhead.select(evt, previewNode);
					break;

				case 40:
				case 38:
                    evt.preventDefault();
                    evt.stopPropagation();
					break;

				case 27:
					typeAhead.cancel(previewNode);
					break;

				default:
					typeAhead.type(evt, pieces, type, previewNode);
					break;
			}
		},

		init: function() {
			var typeahead = document.getElementsByClassName('typeahead');

			for (var i = 0; i < typeahead.length; i++) {
				var input = typeahead[i];

				if (!input.src) {
					continue;
				}

				typeAhead.bindEvents(input);
			}
		}
	};

	window._ = {
		'typeAhead': typeAhead.init
	};

    function xhr(method, params) {
        switch (method) {
            case 'GET': case 'PUT': case 'POST': case 'DELETE': case 'PATCH': case 'TRACE': case 'HEAD':
                this.method = method;
                break;

            default:
                throw "Exception";
        }

        this.xhr = new XMLHttpRequest();
        /*
        this.xhr.open(method, uri);

        this.xhr.setRequestHeader('Content-type', 'application/json');
        this.xhr.setRequestHeader('Content-length', data.length);
        this.xhr.setRequestHeader('Connection', 'close');
        */
    }

    xhr.prototype.load = function(id) {
        this.id = id;

        return this;
    }

    xhr.prototype.callback = function(cb) {
        if (!cb instanceof Function) {
            throw "Not a Function";
        }

        this.cb = cb;

        return this;
    }

    xhr.prototype.send = function(uri, data) {
        var xhr = this.xhr;

        xhr.open(this.method, uri);

        if (this.params) {
            for (var header in this.params) {
                xhr.setRequestHeader(a, this.params[header]);
            }
        }
        else {
            if (data) {
                data = JSON.stringify(data);

                xhr.setRequestHeader('Content-type', 'application/json');
                xhr.setRequestHeader('Content-length', data.length);
            }
            else {
                xhr.setRequestHeader('Content-length', 0);
            }

            xhr.setRequestHeader('Connection', 'close');
        }

        var self = this;

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                switch (xhr.status) {
                    case 200:
                        if (self.cb) {
                            self.cb(xhr);
                        }
                        else if (self.id) {
                            document.getElementById(self.id).innerHTML = xhr.responseText;
                        }
                        break;

                    case 302:
                        window.alert('wtf');
                        //TODO check return for... URL regex? same domain?
                        document.location = xhr.responseText;
                        break;

                    default:
                        break;
                }
            }
            else if (xhr.status == 302) {
                window.alert('wtf yea');
                //TODO check return for... URL regex? same domain?
                //document.location = xhr.responseText;
            }
            window.alert(xhr.status + '');
        }

        xhr.send(this.data);

        return this;
    }

    var form = {
        serialize:
            function(id) {
                var form = document.getElementById(id);
                var formdata = {};

                for (var i = 0; i < form.elements.length; i++) {
                    var cur = form.elements[i];
                    if (!cur.name) {
                        continue;
                    }

                    if (cur.nodeName.toLowerCase() == 'select' && cur.multiple) {
                        formdata[cur.name] = [];

                        for (var j = 0; j < cur.options.length; j++) {
                            if (cur.options[j].selected) {
                                formdata[cur.name].push(cur.options[j].value);
                            }
                        }
                    }
                    else if (cur.type.toLowerCase() == 'checkbox') {
                        if (cur.checked) {
                            if (formdata[cur.name]) {
                                formdata[cur.name].push(cur.value);
                            }
                            else {
                                formdata[cur.name] = [cur.value];
                            }
                        }
                        else if (!formdata[cur.name]) {
                            formdata[cur.name] = [];
                        }
                    }
                    else {
                        formdata[cur.name] = cur.value;
                    }
                }

                return formdata;
            }
    };

    window.etl = {
        'form': {
            serialize: form.serialize
        },
        'debug': debug,
        'xhr': xhr
    };
})();

