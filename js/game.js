/*
Game
*/

var Game = function(){
	this.scene;
	this.renderer;
	this.camera;

	this.ball;
	this.field = {
		w: 120,
		l: 80,
		h: 6
	};
	this.players = [];

	this.theta = 0;
};

Game.prototype.init = function(dist) {

	var renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.shadowMapWidth = 2048;
	renderer.shadowMapHeight = 2048;
	renderer.shadowMapType = THREE.PCFSoftShadowMap;
	renderer.setClearColor( 0xCCCCCC , 0);

	this.renderer = renderer;

	document.body.appendChild(this.renderer.domElement);


	this.scene = new THREE.Scene();
	this.scene.fog = new THREE.FogExp2( 0xCCCCCC , 0.002 );


	this.origDist = dist || 200;
	var camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.x = 0;
	camera.position.y = 40;
	camera.position.z = this.origDist;
	this.camera = camera;


	this.addLights();

	this.addFloor();

	this.addField();

	this.addFootball();

	this.addPlayers();
};

Game.prototype.addLights = function() {
	var light = new THREE.AmbientLight(0x404040);
	this.scene.add(light);

	var pointLight = new THREE.PointLight(0xFFFFFF);

	pointLight.position.x = 100;
	pointLight.position.y = 500;
	pointLight.position.z = 100;

	this.scene.add(pointLight);

	var dl = new THREE.DirectionalLight(0xFFFFFF);

	dl.position.x = 25;
	dl.position.y = 125;
	dl.position.z = 25;

	dl.shadowMapHeight = dl.shadowMapWidth = 1024*2;

	dl.shadowCameraLeft = -128;
	dl.shadowCameraRight = 128;
	dl.shadowCameraTop = 128;
	dl.shadowCameraBottom = -128;

	dl.castShadow = true;
	dl.shadowDarkness = 0.7;
	//dl.shadowCameraVisible = true;

	this.scene.add(dl);
}

Game.prototype.addFloor = function() {
	var floorMaterial = new THREE.MeshBasicMaterial({
		color: 0x999999,
		side: THREE.DoubleSide });

	var floorGeometry = new THREE.CircleGeometry( 30*200, 200, 0, Math.PI * 2 );

	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.rotation.x = 90*(Math.PI/180);
	floor.position.y = -15;
	floor.receiveShadow = false;

	this.scene.add(floor);

	var shadowGeo = new THREE.PlaneGeometry( this.field.w , this.field.l );
	var shadowMat = new THREE.MeshBasicMaterial({ color: '#333333' });
	var fShadow = new THREE.Mesh(shadowGeo, shadowMat);
	fShadow.rotation.x = -90*(Math.PI/180);
	fShadow.position.y = -10;

	this.scene.add(fShadow);
};

Game.prototype.addField = function() {
	var field = this.field;
	var geometry = new THREE.BoxGeometry( field.w, field.h, field.l );

	var fieldTexture = THREE.ImageUtils.loadTexture('textures/field.jpg');
	fieldTexture.anisotropy = this.renderer.getMaxAnisotropy();
	var fieldMat = new THREE.MeshPhongMaterial({ map: fieldTexture, color: "#999999" });

	var sideMat = new THREE.MeshPhongMaterial({ color: '#999999' });

	var materials = [
		sideMat,
		sideMat,
		fieldMat,
		new THREE.MeshPhongMaterial({ color: '#000000' }),
		sideMat,
		sideMat
	];
	
	var material = new THREE.MeshFaceMaterial( materials );

	mesh = new THREE.Mesh( geometry, material );
	mesh.receiveShadow = true;

	this.scene.add( mesh );
}

Game.prototype.addPlayers = function() {

	var per_team = 11;
	var num_bots = per_team*2;

	var mat = new THREE.MeshPhongMaterial({ color: "#ffff00" });
	var mat2 = new THREE.MeshPhongMaterial({ color: "#ff00ff" });

	for (var i = 0; i < num_bots; i++) {
		var geo = new THREE.SphereGeometry(1.5, 16, 16);

		if (i == per_team)
			mat = mat2;

		var mesh = new THREE.Mesh(geo, mat);
		mesh.position.y = 4.6;
		var pos = this.randFieldPos();
		mesh.position.x = pos.x;
		mesh.position.z = pos.y;

		mesh.castShadow = true;

		this.scene.add(mesh);
		this.players.push(mesh);
	}
};

Game.prototype.addFootball = function() {
	var ballContainer = new THREE.Object3D();

	var texture = THREE.ImageUtils.loadTexture('textures/Football.jpg');
	var geometry = new THREE.SphereGeometry(3, 32, 16);
	var material = new THREE.MeshPhongMaterial({
		map: texture
	});
	var ball = new THREE.Mesh(geometry, material);

	ball.castShadow = true;

	this.ball = ball;

	ballContainer.position.y = 6;
	ballContainer.add(ball);

	var dir = new THREE.Vector3( 1, 0, 0 );
	var origin = new THREE.Vector3( 0, 0, 0 );
	var length = 10;
	var hex = 0xffff00;

	var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
	ballContainer.add(arrowHelper);

	this.scene.add(ballContainer);

	var self = this;

	setInterval(function(){

		var a = { x: ballContainer.position.x, y: ballContainer.position.z };
		var b = self.randFieldPos();

		var aV = new THREE.Vector2(a.x, a.y) 
		var bV = new THREE.Vector2(b.x, b.y);
		var angle = Math.acos( aV.dot(bV) / (aV.length() * bV.length()) );

		console.log(angle);

		ball.rotation.z = Math.PI/6;

		var tween = new TWEEN.Tween(a)
			.to(b, 1500)
			.easing( TWEEN.Easing.Cubic.Out )
			.onUpdate( function () {
				ballContainer.position.x = this.x;
				ballContainer.position.z = this.y;

				//todo: rotate properly along motion
				// rate, direction, flight through air
				//ball.rotation.x += 0.1;
			} )
			.start();

	}, 2000);
};

Game.prototype.randFieldPos = function() {
	var randin = function(dim, pad) {
		pad = pad || 1;
		return (Math.random()*dim - dim/2) * pad;
	};

	var pos = {};
	pos.x = randin(this.field.w, 0.9);
	pos.y = randin(this.field.l, 0.9);
	return pos;
};


Game.prototype.onWindowResize = function() {
	this.camera.aspect = window.innerWidth / window.innerHeight;
	this.camera.updateProjectionMatrix();

	this.renderer.setSize( window.innerWidth, window.innerHeight );
};

Game.prototype.render = function(head) {
	
	this.theta += 0.004;

	var ratio = head.z/this.origDist;

	var camDist = (this.origDist + (head.z - initial.z)* 3).clamp(50, this.origDist*1.3);

	var camera = this.camera;
	
	if (webcamReady && started) {
		camera.position.x = camDist * Math.sin(this.theta);// (head.x - initial.x) * 4;
		camera.position.y = 40 + (head.y - initial.y);
		camera.position.z = camDist * Math.cos(this.theta);
		//_cc.position = cc.position;

		camera.rotation.z = Math.PI/2 - head.angle/2;
	}
	
	camera.lookAt(this.scene.position);

	this.renderer.render( this.scene, this.camera );
}
