
var stats, meter;

var clock = new THREE.Clock();

var game;

var htracker;

var origDist = 100;
var currDist = null;

var head = {x: 0, y: 0, z: 0, angle: 0};

var initial = {
	x: 0,
	y: 0,
	z: 0
};

var needsInit = true;
var webcamReady = false;
var started = false;


Number.prototype.clamp = function(min, max) {
	return Math.min(Math.max(this, min), max);
};

init();

function init() {

	game = new Game();

	game.init(origDist);

	animate();

	setupUI();

	setupTracking();

	window.addEventListener( 'resize', game.onWindowResize.bind(game) , false );
}

function setupTracking() {
	var videoInput = document.getElementById('vid');
	var canvasInput = document.getElementById('compare');
	var canvasOverlay = document.getElementById('overlay')
	var debugOverlay = document.getElementById('debug');
	var overlayContext = canvasOverlay.getContext('2d');

	var debugContext = debugOverlay.getContext('2d');

	var settings = {
		ui: 1, // false
		fadeVideo: 1, //true
		debug : debugOverlay,
		calcAngles: true
	};

	var statusMessages = {
		'whitebalance' : 'checking for stability of camera whitebalance',
		'detecting' : 'detecting face',
		'hints' : 'hmm. detecting the face is taking a long time',
		'redetecting' : 'lost track of face, redetecting',
		'lost' : 'lost track of face',
		'found' : 'tracking humanoid face'
	};

	var supportMessages = {
		'no getUserMedia' : 'Unfortunately, the getUserMedia API is not supported in your browser. Try <a href="http://google.com/chrome">downloading Chrome</a> or <a href="http://caniuse.com/stream">another browser that supports getUserMedia</a>. Now using fallback video for facedetection.',
		'no camera' : 'No camera found. Using fallback video for facedetection.'
	};

	// figure out good params for usage?
	//headtrackr.controllers.three.realisticAbsoluteCameraControl(camera, 55, [0,0,0], new THREE.Vector3(0,100,0), {damping : 0.5});

	htracker = new headtrackr.Tracker(settings);
	htracker.init(videoInput, canvasInput);
	htracker.start();

	document.addEventListener('headtrackrStatus', function(ev) {
		var mediamsg = $('#gUMMessage');
		var htmsg = $('#headtrackerMessage');
		
		if (ev.status in supportMessages) {
			var msg = '';
			if (ev.status == 'no getUserMedia') {
				msg = supportMessages[ev.status];
			} else if (ev.status == 'no camera') {
				msg = supportMessages[ev.status];
			} else { //camera, so clear, no this doesn't work
				msg = '';
			}

			mediamsg.html(msg);
		} else if (ev.status in statusMessages) {
			webcamReady = true;
			$('#intro-msg').html('everything looks good');
			var msg = statusMessages[ev.status];
			console.log(ev.status, msg);
			htmsg.html(msg);
		}

	}, true);

	document.addEventListener('headtrackingEvent', function(ev) {

		head.x = ev.x.toFixed(2);
		head.y = ev.y.toFixed(2);
		head.z = ev.z.toFixed(2);

		if (needsInit) {
			initial.x = head.x;
			initial.y = head.y;
			initial.z = head.z;
			needsInit = false;
		}

		updateTrackingUI();
	});

	document.addEventListener('facetrackingEvent', function(ev) {
		head.angle = ev.angle;
	});

}

function updateTrackingUI() {
	var pcs = ['x:', head.x, ' y:', head.y, 'z: ', head.z];
	var dataStr = pcs.join(' ');

	var _headAngle = (head.angle * (180/Math.PI)).toFixed(1);

	var info = $('#tracking-info');
	info.html(dataStr + '<span class="pull-right">'+_headAngle+'&deg;</span>');
}

function setupUI() {
	var $start = $('#start');
	var $helper = $('#helper');

	$start.on('mousedown', function(ev){
		if (webcamReady) return;

		$helper.animate({
			opacity: 1,
		}, 1000/60*4, function() { });

		$helper.fadeTo(60, 1);
	});

	$start.on('mouseup', function(ev){
		if (webcamReady) return;
		$helper.fadeTo(300, 0.0);
	});

	$start.on('click', function(ev){
		if (!webcamReady) {
			console.log('webcam not enabled');
		} else {
			started = true;
			$('#intro').fadeOut(500, function(ev){
				$('#intro').remove(); });
		}
	});


	$('#reinit-btn').on('click', function(ev){
			if (!webcamReady) return;
			htracker.stop();htracker.start();
			origDist = null;
		});

	var $sidebar = $('#sidebar');

	$('#modes').on('click', '.btn', function(ev){
		var $this = $(ev.currentTarget);
		$this.siblings().removeClass('selected');
		$this.addClass('selected');
	});
}

function animate() {
	var delta = clock.getDelta();

	requestAnimationFrame( animate );
	
	TWEEN.update();

	//if (webcamReady)
		game.render(head);
}

