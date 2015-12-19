var m = {
	"lang": "en",
	"name": "Super Racer 2000",
	"short_name": "Racer2K",
	"icons": [{
		"src": "icon/lowres",
		"sizes": "64x64",
		"type": "image/webp"
	}, {
		"src": "icon/hd_small",
		"sizes": "64x64"
	}, {
		"src": "icon/hd_hi",
		"sizes": "128x128",
		"density": 2
	}],
	"splash_screens": [{
		"src": "splash/lowres",
		"sizes": "320x240"
	}, {
		"src": "splash/hd_small",
		"sizes": "1334x750"
	}, {
		"src": "splash/hd_hi",
		"sizes": "1920x1080",
		"density": 3
	}],
	"scope": "/racer/",
	"start_url": "/racer/start.html",
	"display": "fullscreen",
	"orientation": "landscape",
	"theme_color": "aliceblue",
	"background_color": "red"
};

(function() {

	var manifest;
	if (!window.URL && window.webkitURL) window.URL = window.webkitURL;

	function getImageMimeType(imgurl, userdata) {
		return new Promise(function(resolve, reject) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", "https://crossorigin.me/" + imgurl, true);
			xhr.onload = function() {
				clearTimeout(tAbort);
				if (xhr.status == 200) {
					var img = new Image();
					img.onload = function() {
						resolve({
							url: imgurl,
							actualSize: img.naturalWidth + "x" + img.naturalHeight,
							userdata: userdata,
							mimetype: xhr.getResponseHeader("Content-Type")
						});
					};
					img.onerror = function() {
						reject(Error("Image load request failed"));
					};
					img.src = imgurl;
				} else {
					reject(Error("Mime-type request failed with status " + xhr.status + " and message " + xhr.statusText));
				}
			};
			xhr.onerror = function() {
				reject(Error("Network error"));
			};
			var tAbort = setTimeout(function() {
				xhr.abort();
				reject(Error("Mime-type request timed out"));
			}, 1000);
			xhr.send();
		});
	}

	function reflect(promise) {
		return promise.then(function(v) {
				return {
					v: v,
					status: "resolved"
				};
			},
			function(e) {
				return {
					e: e,
					status: "rejected"
				};
			});
	}

	function setDownloadUrl() {
		var a = document.getElementById('dl');
		if (a) {
			window.URL.revokeObjectURL(a.href);
		}
		var bb = new Blob([JSON.stringify(manifest, null, 2)], {
			type: "text/plain"
		});
		a.href = window.URL.createObjectURL(bb);
	}

	function display(errors) {
		document.querySelector("pre").firstChild.nodeValue = JSON.stringify(manifest, null, 2);
		document.getElementById("dl").style.display = "inline";
		var errel = document.getElementById("errors");
		errel.innerHTML = "";
		var ul = document.createElement("ul");
		errors.forEach(function(err) {
			var li = document.createElement("li");
			li.appendChild(document.createTextNode(err));
			ul.appendChild(li);
		});
		errel.appendChild(ul);
		document.querySelector("pre").classList.remove("pong-loader");
	}

	var rFullscreens = Array.prototype.slice.call(document.querySelectorAll("[name=fullscreen]"));
	function updateUserSelections() {
		var errors = [];
		manifest.orientation = document.querySelector("[name=orientation]:checked").value;
		if (manifest.orientation === "none") delete manifest.orientation;
		manifest.background_color = document.getElementsByName("bgcolor")[0].value;
		//manifest.theme_color = document.getElementsByName("themecolor")[0].value;
		manifest.name = document.getElementsByName("name")[0].value;
		manifest.short_name = document.getElementsByName("short_name")[0].value;
		if (manifest.short_name.length > 12) {
			errors.push("Warning: short_name should be 12 characters or less");
		}
		manifest.display = rFullscreens.filter(function(f) { return f.checked; })[0].value;
		return errors;
	}

	function parse(html) {
		var d = document.createElement("div"), errors = [];
		d.innerHTML = html;
		manifest = {};
		var mimeTypeFetches = [];

		// Basic data
		var title = d.querySelector("title");
		if (title) {
			document.getElementsByName("name")[0].value = title.textContent.substr(0,45);
			document.getElementsByName("short_name")[0].value = title.textContent.substr(0,12);
		}

		// Language: can't pull this out of d because the html element doesn't get inserted, so, regexps it is. Sorry, Tony the Pony
		var langmatch = html.match(/<html [^>]*\blang="([^"]+)"[^>]*>/i);
		if (langmatch) {
			manifest.lang = langmatch[1];
		}

		// User selections
		errors = errors.concat(updateUserSelections());

		// Apple touch icons
		[].slice.call(d.querySelectorAll('link[rel="apple-touch-icon"][href],link[rel="apple-touch-icon-precomposed"][href]')).forEach(function(l) {
			mimeTypeFetches.push(getImageMimeType(l.getAttribute("href"), {
				sizes: l.getAttribute("sizes")
			}));
		});

		Promise.all(mimeTypeFetches.map(reflect)).then(function(results) { // we know they all pass because they're reflected
			manifest.icons = results.filter(function(r) {
				return r.status == "resolved";
			}).map(function(r) {
				return {
					src: r.v.url,
					type: r.v.mimetype,
					sizes: r.v.userdata.sizes,
					actualSize: r.v.actualSize
				};
			});
			if (manifest.icons.filter(function(i) { return i.sizes === "144x144"; }).length === 0) {
				manifest.icons.push({
					src: "YOU-NEED-TO-HAVE-A-144-x-144-ICON.png", sizes: "144x144", type: "image/png"
				});
			}
			display(errors);
		});
	}

	function get(url) {
		console.log("fetching...");
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "https://crossorigin.me/" + url, true);
		xhr.onload = function() {
			if (xhr.status == 200) {
				parse(xhr.responseText);
			} else {
				alert("didn't work. Soz.");
				document.querySelector("pre").classList.remove("pong-loader");
			}
		};
		xhr.send();
	}

	[].slice.call(document.querySelectorAll("input[type=radio],input[type=color],input[type=checkbox]")).forEach(function(widget) {
		widget.addEventListener("change", function(e) {
			if (manifest) {
				display(updateUserSelections());
			}
		}, false);
	});
	[].slice.call(document.querySelectorAll("input[type=text]")).forEach(function(widget) {
		widget.addEventListener("input", function(e) {
			if (manifest) {
				updateUserSelections();
				display(updateUserSelections());
			}
		}, false);
	});

	document.getElementById("dl").addEventListener("click", setDownloadUrl, false);

	document.querySelector("form").addEventListener("submit", function(e) {
		e.preventDefault();
		document.querySelector("pre").classList.add("pong-loader");
		get(document.querySelector("input[type=url]").value);
	}, false);
})();
